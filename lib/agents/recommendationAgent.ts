import type { SpendBreakdown } from './analyticsAgent';

export type RecommendationSeed = {
  type: string;
  title: string;
  detail: string;
};

export type RecommendationAction = RecommendationSeed & {
  _id?: string;
  householdId: string;
  status: 'pending' | 'approved' | 'completed';
  createdAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  result?: string;
};

export class RecommendationAgent {
  buildRecommendations(breakdown: SpendBreakdown[]): RecommendationSeed[] {
    const items: RecommendationSeed[] = [];
    const categories = breakdown.map((item) => String(item.category || '').toLowerCase());

    if (categories.some((cat) => cat.includes('insurance'))) {
      items.push({
        type: 'insurance_review',
        title: 'Shop insurance renewals',
        detail: 'Compare auto/home quotes yearly to cut premiums.',
      });
    } else {
      items.push({
        type: 'insurance_quote',
        title: 'Check insurance rates',
        detail: 'Ask for new quotes on auto and home coverage.',
      });
    }

    if (categories.some((cat) => cat.includes('utilities'))) {
      items.push({
        type: 'utilities_negotiation',
        title: 'Lower utility bills',
        detail: 'Switch energy plans or negotiate internet rates.',
      });
    }

    if (categories.some((cat) => cat.includes('dining') || cat.includes('food'))) {
      items.push({
        type: 'dining_plan',
        title: 'Trim dining spend',
        detail: 'Set a weekly cap and shift to meal planning.',
      });
    }

    if (categories.some((cat) => cat.includes('shopping'))) {
      items.push({
        type: 'subscription_audit',
        title: 'Audit subscriptions',
        detail: 'Cancel unused services and re-negotiate annual plans.',
      });
    }

    if (categories.some((cat) => cat.includes('transport') || cat.includes('gas'))) {
      items.push({
        type: 'commute_optimize',
        title: 'Optimize commuting',
        detail: 'Consolidate trips and track fuel rewards.',
      });
    }

    if (items.length === 0) {
      items.push(
        {
          type: 'recurring_review',
          title: 'Review recurring bills',
          detail: 'Look for duplicate subscriptions and unused services.',
        },
        {
          type: 'fixed_costs',
          title: 'Negotiate fixed costs',
          detail: 'Call providers to re-price internet, mobile, or insurance.',
        }
      );
    }

    return items.slice(0, 3);
  }

  actOnRecommendation(action: RecommendationAction): string {
    if (action.type.includes('insurance')) {
      return 'Queued: preparing an insurance quote request on your behalf.';
    }
    if (action.type.includes('utilities')) {
      return 'Queued: compiling utility plans and negotiation checklist.';
    }
    if (action.type.includes('subscription')) {
      return 'Queued: identifying subscriptions for review and cancellation.';
    }
    return 'Queued: creating an action plan based on your approval.';
  }
}
