/**
 * UI Composer Agent - Generates UI specifications for Thesys
 * 
 * This agent converts analytics and insights into UI component specifications
 * that can be rendered by Thesys's generative UI system.
 */

export interface UIComponent {
  type: 'dashboard' | 'chart' | 'actionCard' | 'actionCards' | 'table' | 'whatIfSlider' | 'text';
  data: any;
  style?: Record<string, any>;
}

export interface UISpec {
  components: UIComponent[];
  layout?: 'grid' | 'stack';
  title?: string;
}

export class UIComposerAgent {
  /**
   * Compose UI from analytics data
   */
  composeDashboard(analytics: any): UISpec {
    return {
      title: 'Financial Overview',
      layout: 'grid',
      components: [
        {
          type: 'chart',
          data: {
            type: 'pie',
            title: 'Spending by Category',
            data: analytics.breakdown || [],
          },
        },
        {
          type: 'text',
          data: {
            title: 'Cashflow',
            content: `Income: $${analytics.cashflow?.income || 0}\nExpenses: $${analytics.cashflow?.expenses || 0}\nNet: $${analytics.cashflow?.net || 0}`,
          },
        },
        {
          type: 'text',
          data: {
            title: 'Net Worth',
            content: `Assets: $${analytics.netWorth?.assets || 0}\nLiabilities: $${analytics.netWorth?.liabilities || 0}\nNet: $${analytics.netWorth?.net || 0}`,
          },
        },
      ],
    };
  }

  /**
   * Compose UI from savings opportunities
   */
  composeSavingsOpportunities(opportunities: any[]): UISpec {
    return {
      title: 'Savings Opportunities',
      layout: 'stack',
      components: [
        {
          type: 'actionCards',
          data: opportunities.map((opp) => ({
            title: opp.title,
            description: opp.description,
            savings: opp.potentialMonthlySavings,
            severity: opp.severity,
            actions: opp.actions,
          })),
        },
      ],
    };
  }

  /**
   * Compose UI for what-if scenarios
   */
  composeWhatIfSlider(scenario: {
    title: string;
    description: string;
    currentValue: number;
    range: [number, number];
    calculation: (value: number) => { savings: number; newPayment?: number };
  }): UISpec {
    return {
      title: scenario.title,
      components: [
        {
          type: 'whatIfSlider',
          data: {
            ...scenario,
            onChange: scenario.calculation,
          },
        },
      ],
    };
  }

  /**
   * Compose UI from transaction data
   */
  composeTransactionTable(transactions: any[]): UISpec {
    return {
      title: 'Transactions',
      components: [
        {
          type: 'table',
          data: {
            columns: ['Date', 'Merchant', 'Category', 'Amount'],
            rows: transactions.map((tx) => [
              new Date(tx.postedAt).toLocaleDateString(),
              tx.merchant || 'Unknown',
              tx.category || 'Uncategorized',
              `$${Math.abs(tx.amount).toFixed(2)}`,
            ]),
          },
        },
      ],
    };
  }

  /**
   * Generic UI composer that adapts based on data type
   */
  compose(data: any, context?: string): UISpec {
    if (data.opportunities) {
      return this.composeSavingsOpportunities(data.opportunities);
    }

    if (data.breakdown || data.cashflow || data.netWorth) {
      return this.composeDashboard(data);
    }

    if (data.transactions) {
      return this.composeTransactionTable(data.transactions);
    }

    // Default: simple text display
    return {
      components: [
        {
          type: 'text',
          data: {
            content: JSON.stringify(data, null, 2),
          },
        },
      ],
    };
  }
}