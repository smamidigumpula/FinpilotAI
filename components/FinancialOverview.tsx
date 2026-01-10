'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface FinancialOverviewProps {
  householdId: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1'];

export default function FinancialOverview({ householdId }: FinancialOverviewProps) {
  const [cashflow, setCashflow] = useState<any>(null);
  const [netWorth, setNetWorth] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, [householdId]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/overview?householdId=${householdId}`);
      const data = await response.json();
      
      if (data.cashflow) setCashflow(data.cashflow);
      if (data.netWorth) setNetWorth(data.netWorth);
      if (data.breakdown) setBreakdown(data.breakdown);
    } catch (error) {
      console.error('Failed to load overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading financial overview...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cashflow */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Cashflow</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Income</span>
              <span className="text-lg font-semibold text-green-600">
                ${cashflow?.income?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Expenses</span>
              <span className="text-lg font-semibold text-red-600">
                ${cashflow?.expenses?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Net</span>
              <span
                className={`text-xl font-bold ${
                  (cashflow?.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${cashflow?.net?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Net Worth */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Net Worth</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Assets</span>
              <span className="text-lg font-semibold text-green-600">
                ${netWorth?.assets?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Liabilities</span>
              <span className="text-lg font-semibold text-red-600">
                ${netWorth?.liabilities?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Net Worth</span>
              <span
                className={`text-xl font-bold ${
                  (netWorth?.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                ${netWorth?.net?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Spending Category</h3>
          {breakdown.length > 0 ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{breakdown[0].category}</span>
                <span className="text-lg font-semibold">
                  ${breakdown[0].total?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {breakdown[0].percentage?.toFixed(1)}% of total spending
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No spending data available</div>
          )}
        </div>
      </div>

      {/* Spending Breakdown Chart */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={breakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="total"
              >
                {breakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown Table */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Detailed Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {breakdown.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${item.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {breakdown.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
          <p className="text-gray-500 mb-4">
            Upload your financial data to see your overview here.
          </p>
          <a
            href="#upload"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Go to Upload Data →
          </a>
        </div>
      )}
    </div>
  );
}