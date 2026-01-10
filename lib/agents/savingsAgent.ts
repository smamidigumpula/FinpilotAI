import { AnalyticsAgent } from './analyticsAgent';
import { getDb } from '../mongodb';
import type { Insight, Transaction, Liability, InsurancePolicy } from '../types';
import { embedInsight } from '../embeddings';

export interface SavingsOpportunity {
  title: string;
  description: string;
  potentialMonthlySavings: number;
  category: string;
  actions: Array<{ label: string; query: string }>;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Savings Agent - Identifies opportunities to reduce expenses
 */
export class SavingsAgent {
  private analyticsAgent: AnalyticsAgent;

  constructor() {
    this.analyticsAgent = new AnalyticsAgent();
  }

  async findSavingsOpportunities(householdId: string): Promise<SavingsOpportunity[]> {
    const opportunities: SavingsOpportunity[] = [];

    // Check recurring subscriptions
    const subscriptions = await this.findSubscriptions(householdId);
    opportunities.push(...subscriptions);

    // Check high-interest debt
    const interestSavings = await this.findInterestReductionOpportunities(householdId);
    opportunities.push(...interestSavings);

    // Check insurance optimization
    const insuranceSavings = await this.findInsuranceSavings(householdId);
    opportunities.push(...insuranceSavings);

    // Check food/dining spending
    const foodSavings = await this.findFoodSavings(householdId);
    opportunities.push(...foodSavings);

    // Check category anomalies
    const anomalies = await this.analyticsAgent.detectAnomalies(householdId);
    for (const anomaly of anomalies.slice(0, 3)) {
      if (anomaly.deviation > 0) {
        opportunities.push({
          title: `Unusual spending in ${anomaly.category}`,
          description: `Your ${anomaly.category} spending is ${anomaly.deviation.toFixed(0)}% higher than your 6-month average.`,
          potentialMonthlySavings: anomaly.currentMonth - anomaly.averageMonth,
          category: anomaly.category,
          actions: [
            { label: 'Review transactions', query: `show transactions in ${anomaly.category}` },
            { label: 'Set budget limit', query: `set budget for ${anomaly.category}` },
          ],
          severity: anomaly.severity,
        });
      }
    }

    return opportunities.sort((a, b) => b.potentialMonthlySavings - a.potentialMonthlySavings);
  }

  private async findSubscriptions(householdId: string): Promise<SavingsOpportunity[]> {
    const db = await getDb();
    const collection = db.collection<Transaction>('transactions');

    const recurring = await this.analyticsAgent.getRecurringExpenses(householdId);

    // Group by merchant
    const merchantGroups = new Map<string, Transaction[]>();
    for (const tx of recurring) {
      if (tx.merchant) {
        const existing = merchantGroups.get(tx.merchant) || [];
        existing.push(tx);
        merchantGroups.set(tx.merchant, existing);
      }
    }

    const opportunities: SavingsOpportunity[] = [];

    // Common subscription merchants
    const subscriptionKeywords = [
      'netflix', 'spotify', 'amazon prime', 'disney', 'hulu', 'apple',
      'adobe', 'microsoft', 'salesforce', 'zoom', 'slack',
      'gym', 'fitness', 'yoga', 'classpass',
    ];

    for (const [merchant, transactions] of merchantGroups.entries()) {
      const lowerMerchant = merchant.toLowerCase();
      const isLikelySubscription = subscriptionKeywords.some((keyword) =>
        lowerMerchant.includes(keyword)
      );

      if (isLikelySubscription || transactions.length >= 6) {
        const monthlyTotal = transactions
          .slice(-6)
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / 6;

        opportunities.push({
          title: `Review subscription: ${merchant}`,
          description: `You're spending approximately $${monthlyTotal.toFixed(2)}/month on ${merchant}. Consider downgrading or canceling if not needed.`,
          potentialMonthlySavings: monthlyTotal * 0.5, // Assume 50% savings potential
          category: 'Subscriptions',
          actions: [
            { label: 'View transactions', query: `show transactions for ${merchant}` },
            { label: 'Cancel subscription', query: `cancel ${merchant}` },
          ],
          severity: monthlyTotal > 50 ? 'high' : monthlyTotal > 20 ? 'medium' : 'low',
        });
      }
    }

    return opportunities;
  }

