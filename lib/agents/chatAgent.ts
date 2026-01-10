import { vectorSearch, createEmbedding, embedChatMessage } from '../embeddings';
import { getDb } from '../mongodb';
import type { ChatMessage, Transaction, Insight } from '../types';
import { AnalyticsAgent } from './analyticsAgent';
import { SavingsAgent } from './savingsAgent';

export interface ChatResponse {
  message: string;
  uiComponents?: any[];
  data?: any;
  actions?: Array<{ label: string; query: string }>;
}

/**
 * Chat/RAG Agent - Answers questions using vector search and context
 */
export class ChatAgent {
  private analyticsAgent: AnalyticsAgent;
  private savingsAgent: SavingsAgent;

  constructor() {
    this.analyticsAgent = new AnalyticsAgent();
    this.savingsAgent = new SavingsAgent();
  }

  async handleQuery(
    householdId: string,
    userQuery: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> {
    // Create embedding for the query
    const queryEmbedding = await createEmbedding(userQuery);

    // Retrieve relevant context
    const relevantTransactions = await vectorSearch(
      'transactions',
      queryEmbedding,
      { householdId },
      5
    );

    const relevantInsights = await vectorSearch(
      'insights',
      queryEmbedding,
      { householdId },
      5
    );

    // Store user message
    const userMessage: ChatMessage = {
      householdId,
      role: 'user',
      text: userQuery,
      createdAt: new Date(),
    };
    await embedChatMessage(userMessage);
    
    const db = await getDb();
    const chatCollection = db.collection<ChatMessage>('chat_messages');
    await chatCollection.insertOne(userMessage);

    // Determine intent and route to appropriate handler
    const queryLower = userQuery.toLowerCase();

    if (queryLower.includes('save') || queryLower.includes('reduce') || queryLower.includes('cut') || queryLower.includes('expense')) {
      return await this.handleSavingsQuery(householdId, userQuery, relevantInsights);
    }

    if (queryLower.includes('interest') || queryLower.includes('apr') || queryLower.includes('rate')) {
      return await this.handleInterestQuery(householdId, userQuery);
    }

    if (queryLower.includes('spending') || queryLower.includes('spend') || queryLower.includes('expense')) {
      return await this.handleSpendingQuery(householdId, userQuery);
    }

    if (queryLower.includes('income') || queryLower.includes('earn') || queryLower.includes('picture') || queryLower.includes('overview')) {
      return await this.handleOverviewQuery(householdId, userQuery);
    }

    if (queryLower.includes('insurance') || queryLower.includes('mortgage')) {
      return await this.handleInsuranceMortgageQuery(householdId, userQuery);
    }

    // Default: general answer with context
    return await this.handleGeneralQuery(householdId, userQuery, relevantTransactions, relevantInsights);
  }

  async handleSavingsQuery(
    householdId: string,
    query: string,
    relevantInsights: Insight[] = []
  ): Promise<ChatResponse> {
    const opportunities = await this.savingsAgent.findSavingsOpportunities(householdId);
    const topOpportunities = opportunities.slice(0, 5);
    const totalSavings = topOpportunities.reduce((sum, o) => sum + o.potentialMonthlySavings, 0);

    let message = `I found ${topOpportunities.length} opportunities to reduce your expenses:\n\n`;
    
    for (const opp of topOpportunities) {
      message += `• ${opp.title}: Save ~$${opp.potentialMonthlySavings.toFixed(2)}/month\n`;
    }

    message += `\n**Total potential monthly savings: $${totalSavings.toFixed(2)}**\n\n`;
    message += `Would you like me to show details for any of these?`;

    return {
      message,
      uiComponents: [
        {
          type: 'actionCards',
          data: topOpportunities.map((opp) => ({
            title: opp.title,
            description: opp.description,
            savings: opp.potentialMonthlySavings,
            severity: opp.severity,
            actions: opp.actions,
          })),
        },
      ],
      data: { opportunities: topOpportunities, totalSavings },
      actions: [
        { label: 'View all opportunities', query: 'show all savings opportunities' },
        { label: 'Set up automatic savings', query: 'set up savings plan' },
      ],
    };
  }

  async handleInterestQuery(householdId: string, query: string): Promise<ChatResponse> {
    const db = await getDb();
    const liabilitiesCollection = db.collection('liabilities');

    const liabilities = await liabilitiesCollection
      .find({ householdId })
      .sort({ apr: -1 })
      .toArray();

    if (liabilities.length === 0) {
      return {
        message: "I don't see any liabilities in your account. If you have debts or loans, please add them to get interest rate recommendations.",
      };
    }

    let message = `Here's your interest rate analysis:\n\n`;
    
    for (const liability of liabilities) {
      const monthlyInterest = (liability.balance * liability.apr) / 12;
      message += `• **${liability.name}** (${liability.type}):\n`;
      message += `  - APR: ${(liability.apr * 100).toFixed(2)}%\n`;
      message += `  - Balance: $${liability.balance.toFixed(2)}\n`;
      message += `  - Monthly interest: $${monthlyInterest.toFixed(2)}\n`;
      
      if (liability.apr > 0.15) {
        message += `  - ⚠️ High interest rate - consider refinancing\n`;
      }
      message += `\n`;
    }

    const highAPRLiabilities = liabilities.filter((l) => l.apr > 0.15);
    if (highAPRLiabilities.length > 0) {
      const totalHighAPRInterest = highAPRLiabilities.reduce(
        (sum, l) => sum + (l.balance * l.apr) / 12,
        0
      );
      message += `**You're paying $${totalHighAPRInterest.toFixed(2)}/month in high-interest debt.** Consider refinancing to save money.`;

      return {
        message,
        uiComponents: [
          {
            type: 'whatIfSlider',
            data: {
              title: 'Refinance Calculator',
              description: 'See how much you could save by refinancing',
              currentAPR: highAPRLiabilities[0].apr,
              newAPRRange: [0.05, 0.15],
              balance: highAPRLiabilities[0].balance,
            },
          },
        ],
        data: { liabilities, highAPRLiabilities },
      };
    }

    return { message, data: { liabilities } };
  }

  async handleSpendingQuery(householdId: string, query: string): Promise<ChatResponse> {
    const breakdown = await this.analyticsAgent.getSpendBreakdown(householdId);
    const cashflow = await this.analyticsAgent.getCashflow(householdId);

    let message = `Here's your spending breakdown:\n\n`;
    
    for (const category of breakdown.slice(0, 8)) {
      message += `• ${category.category}: $${category.total.toFixed(2)} (${category.percentage.toFixed(1)}%)\n`;
    }

    message += `\n**Total spending: $${cashflow.expenses.toFixed(2)}**\n`;
    message += `**Net cashflow: $${cashflow.net.toFixed(2)}**`;

    return {
      message,
      uiComponents: [
        {
          type: 'chart',
          data: {
            type: 'pie',
            title: 'Spending by Category',
            data: breakdown.map((b) => ({
              name: b.category,
              value: b.total,
              percentage: b.percentage,
            })),
          },
        },
      ],
      data: { breakdown, cashflow },
    };
  }

  async handleOverviewQuery(householdId: string, query: string): Promise<ChatResponse> {
    const cashflow = await this.analyticsAgent.getCashflow(householdId);
    const netWorth = await this.analyticsAgent.getNetWorth(householdId);
    const breakdown = await this.analyticsAgent.getSpendBreakdown(householdId);

    let message = `Here's your complete financial picture:\n\n`;
    message += `**Income & Expenses:**\n`;
    message += `• Income: $${cashflow.income.toFixed(2)}/month\n`;
    message += `• Expenses: $${cashflow.expenses.toFixed(2)}/month\n`;
    message += `• Net: $${cashflow.net.toFixed(2)}/month\n\n`;
    
    message += `**Net Worth:**\n`;
    message += `• Assets: $${netWorth.assets.toFixed(2)}\n`;
    message += `• Liabilities: $${netWorth.liabilities.toFixed(2)}\n`;
    message += `• Net Worth: $${netWorth.net.toFixed(2)}\n`;

    return {
      message,
      uiComponents: [
        {
          type: 'dashboard',
          data: {
            cashflow,
            netWorth,
            topCategories: breakdown.slice(0, 5),
          },
        },
      ],
      data: { cashflow, netWorth, breakdown },
    };
  }

  async handleInsuranceMortgageQuery(householdId: string, query: string): Promise<ChatResponse> {
    const db = await getDb();
    const insuranceCollection = db.collection('insurance_policies');
    const liabilitiesCollection = db.collection('liabilities');

    const policies = await insuranceCollection.find({ householdId }).toArray();
    const mortgages = await liabilitiesCollection
      .find({ householdId, type: 'mortgage' })
      .toArray();

    let message = '';

    if (policies.length > 0) {
      message += `**Insurance Policies:**\n`;
      const totalInsurance = policies.reduce((sum, p) => sum + p.premiumMonthly, 0);
      
      for (const policy of policies) {
        message += `• ${policy.kind} (${policy.provider}): $${policy.premiumMonthly}/month\n`;
      }
      message += `Total: $${totalInsurance.toFixed(2)}/month\n\n`;
    }

    if (mortgages.length > 0) {
      message += `**Mortgage:**\n`;
      for (const mortgage of mortgages) {
        const monthlyPayment = mortgage.minPayment;
        message += `• Balance: $${mortgage.balance.toFixed(2)}\n`;
        message += `• APR: ${(mortgage.apr * 100).toFixed(2)}%\n`;
        message += `• Monthly payment: $${monthlyPayment.toFixed(2)}\n`;
      }
    }

    if (!message) {
      message = "I don't see any insurance policies or mortgages in your account. Please add them to get recommendations.";
    }

    return {
      message,
      data: { policies, mortgages },
      uiComponents: policies.length > 0 || mortgages.length > 0 ? [
        {
          type: 'whatIfSlider',
          data: {
            title: 'Insurance Optimization',
            description: 'See how adjusting deductibles affects premiums',
          },
        },
      ] : undefined,
    };
  }

  async handleGeneralQuery(
    householdId: string,
    query: string,
    transactions: Transaction[],
    insights: Insight[]
  ): Promise<ChatResponse> {
    let message = "Based on your financial data, ";

    if (insights.length > 0) {
      message += `here are some insights:\n\n`;
      for (const insight of insights.slice(0, 3)) {
        message += `• ${insight.title}: ${insight.body}\n`;
      }
    } else {
      message += `I have your financial data. How can I help you today? You can ask me about:\n`;
      message += `• Ways to reduce expenses\n`;
      message += `• Interest rates and debt management\n`;
      message += `• Your complete financial picture\n`;
      message += `• Personalized savings recommendations`;
    }

    return {
      message,
      data: { transactions, insights },
    };
  }

  async saveAssistantMessage(householdId: string, response: ChatResponse): Promise<void> {
    const assistantMessage: ChatMessage = {
      householdId,
      role: 'assistant',
      text: response.message,
      createdAt: new Date(),
      metadata: {
        uiComponents: response.uiComponents,
        data: response.data,
      },
    };

    const db = await getDb();
    const chatCollection = db.collection<ChatMessage>('chat_messages');
    await chatCollection.insertOne(assistantMessage);
  }
}