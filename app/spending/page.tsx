'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1'];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const formatCurrency = (value?: number) => currencyFormatter.format(value || 0);

export default function SpendingBreakdownPage() {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setHouseholdId(parsed.householdId || null);
      } catch {
        setHouseholdId(null);
      }
    }
  }, []);

  useEffect(() => {
    const loadBreakdown = async () => {
      if (!householdId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/overview?householdId=${householdId}`);
        const data = await response.json();
        setBreakdown(data.breakdown || []);
      } catch (error) {
        console.error('Failed to load spending breakdown:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBreakdown();
  }, [householdId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Spending Breakdown</h1>
            <p className="text-sm text-slate-500">Visual breakdown of your expense mix</p>
          </div>
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Back to Overview
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading && (
          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
            <p className="text-sm text-slate-500">Loading spending breakdown...</p>
          </div>
        )}

        {!loading && breakdown.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
            <p className="text-sm text-slate-500">No spending data available.</p>
          </div>
        )}

        {!loading && breakdown.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={420}>
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ payload }) =>
                    `${payload.category}: ${payload.percentage?.toFixed(1)}%`
                  }
                  outerRadius={140}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string) =>
                    formatCurrency(typeof value === 'number' ? value : Number(value))
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && breakdown.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Detailed Breakdown</h2>
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
                        {formatCurrency(item.total)}
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
      </main>
    </div>
  );
}
