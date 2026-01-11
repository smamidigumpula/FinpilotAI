import { getDb } from '../mongodb';
import type { Transaction } from '../types';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface CashflowAnalysis {
  income: number;
  expenses: number;
  net: number;
  period: string;
}

export interface SpendBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface NetWorth {
  assets: number;
  liabilities: number;
  net: number;
}

export interface Anomaly {
  category: string;
  currentMonth: number;
  averageMonth: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Analytics Agent - Performs aggregations and calculations
 */
export class AnalyticsAgent {
  async getCashflow(householdId: string, month?: string): Promise<CashflowAnalysis> {
    const db = await getDb();
    const collection = db.collection<Transaction>('transactions');

    const targetMonth = month ? new Date(month) : new Date();
    const start = startOfMonth(targetMonth);
    const end = endOfMonth(targetMonth);

    const pipeline = [
      {
        $match: {
          householdId,
          postedAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          income: {
            $sum: {
              $cond: [{ $gte: ['$amount', 0] }, '$amount', 0],
            },
          },
          expenses: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0],
            },
          },
          count: { $sum: 1 },
        },
      },
    ];

    const result = await collection.aggregate(pipeline).toArray();
    const data = result[0] || { income: 0, expenses: 0, count: 0 };

    if (!month && data.count === 0) {
      const latest = await collection
        .find({ householdId })
        .sort({ postedAt: -1 })
        .limit(1)
        .project({ postedAt: 1 })
        .toArray();

      if (latest[0]?.postedAt) {
        const latestMonth = latest[0].postedAt as Date;
        const latestStart = startOfMonth(latestMonth);
        const latestEnd = endOfMonth(latestMonth);
        const latestResult = await collection.aggregate([
          {
            $match: {
              householdId,
              postedAt: { $gte: latestStart, $lte: latestEnd },
            },
          },
          {
            $group: {
              _id: null,
              income: {
                $sum: {
                  $cond: [{ $gte: ['$amount', 0] }, '$amount', 0],
                },
              },
              expenses: {
                $sum: {
                  $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0],
                },
              },
            },
          },
        ]).toArray();
        const latestData = latestResult[0] || { income: 0, expenses: 0 };
        return {
          income: latestData.income || 0,
          expenses: latestData.expenses || 0,
          net: (latestData.income || 0) - (latestData.expenses || 0),
          period: `${latestMonth.getFullYear()}-${(latestMonth.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`,
        };
      }
    }

    return {
      income: data.income || 0,
      expenses: data.expenses || 0,
      net: (data.income || 0) - (data.expenses || 0),
      period: `${targetMonth.getFullYear()}-${(targetMonth.getMonth() + 1).toString().padStart(2, '0')}`,
    };
  }

  async getSpendBreakdown(
    householdId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SpendBreakdown[]> {
    const db = await getDb();
    const collection = db.collection<Transaction>('transactions');

    const match: any = {
      householdId,
      amount: { $lt: 0 }, // Only expenses
    };

    if (startDate || endDate) {
      match.postedAt = {};
      if (startDate) match.postedAt.$gte = startDate;
      if (endDate) match.postedAt.$lte = endDate;
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$category',
          total: { $sum: { $abs: '$amount' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ];

    const results = await collection.aggregate(pipeline).toArray();
    const totalSpend = results.reduce((sum, r) => sum + r.total, 0);

    return results.map((r) => ({
      category: r._id || 'Uncategorized',
      total: r.total,
      count: r.count,
      percentage: totalSpend > 0 ? (r.total / totalSpend) * 100 : 0,
    }));
  }

  async getNetWorth(householdId: string): Promise<NetWorth> {
    const db = await getDb();
    
    // Calculate assets
    const assetsCollection = db.collection('assets');
    const assetsResult = await assetsCollection.aggregate([
      { $match: { householdId } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]).toArray();
    const assets = assetsResult[0]?.total || 0;

    // Calculate liabilities
    const liabilitiesCollection = db.collection('liabilities');
    const liabilitiesResult = await liabilitiesCollection.aggregate([
      { $match: { householdId } },
      { $group: { _id: null, total: { $sum: '$balance' } } },
    ]).toArray();
    const liabilities = liabilitiesResult[0]?.total || 0;

    return {
      assets,
      liabilities,
      net: assets - liabilities,
    };
  }

  async detectAnomalies(householdId: string): Promise<Anomaly[]> {
    const db = await getDb();
    const collection = db.collection<Transaction>('transactions');

    const currentMonth = new Date();
    const sixMonthsAgo = subMonths(currentMonth, 6);

    // Get current month spending by category
    const currentMonthStart = startOfMonth(currentMonth);
    const currentMonthEnd = endOfMonth(currentMonth);

    const currentPipeline = [
      {
        $match: {
          householdId,
          postedAt: { $gte: currentMonthStart, $lte: currentMonthEnd },
          amount: { $lt: 0 },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: { $abs: '$amount' } },
        },
      },
    ];

    const currentMonthData = await collection.aggregate(currentPipeline).toArray();
    const currentMap = new Map(
      currentMonthData.map((r) => [r._id || 'Uncategorized', r.total])
    );

    // Get average spending over last 6 months by category
    const historicalPipeline = [
      {
        $match: {
          householdId,
          postedAt: { $gte: sixMonthsAgo, $lt: currentMonthStart },
          amount: { $lt: 0 },
        },
      },
      {
        $group: {
          _id: '$category',
          monthlyTotals: {
            $push: {
              $abs: '$amount',
            },
          },
        },
      },
      {
        $project: {
          average: { $avg: '$monthlyTotals' },
        },
      },
    ];

    const historicalData = await collection.aggregate(historicalPipeline).toArray();
    const historicalMap = new Map(
      historicalData.map((r) => [r._id || 'Uncategorized', r.average])
    );

    // Calculate anomalies
    const anomalies: Anomaly[] = [];
    const allCategories = new Set([...currentMap.keys(), ...historicalMap.keys()]);

    for (const category of allCategories) {
      const current = currentMap.get(category) || 0;
      const average = historicalMap.get(category) || 0;

      if (average > 0) {
        const deviation = ((current - average) / average) * 100;
        
        // Flag if deviation is > 30%
        if (Math.abs(deviation) > 30) {
          anomalies.push({
            category,
            currentMonth: current,
            averageMonth: average,
            deviation,
            severity: Math.abs(deviation) > 50 ? 'high' : Math.abs(deviation) > 40 ? 'medium' : 'low',
          });
        }
      }
    }

    return anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
  }

  async getRecurringExpenses(householdId: string): Promise<Transaction[]> {
    const db = await getDb();
    const collection = db.collection<Transaction>('transactions');

    // Find transactions with same merchant and similar amounts
    const pipeline = [
      {
        $match: {
          householdId,
          amount: { $lt: 0 },
          merchant: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            merchant: '$merchant',
            category: '$category',
          },
          transactions: { $push: '$$ROOT' },
          count: { $sum: 1 },
          avgAmount: { $avg: { $abs: '$amount' } },
        },
      },
      {
        $match: {
          count: { $gte: 3 }, // At least 3 occurrences
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ];

    const results = await collection.aggregate(pipeline).toArray();
    const recurring: Transaction[] = [];

    for (const group of results) {
      recurring.push(...group.transactions);
    }

    return recurring;
  }
}
