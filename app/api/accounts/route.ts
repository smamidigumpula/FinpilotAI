import { NextRequest, NextResponse } from 'next/server';
import { CoordinatorAgent } from '@/lib/agents/coordinatorAgent';
import type { Account } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { householdId, type, provider, metadata } = await request.json();

    if (!householdId || !type || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: householdId, type, provider' },
        { status: 400 }
      );
    }

    const coordinator = new CoordinatorAgent();
    const ingestionAgent = coordinator.getIngestionAgent();

    const accountId = await ingestionAgent.createAccount(
      householdId,
      type,
      provider,
      metadata
    );

    return NextResponse.json({
      success: true,
      accountId,
    });
  } catch (error: any) {
    console.error('Account creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}

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

    const { getDb } = await import('@/lib/mongodb');
    const db = await getDb();
    const accountsCollection = db.collection<Account>('accounts');

    const accounts = await accountsCollection
      .find({ householdId })
      .toArray();

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('Account fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}