import { NextRequest, NextResponse } from 'next/server';
import { CoordinatorAgent } from '@/lib/agents/coordinatorAgent';
import { embedTransaction } from '@/lib/embeddings';
import { getDb } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const householdId = formData.get('householdId') as string;
    const accountId = formData.get('accountId') as string;
    const accountType = (formData.get('accountType') as 'bank' | 'credit_card') || 'bank';

    if (!file || !householdId || !accountId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, householdId, accountId' },
        { status: 400 }
      );
    }

    const coordinator = new CoordinatorAgent();
    const ingestionAgent = coordinator.getIngestionAgent();

    // Read file content
    const csvContent = await file.text();

    // Normalize and store transactions
    const normalizedTransactions = await ingestionAgent.normalizeCSV(
      csvContent,
      householdId,
      accountId,
      accountType
    );

    // Create embeddings for transactions
    const db = await getDb();
    const transactionsCollection = db.collection('transactions');

    const transactionsWithEmbeddings = await Promise.all(
      normalizedTransactions.map(async (tx) => {
        const embedded = await embedTransaction(tx as any);
        return {
          ...embedded,
          householdId,
          createdAt: new Date(),
        };
      })
    );

    // Insert transactions
    if (transactionsWithEmbeddings.length > 0) {
      await transactionsCollection.insertMany(transactionsWithEmbeddings);
    }

    return NextResponse.json({
      success: true,
      count: transactionsWithEmbeddings.length,
      message: `Successfully imported ${transactionsWithEmbeddings.length} transactions`,
    });
  } catch (error: any) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import CSV' },
      { status: 500 }
    );
  }
}