import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsAgent } from '@/lib/agents/analyticsAgent';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const householdId = searchParams.get('householdId');
    const month = searchParams.get('month'); // YYYY-MM format

    if (!householdId) {
      return NextResponse.json(
        { error: 'householdId is required' },
        { status: 400 }
      );
    }

    const analyticsAgent = new AnalyticsAgent();

    const [cashflow, netWorth, breakdown] = await Promise.all([
      analyticsAgent.getCashflow(householdId, month || undefined),
      analyticsAgent.getNetWorth(householdId),
      analyticsAgent.getSpendBreakdown(householdId),
    ]);

    return NextResponse.json({
      cashflow,
      netWorth,
      breakdown,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}