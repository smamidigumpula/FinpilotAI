import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { Liability, InsurancePolicy, Asset } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { type, householdId, data } = await request.json();

    if (!type || !householdId || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, householdId, data' },
        { status: 400 }
      );
    }

    const db = await getDb();

    switch (type) {
      case 'liability': {
        const collection = db.collection<Liability>('liabilities');
        const result = await collection.insertOne({
          ...data,
          householdId,
          createdAt: new Date(),
        });
        return NextResponse.json({
          success: true,
          id: result.insertedId.toString(),
        });
      }

      case 'insurance': {
        const collection = db.collection<InsurancePolicy>('insurance_policies');
        const result = await collection.insertOne({
          ...data,
          householdId,
          renewalDate: data.renewalDate ? new Date(data.renewalDate) : new Date(),
          createdAt: new Date(),
        });
        return NextResponse.json({
          success: true,
          id: result.insertedId.toString(),
        });
      }

      case 'asset': {
        const collection = db.collection<Asset>('assets');
        const result = await collection.insertOne({
          ...data,
          householdId,
          valuationDate: data.valuationDate ? new Date(data.valuationDate) : new Date(),
          createdAt: new Date(),
        });
        return NextResponse.json({
          success: true,
          id: result.insertedId.toString(),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Manual ingestion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save data' },
      { status: 500 }
    );
  }
}