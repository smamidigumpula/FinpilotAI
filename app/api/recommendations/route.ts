import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsAgent } from '@/lib/agents/analyticsAgent';
import { RecommendationAgent } from '@/lib/agents/recommendationAgent';
import { getDb } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const householdId = searchParams.get('householdId');

    if (!householdId) {
      return NextResponse.json(
        { error: 'householdId is required' },
        { status: 400 }
      );
    }

    const analyticsAgent = new AnalyticsAgent();
    const recommendationAgent = new RecommendationAgent();
    const breakdown = await analyticsAgent.getSpendBreakdown(householdId);
    const seeds = recommendationAgent.buildRecommendations(breakdown);

    const db = await getDb();
    const collection = db.collection('recommendation_actions');

    for (const seed of seeds) {
      await collection.updateOne(
        { householdId, type: seed.type },
        {
          $setOnInsert: {
            householdId,
            status: 'pending',
            createdAt: new Date(),
            ...seed,
          },
        },
        { upsert: true }
      );
    }

    const actions = await collection
      .find({ householdId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({ actions });
  } catch (error: any) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load recommendations' },
      { status: 500 }
    );
  }
}
