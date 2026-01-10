/**
 * Seed Data Script
 * 
 * This script creates sample data for testing and demos.
 * Run with: npx tsx scripts/seed-data.ts
 */

import { getDb } from '../lib/mongodb';
import { IngestionAgent } from '../lib/agents/ingestionAgent';
import { embedTransaction } from '../lib/embeddings';
import type { Transaction, Liability, InsurancePolicy, Asset } from '../lib/types';

async function seedData() {
  console.log('Starting seed data...');

  const db = await getDb();
  const ingestionAgent = new IngestionAgent();

  // Create demo household
  const householdId = await ingestionAgent.createHousehold('Demo Household');
  console.log(`Created household: ${householdId}`);

  // Create accounts
  const bankAccountId = await ingestionAgent.createAccount(
    householdId,
    'bank',
    'Chase Bank',
    { accountNumber: '****1234' }
  );

  const creditCardId = await ingestionAgent.createAccount(
    householdId,
    'credit_card',
    'Chase Sapphire',
    { cardNumber: '****5678' }
  );

  console.log(`Created accounts: ${bankAccountId}, ${creditCardId}`);

  // Create sample transactions (last 3 months)
  const transactions: Transaction[] = [];
  const now = new Date();
  
  // Income transactions
  for (let month = 0; month < 3; month++) {
    const date = new Date(now.getFullYear(), now.getMonth() - month, 1);
    transactions.push({
      householdId,
      accountId: bankAccountId,
      postedAt: date,
      amount: 5000,
      currency: 'USD',
      merchant: 'Employer',
      category: 'Income',
      isRecurring: true,
      raw: {},
      createdAt: new Date(),
    });
  }

  // Expense transactions
  const expenses = [
    { merchant: 'Costco', category: 'Groceries', amount: 200, recurring: true },
    { merchant: 'Whole Foods', category: 'Groceries', amount: 120, recurring: true },
    { merchant: 'Uber Eats', category: 'Dining', amount: 45, recurring: true },
    { merchant: 'Chipotle', category: 'Dining', amount: 35, recurring: false },
    { merchant: 'Netflix', category: 'Entertainment', amount: 15.99, recurring: true },
    { merchant: 'Spotify', category: 'Entertainment', amount: 9.99, recurring: true },
    { merchant: 'Amazon Prime', category: 'Subscriptions', amount: 14.99, recurring: true },
    { merchant: 'Shell', category: 'Gas', amount: 60, recurring: true },
    { merchant: 'Electric Company', category: 'Utilities', amount: 120, recurring: true },
    { merchant: 'AT&T', category: 'Utilities', amount: 80, recurring: true },
    { merchant: 'Target', category: 'Shopping', amount: 150, recurring: false },
    { merchant: 'Best Buy', category: 'Shopping', amount: 300, recurring: false },
  ];

  for (let month = 0; month < 3; month++) {
    const baseDate = new Date(now.getFullYear(), now.getMonth() - month, 1);
    
    for (const expense of expenses) {
      if (expense.recurring || Math.random() > 0.7) {
        const day = expense.recurring ? 5 : Math.floor(Math.random() * 28) + 1;
        const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), day);
        
        transactions.push({
          householdId,
          accountId: creditCardId,
          postedAt: date,
          amount: -expense.amount,
          currency: 'USD',
          merchant: expense.merchant,
          category: expense.category,
          isRecurring: expense.recurring,
          raw: {},
          createdAt: new Date(),
        });
      }
    }
  }

  // Embed and insert transactions
  console.log(`Creating embeddings for ${transactions.length} transactions...`);
  const transactionsWithEmbeddings = await Promise.all(
    transactions.map(async (tx) => await embedTransaction(tx))
  );

  const transactionsCollection = db.collection('transactions');
  await transactionsCollection.insertMany(transactionsWithEmbeddings);
  console.log(`Inserted ${transactionsWithEmbeddings.length} transactions`);

  // Create liabilities
  const liabilitiesCollection = db.collection<Liability>('liabilities');
  await liabilitiesCollection.insertMany([
    {
      householdId,
      type: 'mortgage',
      name: 'Home Mortgage',
      apr: 0.0675,
      balance: 350000,
      minPayment: 2100,
      paymentFrequency: 'monthly',
      remainingTerm: 360,
      createdAt: new Date(),
    },
    {
      householdId,
      type: 'credit_card',
      name: 'Chase Sapphire',
      apr: 0.2399,
      balance: 8200,
      minPayment: 210,
      paymentFrequency: 'monthly',
      createdAt: new Date(),
    },
    {
      householdId,
      type: 'loan',
      name: 'Auto Loan',
      apr: 0.045,
      balance: 18000,
      minPayment: 350,
      paymentFrequency: 'monthly',
      remainingTerm: 60,
      createdAt: new Date(),
    },
  ]);
  console.log('Inserted liabilities');

  // Create insurance policies
  const insuranceCollection = db.collection<InsurancePolicy>('insurance_policies');
  await insuranceCollection.insertMany([
    {
      householdId,
      kind: 'auto',
      provider: 'Geico',
      premiumMonthly: 120,
      deductible: 500,
      renewalDate: new Date(now.getFullYear() + 1, now.getMonth(), 1),
      createdAt: new Date(),
    },
    {
      householdId,
      kind: 'home',
      provider: 'State Farm',
      premiumMonthly: 180,
      deductible: 2000,
      renewalDate: new Date(now.getFullYear() + 1, now.getMonth(), 1),
      createdAt: new Date(),
    },
    {
      householdId,
      kind: 'health',
      provider: 'Blue Cross',
      premiumMonthly: 450,
      deductible: 3000,
      renewalDate: new Date(now.getFullYear() + 1, 0, 1),
      createdAt: new Date(),
    },
  ]);
  console.log('Inserted insurance policies');

  // Create assets
  const assetsCollection = db.collection<Asset>('assets');
  await assetsCollection.insertMany([
    {
      householdId,
      type: 'property',
      name: 'Primary Residence',
      value: 450000,
      currency: 'USD',
      valuationDate: new Date(),
      createdAt: new Date(),
    },
    {
      householdId,
      type: 'investment',
      name: '401(k)',
      value: 125000,
      currency: 'USD',
      valuationDate: new Date(),
      createdAt: new Date(),
    },
    {
      householdId,
      type: 'cash',
      name: 'Savings Account',
      value: 25000,
      currency: 'USD',
      valuationDate: new Date(),
      createdAt: new Date(),
    },
  ]);
  console.log('Inserted assets');

  console.log('\n✅ Seed data completed!');
  console.log(`Household ID: ${householdId}`);
  console.log(`You can use this householdId to login and test the application.`);
}

seedData().catch(console.error);