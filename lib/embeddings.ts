import { getDb } from './mongodb';
import type { Transaction, Insight, ChatMessage } from './types';

// VoyageAI client - using fetch for now since SDK might not be available
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const EMBEDDING_MODEL = 'voyage-large-2';
const EMBEDDING_DIMENSION = 1024;

export async function createEmbedding(text: string): Promise<number[]> {
  if (!VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY is not set');
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`VoyageAI API error: ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw error;
  }
}

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (!VOYAGE_API_KEY) {
    throw new Error('VOYAGE_API_KEY is not set');
  }

  try {
    const response = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`VoyageAI API error: ${error}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  } catch (error) {
    console.error('Error creating embeddings:', error);
    throw error;
  }
}

export function transactionToText(tx: Transaction): string {
  const date = tx.postedAt instanceof Date ? tx.postedAt.toISOString().split('T')[0] : tx.postedAt;
  const amount = Math.abs(tx.amount);
  const sign = tx.amount >= 0 ? 'income' : 'expense';
  return `${date} ${tx.merchant || 'Unknown'} $${amount.toFixed(2)} category=${tx.category || 'Uncategorized'} account=${tx.accountId} ${sign} ${tx.isRecurring ? 'recurring' : 'one-time'} ${tx.notes || ''}`.trim();
}

export async function embedTransaction(tx: Transaction): Promise<Transaction> {
  if (!tx.embedding) {
    const text = transactionToText(tx);
    try {
      tx.embedding = await createEmbedding(text);
    } catch (error) {
      console.warn('Skipping transaction embedding due to error:', error);
    }
  }
  return tx;
}

export async function embedInsight(insight: Insight): Promise<Insight> {
  if (!insight.embedding) {
    const text = `${insight.type} ${insight.title} ${insight.body}`;
    try {
      insight.embedding = await createEmbedding(text);
    } catch (error) {
      console.warn('Skipping insight embedding due to error:', error);
    }
  }
  return insight;
}

export async function embedChatMessage(message: ChatMessage): Promise<ChatMessage> {
  if (!message.embedding && message.role === 'user') {
    try {
      message.embedding = await createEmbedding(message.text);
    } catch (error) {
      console.warn('Skipping chat embedding due to error:', error);
    }
  }
  return message;
}

export async function vectorSearch(
  collection: string,
  queryVector: number[],
  filter: Record<string, any>,
  limit: number = 10
): Promise<any[]> {
  const db = await getDb();
  const coll = db.collection(collection);

  try {
    // MongoDB Vector Search aggregation
    const results = await coll.aggregate([
      {
        $vectorSearch: {
          queryVector,
          path: 'embedding',
          filter,
          limit,
          numCandidates: limit * 10, // Search more candidates for better results
        },
      },
      {
        $project: {
          embedding: 0, // Exclude embedding from results to save bandwidth
        },
      },
    ]).toArray();

    return results;
  } catch (error) {
    console.error(`Vector search error in ${collection}:`, error);
    // Fallback to regular search if vector search is not configured
    return coll.find(filter).limit(limit).toArray();
  }
}
