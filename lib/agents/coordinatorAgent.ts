import { ChatAgent } from './chatAgent';
import { AnalyticsAgent } from './analyticsAgent';
import { SavingsAgent } from './savingsAgent';
import { UIComposerAgent } from './uiComposerAgent';
import { IngestionAgent } from './ingestionAgent';
import type { ChatResponse } from './chatAgent';

/**
 * Coordinator Agent - Orchestrates multiple agents to answer user queries
 * 
 * This is the "brain" that decides which agents to call and how to combine their results.
 */
export class CoordinatorAgent {
  private chatAgent: ChatAgent;
  private analyticsAgent: AnalyticsAgent;
  private savingsAgent: SavingsAgent;
  private uiComposerAgent: UIComposerAgent;
  private ingestionAgent: IngestionAgent;

  constructor() {
    this.chatAgent = new ChatAgent();
    this.analyticsAgent = new AnalyticsAgent();
    this.savingsAgent = new SavingsAgent();
    this.uiComposerAgent = new UIComposerAgent();
    this.ingestionAgent = new IngestionAgent();
  }

  /**
   * Main entry point for handling user queries
   */
  async handleQuery(
    householdId: string,
    userQuery: string,
    conversationHistory: any[] = []
  ): Promise<{
    response: ChatResponse;
    uiSpec?: any;
    agentTrace?: string[];
  }> {
    const agentTrace: string[] = [];
    agentTrace.push('Coordinator: Received query');

    // Route to appropriate handler
    const queryLower = userQuery.toLowerCase();

    // Ingestion requests
    if (queryLower.includes('upload') || queryLower.includes('import') || queryLower.includes('sync')) {
      agentTrace.push('Coordinator: Routing to Ingestion Agent');
      return {
        response: {
          message: 'Please use the upload interface to import your financial data.',
        },
        agentTrace,
      };
    }

    // Savings/expense reduction queries
    if (
      queryLower.includes('save') ||
      queryLower.includes('reduce') ||
      queryLower.includes('cut') ||
      queryLower.includes('expense') ||
      queryLower.includes('spending') ||
      queryLower.includes('savings opportunity')
    ) {
      agentTrace.push('Coordinator: Routing to Savings Agent → UI Composer');
      
      const savingsOpportunities = await this.savingsAgent.findSavingsOpportunities(householdId);
      const uiSpec = this.uiComposerAgent.composeSavingsOpportunities(savingsOpportunities);
      
      const response = await this.chatAgent.handleSavingsQuery(householdId, userQuery, []);
      response.uiComponents = uiSpec.components;

      agentTrace.push(`Savings Agent: Found ${savingsOpportunities.length} opportunities`);
      agentTrace.push('UI Composer: Generated action cards');

      return {
        response,
        uiSpec,
        agentTrace,
      };
    }

    // Interest rate queries
    if (queryLower.includes('interest') || queryLower.includes('apr') || queryLower.includes('rate')) {
      agentTrace.push('Coordinator: Routing to Chat Agent → Interest Handler');
      
      const response = await this.chatAgent.handleInterestQuery(householdId, userQuery);
      
      agentTrace.push('Chat Agent: Analyzed interest rates');

      return {
        response,
        agentTrace,
      };
    }

    // Overview/financial picture queries
    if (
      queryLower.includes('overview') ||
      queryLower.includes('picture') ||
      queryLower.includes('summary') ||
      queryLower.includes('income') ||
      queryLower.includes('earn')
    ) {
      agentTrace.push('Coordinator: Routing to Analytics Agent → UI Composer');
      
      const cashflow = await this.analyticsAgent.getCashflow(householdId);
      const netWorth = await this.analyticsAgent.getNetWorth(householdId);
      const breakdown = await this.analyticsAgent.getSpendBreakdown(householdId);

      agentTrace.push('Analytics Agent: Calculated cashflow, net worth, breakdown');

      const analyticsData = { cashflow, netWorth, breakdown };
      const uiSpec = this.uiComposerAgent.composeDashboard(analyticsData);

      agentTrace.push('UI Composer: Generated dashboard');

      const response = await this.chatAgent.handleOverviewQuery(householdId, userQuery);
      response.uiComponents = uiSpec.components;

      return {
        response,
        uiSpec,
        agentTrace,
      };
    }

    // Spending analysis queries
    if (queryLower.includes('spending') || queryLower.includes('spend') || queryLower.includes('expense breakdown')) {
      agentTrace.push('Coordinator: Routing to Analytics Agent → UI Composer');
      
      const breakdown = await this.analyticsAgent.getSpendBreakdown(householdId);
      const cashflow = await this.analyticsAgent.getCashflow(householdId);

      agentTrace.push('Analytics Agent: Calculated spend breakdown');

      const uiSpec = this.uiComposerAgent.compose({
        breakdown,
        cashflow,
      });

      agentTrace.push('UI Composer: Generated chart');

      const response = await this.chatAgent.handleSpendingQuery(householdId, userQuery);
      response.uiComponents = uiSpec.components;

      return {
        response,
        uiSpec,
        agentTrace,
      };
    }

    // Default: Use Chat Agent with RAG
    agentTrace.push('Coordinator: Routing to Chat Agent (RAG)');
    
    const response = await this.chatAgent.handleQuery(householdId, userQuery, conversationHistory);
    
    agentTrace.push('Chat Agent: Retrieved context and generated response');

    // Generate UI spec if components are available
    let uiSpec;
    if (response.uiComponents && response.uiComponents.length > 0) {
      uiSpec = {
        components: response.uiComponents,
      };
      agentTrace.push('UI Composer: Generated UI from response');
    }

    return {
      response,
      uiSpec,
      agentTrace,
    };
  }

  /**
   * Generate periodic insights (can be called by a background job)
   */
  async generateInsights(householdId: string): Promise<void> {
    const agentTrace: string[] = [];
    agentTrace.push('Coordinator: Starting insight generation');

    // Use Savings Agent to generate insights
    const insights = await this.savingsAgent.generateInsights(householdId);
    agentTrace.push(`Savings Agent: Generated ${insights.length} insights`);

    // Could also generate other types of insights here
    // - Anomaly detection
    // - Interest leakage alerts
    // - Budget warnings

    console.log('Insight generation complete:', agentTrace);
  }

  getIngestionAgent(): IngestionAgent {
    return this.ingestionAgent;
  }
}