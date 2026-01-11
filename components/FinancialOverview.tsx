'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import ChatInterface from './ChatInterface';

interface FinancialOverviewProps {
  householdId: string;
  onNavigate?: (tab: 'overview' | 'chat' | 'upload') => void;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1'];
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const formatCurrency = (value?: number) => currencyFormatter.format(value || 0);
const formatPercent = (value?: number) => `${(value || 0).toFixed(1)}%`;
const formatPeriod = (period?: string) => {
  if (!period) return 'this month';
  const date = new Date(`${period}-01`);
  if (Number.isNaN(date.getTime())) return 'this month';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function FinancialOverview({ householdId, onNavigate }: FinancialOverviewProps) {
  const [cashflow, setCashflow] = useState<any>(null);
  const [netWorth, setNetWorth] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
    loadRecommendations();
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

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`/api/recommendations?householdId=${householdId}`);
      const data = await response.json();
      setRecommendations(data.actions || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleApprove = async (actionId: string) => {
    setApprovingId(actionId);
    try {
      const response = await fetch('/api/recommendations/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ householdId, actionId }),
      });
      const data = await response.json();
      if (data.action) {
        setRecommendations((prev) =>
          prev.map((item) => (item._id === actionId ? data.action : item))
        );
      }
    } catch (error) {
      console.error('Failed to approve recommendation:', error);
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading financial overview...</div>
      </div>
    );
  }

  const income = cashflow?.income || 0;
  const expenses = cashflow?.expenses || 0;
  const net = cashflow?.net || 0;
  const assets = netWorth?.assets || 0;
  const liabilities = netWorth?.liabilities || 0;
  const netTotal = netWorth?.net || 0;
  const expenseRatio = income > 0 ? Math.min((expenses / income) * 100, 100) : 0;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;
  const liabilitiesRatio = assets > 0 ? Math.min((liabilities / assets) * 100, 100) : 0;
  const topCategory = breakdown[0];
  const topCategories = breakdown.slice(0, 3);
  const periodLabel = formatPeriod(cashflow?.period);
  const recommendationItems = recommendations.length
    ? recommendations
    : [
        {
          title: 'Review recurring bills',
          detail: 'Look for duplicate subscriptions and unused services.',
          status: 'pending',
        },
      ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Cashflow */}
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-sky-50 to-indigo-50 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Cashflow</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(net)}</p>
              <p className="text-[11px] text-slate-500">Net for {periodLabel}</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h5l2 4 4-10 2 6h5" />
              </svg>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Income</span>
              <span className="font-medium text-emerald-600">{formatCurrency(income)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Expenses</span>
              <span className="font-medium text-rose-500">{formatCurrency(expenses)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-400"
                style={{ width: `${expenseRatio}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Spending ratio</span>
              <span>{formatPercent(expenseRatio)}</span>
            </div>
            <div className="pt-2 border-t border-white/70 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Savings rate</span>
              <span
                className={`text-xs font-semibold ${
                  savingsRate >= 0 ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {formatPercent(savingsRate)}
              </span>
            </div>
          </div>
        </div>

        {/* Net Worth */}
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-emerald-50 to-lime-50 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Net Worth</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(netTotal)}</p>
              <p className="text-[11px] text-slate-500">Assets minus liabilities</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              </svg>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Assets</span>
              <span className="font-medium text-emerald-600">{formatCurrency(assets)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Liabilities</span>
              <span className="font-medium text-rose-500">{formatCurrency(liabilities)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${liabilitiesRatio}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Debt load</span>
              <span>{formatPercent(liabilitiesRatio)}</span>
            </div>
            <div className="pt-2 border-t border-white/70 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-slate-500">Balance status</span>
              <span
                className={`text-xs font-semibold ${
                  netTotal >= 0 ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {netTotal >= 0 ? 'Healthy' : 'Needs attention'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Category */}
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-rose-50 to-orange-50 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Top Spending Category</p>
              <p className="text-base font-semibold text-slate-900">Where your money goes</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M6 6v12m6-12v12m6-12v12" />
              </svg>
            </div>
          </div>
          {topCategory ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Top category</p>
                  <p className="text-lg font-semibold text-slate-900">{topCategory.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-slate-900">{formatCurrency(topCategory.total)}</p>
                  <p className="text-[11px] text-slate-500">{formatPercent(topCategory.percentage)} of spend</p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(6, Math.min(topCategory.percentage || 0, 100))}%`,
                    backgroundColor: COLORS[0],
                  }}
                />
              </div>
              <div className="space-y-1.5">
                {topCategories.map((item, index) => (
                  <div key={`${item.category}-${index}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{item.category}</span>
                      <span className="font-medium text-slate-900">{formatCurrency(item.total)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/70 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(6, Math.min(item.percentage || 0, 100))}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/spending"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                View spending breakdown →
              </Link>
            </div>
          ) : (
            <div className="mt-4 text-xs text-slate-500">
              No spending data available yet. Upload data to see your top categories.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Recommendations</p>
              <p className="text-base font-semibold text-slate-900">Ways to reduce expenses</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6m0 0 3-3m-3 3-3-3m9 7.5a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {recommendationItems.map((item, idx) => (
              <div key={`${item.title}-${idx}`} className="rounded-lg bg-white/80 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{item.title}</p>
                    <p className="text-[11px] text-slate-500">{item.detail}</p>
                  </div>
                  {item.status === 'pending' && item._id && (
                    <button
                      type="button"
                      onClick={() => handleApprove(item._id)}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                      disabled={approvingId === item._id}
                    >
                      {approvingId === item._id ? 'Approving...' : 'Approve'}
                    </button>
                  )}
                  {item.status === 'approved' && (
                    <span className="text-[11px] font-semibold text-emerald-600">Approved</span>
                  )}
                </div>
                {item.result && (
                  <p className="mt-1 text-[11px] font-semibold text-indigo-600">
                    {item.result}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {breakdown.length === 0 && !loading && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">No Data Available</h3>
            <p className="text-xs text-gray-500">
              Upload your financial data to see your overview here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('upload')}
            className="text-indigo-600 hover:text-indigo-700 font-medium text-xs"
          >
            Go to Upload Data →
          </button>
        </div>
      )}

      <div id="assistant">
        <ChatInterface
          householdId={householdId}
          variant="compact"
          className="h-[520px] max-h-[60vh]"
        />
      </div>

      {/* Spending Breakdown Chart */}

    </div>
  );
}
