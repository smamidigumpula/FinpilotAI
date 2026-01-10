import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { householdId, scenario } = await request.json();

    if (!householdId || !scenario) {
      return NextResponse.json(
        { error: 'Missing required fields: householdId, scenario' },
        { status: 400 }
      );
    }

    const { type, liabilityId, newAPR, extraPayment } = scenario;

    if (type === 'refinance' && liabilityId) {
      const db = await getDb();
      const liabilitiesCollection = db.collection('liabilities');

      const liability = await liabilitiesCollection.findOne({
        _id: liabilityId,
        householdId,
      });

      if (!liability) {
        return NextResponse.json(
          { error: 'Liability not found' },
          { status: 404 }
        );
      }

      // Calculate current vs new monthly interest
      const currentMonthlyInterest = (liability.balance * liability.apr) / 12;
      const newMonthlyInterest = newAPR ? (liability.balance * newAPR) / 12 : currentMonthlyInterest;

      // Calculate payoff impact
      const currentMinPayment = liability.minPayment;
      const newPayment = currentMinPayment + (extraPayment || 0);
      const currentPayoffMonths = liability.balance / currentMinPayment;
      const newPayoffMonths = newAPR
        ? liability.balance / newPayment
        : liability.balance / newPayment;

      const monthlySavings = currentMonthlyInterest - newMonthlyInterest;
      const totalSavings = monthlySavings * newPayoffMonths;
      const monthsSaved = currentPayoffMonths - newPayoffMonths;

      return NextResponse.json({
        current: {
          apr: liability.apr,
          monthlyInterest: currentMonthlyInterest,
          minPayment: currentMinPayment,
          payoffMonths: currentPayoffMonths,
        },
        projected: {
          apr: newAPR || liability.apr,
          monthlyInterest: newMonthlyInterest,
          minPayment: newPayment,
          payoffMonths: newPayoffMonths,
        },
        savings: {
          monthly: monthlySavings,
          total: totalSavings,
          monthsSaved: Math.max(0, monthsSaved),
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported scenario type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('What-if calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate scenario' },
      { status: 500 }
    );
  }
}