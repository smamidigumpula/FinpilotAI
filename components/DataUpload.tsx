'use client';

import { useState, useEffect } from 'react';

interface DataUploadProps {
  householdId: string;
}

interface Account {
  _id: string;
  type: string;
  provider: string;
  name?: string;
}

export default function DataUpload({ householdId }: DataUploadProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [accountType, setAccountType] = useState<'bank' | 'credit_card'>('bank');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAccounts();
  }, [householdId]);

  const loadAccounts = async () => {
    try {
      const response = await fetch(`/api/accounts?householdId=${householdId}`);
      const data = await response.json();
      if (data.accounts) {
        setAccounts(data.accounts);
        if (data.accounts.length > 0) {
          setSelectedAccount(data.accounts[0]._id);
        }
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const createAccount = async () => {
    const provider = prompt('Enter provider name (e.g., Chase, Bank of America):');
    if (!provider) return;

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          type: accountType,
          provider,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadAccounts();
        setSelectedAccount(data.accountId);
        setMessage({ type: 'success', text: 'Account created successfully!' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create account' });
    }
  };

  const handleFileUpload = async () => {
    if (!file || !selectedAccount) {
      setMessage({ type: 'error', text: 'Please select a file and account' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('householdId', householdId);
      formData.append('accountId', selectedAccount);
      formData.append('accountType', accountType);

      const response = await fetch('/api/ingest/csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage({
        type: 'success',
        text: data.message || `Successfully imported ${data.count} transactions!`,
      });
      setFile(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload file' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async (type: 'liability' | 'insurance' | 'asset') => {
    const data: any = {};

    if (type === 'liability') {
      data.type = prompt('Type (mortgage, loan, credit_card, other):') || 'other';
      data.name = prompt('Name:') || 'Unnamed Liability';
      data.apr = parseFloat(prompt('APR (e.g., 0.2399 for 23.99%):') || '0');
      data.balance = parseFloat(prompt('Balance:') || '0');
      data.minPayment = parseFloat(prompt('Minimum monthly payment:') || '0');
      data.paymentFrequency = 'monthly';
    } else if (type === 'insurance') {
      data.kind = prompt('Kind (auto, home, health, life, other):') || 'other';
      data.provider = prompt('Provider:') || 'Unknown';
      data.premiumMonthly = parseFloat(prompt('Monthly premium:') || '0');
      data.deductible = parseFloat(prompt('Deductible:') || '0');
      data.renewalDate = new Date().toISOString().split('T')[0];
    } else if (type === 'asset') {
      data.type = prompt('Type (cash, investment, property, vehicle, other):') || 'other';
      data.name = prompt('Name:') || 'Unnamed Asset';
      data.value = parseFloat(prompt('Value:') || '0');
      data.currency = 'USD';
      data.valuationDate = new Date().toISOString().split('T')[0];
    }

    try {
      const response = await fetch('/api/ingest/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          householdId,
          data,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Data saved successfully!' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save data' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Financial Data</h2>

        {/* Account Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type
          </label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as 'bank' | 'credit_card')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="bank">Bank Account</option>
            <option value="credit_card">Credit Card</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Account
          </label>
          <div className="flex gap-2">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Account --</option>
              {accounts
                .filter((acc) => acc.type === accountType)
                .map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.provider} - {acc.name || acc.type}
                  </option>
                ))}
            </select>
            <button
              onClick={createAccount}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              New Account
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV or PDF File
          </label>
          <input
            type="file"
            accept=".csv,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload a CSV file with transactions or a PDF statement.
          </p>
        </div>

        <button
          onClick={handleFileUpload}
          disabled={loading || !file || !selectedAccount}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>

        {message && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Manual Entry */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Manual Entry</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleManualEntry('liability')}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left"
          >
            <h3 className="font-semibold mb-1">Add Liability</h3>
            <p className="text-sm text-gray-600">Mortgage, loans, credit cards</p>
          </button>

          <button
            onClick={() => handleManualEntry('insurance')}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left"
          >
            <h3 className="font-semibold mb-1">Add Insurance</h3>
            <p className="text-sm text-gray-600">Auto, home, health, life</p>
          </button>

          <button
            onClick={() => handleManualEntry('asset')}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left"
          >
            <h3 className="font-semibold mb-1">Add Asset</h3>
            <p className="text-sm text-gray-600">Cash, investments, property</p>
          </button>
        </div>
      </div>
    </div>
  );
}
