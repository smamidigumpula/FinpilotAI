import { NextRequest, NextResponse } from 'next/server';
import { RecommendationAgent } from '@/lib/agents/recommendationAgent';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { householdId, actionId } = await request.json();

    if (!householdId || !actionId) {
      return NextResponse.json(
        { error: 'Missing required fields: householdId, actionId' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection('recommendation_actions');
    const existing = await collection.findOne({
      _id: new ObjectId(actionId),
      householdId,
    });

    if (!existing) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    if (existing.status !== 'pending') {
      return NextResponse.json({ action: existing });
    }

    const agent = new RecommendationAgent();
    const result = agent.actOnRecommendation(existing as any);
    const now = new Date();

    await collection.updateOne(
      { _id: new ObjectId(actionId) },
      {
        $set: {
          status: 'approved',
          approvedAt: now,
          completedAt: now,
          result,
        },
      }
    );

    const updated = await collection.findOne({ _id: new ObjectId(actionId) });

    return NextResponse.json({ action: updated });
  } catch (error: any) {
    console.error('Approve recommendation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve recommendation' },
      { status: 500 }
    );
  }
}
