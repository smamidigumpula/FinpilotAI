'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface UIRendererProps {
  components: any[];
  data?: any;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1'];

export default function UIRenderer({ components, data }: UIRendererProps) {
  if (!components || components.length === 0) return null;

  return (
    <div className="space-y-4 mt-4">
      {components.map((component, idx) => {
        switch (component.type) {
          case 'chart':
            if (component.data?.type === 'pie') {
              return (
                <div key={idx} className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">{component.data.title}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={component.data.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {component.data.data.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              );
            }
            if (component.data?.type === 'bar') {
              return (
                <div key={idx} className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">{component.data.title}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={component.data.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            }
            return null;

          case 'actionCards':
            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {component.data?.map((card: any, cardIdx: number) => (
                  <div
                    key={cardIdx}
                    className={`p-4 rounded-lg border-l-4 ${
                      card.severity === 'high'
                        ? 'border-red-500 bg-red-50'
                        : card.severity === 'medium'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <h4 className="font-semibold text-lg mb-2">{card.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                    {card.savings && (
                      <p className="text-lg font-bold text-green-600 mb-3">
                        Potential savings: ${card.savings.toFixed(2)}/month
                      </p>
                    )}
                    {card.actions && card.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {card.actions.map((action: any, actionIdx: number) => (
                          <button
                            key={actionIdx}
                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );

          case 'dashboard':
            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {component.data?.cashflow && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Cashflow</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Income:</span>
                        <span className="text-green-600">${component.data.cashflow.income?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expenses:</span>
                        <span className="text-red-600">${component.data.cashflow.expenses?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Net:</span>
                        <span className={component.data.cashflow.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${component.data.cashflow.net?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {component.data?.netWorth && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Net Worth</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Assets:</span>
                        <span className="text-green-600">${component.data.netWorth.assets?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Liabilities:</span>
                        <span className="text-red-600">${component.data.netWorth.liabilities?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Net:</span>
                        <span className={component.data.netWorth.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${component.data.netWorth.net?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {component.data?.topCategories && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Top Categories</h4>
                    <div className="space-y-1 text-sm">
                      {component.data.topCategories.map((cat: any, catIdx: number) => (
                        <div key={catIdx} className="flex justify-between">
                          <span>{cat.category}:</span>
                          <span>${cat.total?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );

          case 'whatIfSlider':
            return (
              <div key={idx} className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">{component.data.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{component.data.description}</p>
                {component.data.currentAPR !== undefined && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        New APR: {(component.data.currentAPR * 100).toFixed(2)}%
                      </label>
                      <input
                        type="range"
                        min={component.data.newAPRRange?.[0] || 0}
                        max={component.data.newAPRRange?.[1] || 0.3}
                        step="0.01"
                        defaultValue={component.data.currentAPR}
                        className="w-full"
                        onChange={(e) => {
                          // This would trigger a recalculation
                          // Implementation would call the what-if API
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );

          case 'table':
            return (
              <div key={idx} className="bg-white p-4 rounded-lg border overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {component.data?.columns?.map((col: string, colIdx: number) => (
                        <th key={colIdx} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {component.data?.rows?.map((row: any[], rowIdx: number) => (
                      <tr key={rowIdx}>
                        {row.map((cell: any, cellIdx: number) => (
                          <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'text':
            return (
              <div key={idx} className="bg-white p-4 rounded-lg border">
                {component.data?.title && <h4 className="font-semibold mb-2">{component.data.title}</h4>}
                {component.data?.content && (
                  <pre className="whitespace-pre-wrap text-sm">{component.data.content}</pre>
                )}
              </div>
            );

          default:
            return (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(component, null, 2)}
                </pre>
              </div>
            );
        }
      })}
    </div>
  );
}