  private async findInterestReductionOpportunities(householdId: string): Promise<SavingsOpportunity[]> {
    const db = await getDb();
    const collection = db.collection<Liability>('liabilities');

    const liabilities = await collection
      .find({ householdId })
      .sort({ apr: -1 })
      .toArray();

    const opportunities: SavingsOpportunity[] = [];

    for (const liability of liabilities) {
      if (liability.apr > 0.15 && liability.balance > 1000) {
        // High APR debt
        const monthlyInterest = (liability.balance * liability.apr) / 12;
        const potentialRefinanceRate = Math.min(0.12, liability.apr - 0.03); // Assume 3% reduction possible
        const newMonthlyInterest = (liability.balance * potentialRefinanceRate) / 12;
        const monthlySavings = monthlyInterest - newMonthlyInterest;

        opportunities.push({
          title: `Consider refinancing ${liability.type}`,
          description: `Your ${liability.name} has an APR of ${(liability.apr * 100).toFixed(2)}%. Refinancing could save approximately $${monthlySavings.toFixed(2)}/month.`,
          potentialMonthlySavings: monthlySavings,
          category: 'Interest Reduction',
          actions: [
            { label: 'Calculate payoff options', query: `show payoff options for ${liability.name}` },
            { label: 'Compare rates', query: `compare refinance rates` },
          ],
          severity: liability.apr > 0.20 ? 'high' : 'medium',
        });
      }
    }

    return opportunities;
  }

  private async findInsuranceSavings(householdId: string): Promise<SavingsOpportunity[]> {
    const db = await getDb();
    const collection = db.collection<InsurancePolicy>('insurance_policies');

    const policies = await collection.find({ householdId }).toArray();

    const opportunities: SavingsOpportunity[] = [];
    const totalMonthlyPremium = policies.reduce((sum, p) => sum + p.premiumMonthly, 0);

    // Check if bundling could save money
    if (policies.length >= 2) {
      const potentialBundlingSavings = totalMonthlyPremium * 0.15; // Assume 15% discount from bundling

      opportunities.push({
        title: 'Consider bundling insurance policies',
        description: `You have ${policies.length} separate insurance policies. Bundling could save approximately $${potentialBundlingSavings.toFixed(2)}/month.`,
        potentialMonthlySavings: potentialBundlingSavings,
        category: 'Insurance',
        actions: [
          { label: 'View all policies', query: 'show all insurance policies' },
          { label: 'Get bundling quotes', query: 'get insurance bundling quotes' },
        ],
        severity: potentialBundlingSavings > 50 ? 'high' : 'medium',
      });
    }

    // Check for high deductibles that could be optimized
    for (const policy of policies) {
      if (policy.premiumMonthly > 200 && policy.deductible > 2000) {
        // High premium with high deductible - could optimize
        const potentialSavings = policy.premiumMonthly * 0.10; // 10% savings potential

        opportunities.push({
          title: `Optimize ${policy.kind} insurance deductible`,
          description: `Your ${policy.kind} insurance has a high deductible. Adjusting deductible levels could reduce premium.`,
          potentialMonthlySavings: potentialSavings,
          category: 'Insurance',
          actions: [
            { label: 'Compare deductible options', query: `compare ${policy.kind} insurance options` },
          ],
          severity: 'medium',
        });
      }
    }

    return opportunities;
  }

  private async findFoodSavings(householdId: string): Promise<SavingsOpportunity[]> {
    const breakdown = await this.analyticsAgent.getSpendBreakdown(householdId);
    const foodCategories = breakdown.filter(
      (b) =>
        b.category.toLowerCase().includes('food') ||
        b.category.toLowerCase().includes('dining') ||
        b.category.toLowerCase().includes('groceries') ||
        b.category.toLowerCase().includes('restaurant')
    );

    const totalFoodSpend = foodCategories.reduce((sum, f) => sum + f.total, 0);
    const opportunities: SavingsOpportunity[] = [];

    if (totalFoodSpend > 800) {
      // High food spending
      const potentialSavings = totalFoodSpend * 0.15; // 15% savings potential

      opportunities.push({
        title: 'Optimize food spending',
        description: `You're spending $${totalFoodSpend.toFixed(2)}/month on food. Reducing dining out and optimizing grocery shopping could save $${potentialSavings.toFixed(2)}/month.`,
        potentialMonthlySavings: potentialSavings,
        category: 'Food & Dining',
        actions: [
          { label: 'View food transactions', query: 'show food and dining transactions' },
          { label: 'Set food budget', query: 'set monthly food budget' },
        ],
        severity: totalFoodSpend > 1200 ? 'high' : 'medium',
      });
    }

    return opportunities;
  }

  async generateInsights(householdId: string): Promise<Insight[]> {
    const opportunities = await this.findSavingsOpportunities(householdId);
    const insights: Insight[] = [];

    for (const opp of opportunities.slice(0, 10)) {
      const insight: Insight = {
        householdId,
        type: 'savings_opportunity',
        title: opp.title,
        body: opp.description,
        severity: opp.severity,
        createdAt: new Date(),
        actions: opp.actions,
        data: {
          potentialMonthlySavings: opp.potentialMonthlySavings,
          category: opp.category,
        },
      };

      // Embed the insight
      await embedInsight(insight);

      insights.push(insight);
    }

    // Store insights
    const db = await getDb();
    const collection = db.collection<Insight>('insights');
    if (insights.length > 0) {
      await collection.insertMany(insights);
    }

    return insights;
  }
}