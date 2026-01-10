import { getDb } from '../mongodb';
import type { Transaction, Account, Household } from '../types';
import { parse } from 'csv-parse/sync';

export interface CSVRow {
  [key: string]: string;
}

export interface NormalizedTransaction {
  accountId: string;
  postedAt: Date;
  amount: number;
  currency: string;
  merchant?: string;
  category?: string;
  subcategory?: string;
  raw: CSVRow;
}

/**
 * Ingestion Agent - Normalizes and stores financial data
 */
export class IngestionAgent {
  async normalizeCSV(
    csvContent: string,
    householdId: string,
    accountId: string,
    accountType: 'bank' | 'credit_card'
  ): Promise<NormalizedTransaction[]> {
    const records: CSVRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    return records.map((row) => {
      // Common CSV column mappings
      const dateStr = row.date || row.Date || row.postedDate || row['Posted Date'];
      const amountStr = row.amount || row.Amount || row.transaction || row['Transaction Amount'];
      const merchant = row.merchant || row.Merchant || row.description || row.Description || row.name || row.Name;
      const category = row.category || row.Category || row.type || row.Type;

      const amount = parseFloat(amountStr?.replace(/[^-\d.]/g, '') || '0');
      // For credit cards, expenses are typically positive in CSV, but we store as negative
      // For bank accounts, deposits are positive, withdrawals are negative
      const normalizedAmount = accountType === 'credit_card' 
        ? (amount > 0 ? -Math.abs(amount) : Math.abs(amount))
        : amount;

      const date = dateStr ? new Date(dateStr) : new Date();

      return {
        accountId,
        postedAt: date,
        amount: normalizedAmount,
        currency: 'USD',
        merchant,
        category: this.mapCategory(category),
        raw: row,
      };
    });
  }

  async storeTransactions(transactions: NormalizedTransaction[], householdId: string): Promise<void> {
    const db = await getDb();
    const collection = db.collection<Transaction>('transactions');

    const docs = transactions.map((tx) => ({
      ...tx,
      householdId,
      createdAt: new Date(),
    }));

    if (docs.length > 0) {
      await collection.insertMany(docs);
    }
  }

  async createAccount(
    householdId: string,
    type: 'credit_card' | 'bank' | 'mortgage' | 'insurance' | 'asset',
    provider: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const db = await getDb();
    const collection = db.collection<Account>('accounts');

    const result = await collection.insertOne({
      householdId,
      type,
      provider,
      metadata,
      createdAt: new Date(),
    });

    return result.insertedId.toString();
  }

  async createHousehold(name: string, currency: string = 'USD'): Promise<string> {
    const db = await getDb();
    const collection = db.collection<Household>('households');

    const result = await collection.insertOne({
      name,
      currency,
      members: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return result.insertedId.toString();
  }

  private mapCategory(category?: string): string {
    if (!category) return 'Uncategorized';

    const lower = category.toLowerCase();
    
    // Common category mappings
    const mappings: Record<string, string> = {
      'groceries': 'Groceries',
      'restaurant': 'Dining',
      'food': 'Dining',
      'gas': 'Gas',
      'gasoline': 'Gas',
      'fuel': 'Gas',
      'utilities': 'Utilities',
      'electric': 'Utilities',
      'water': 'Utilities',
      'phone': 'Utilities',
      'internet': 'Utilities',
      'shopping': 'Shopping',
      'entertainment': 'Entertainment',
      'travel': 'Travel',
      'healthcare': 'Healthcare',
      'insurance': 'Insurance',
      'mortgage': 'Housing',
      'rent': 'Housing',
      'salary': 'Income',
      'payroll': 'Income',
      'transfer': 'Transfer',
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (lower.includes(key)) {
        return value;
      }
    }

    return category;
  }
}