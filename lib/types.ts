export interface Household {
  _id?: string;
  name: string;
  currency: string;
  members: string[];
  goals?: {
    monthlySavings?: number;
    targetNetWorth?: number;
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  _id?: string;
  householdId: string;
  email: string;
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
  preferences?: {
    noAds?: boolean;
    [key: string]: any;
  };
  createdAt?: Date;
}

export interface Account {
  _id?: string;
  householdId: string;
  type: 'credit_card' | 'bank' | 'mortgage' | 'insurance' | 'asset';
  provider: string;
  mask?: string;
  name?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export interface Transaction {
  _id?: string;
  householdId: string;
  accountId: string;
  postedAt: Date;
  amount: number; // negative for expenses, positive for income
  currency: string;
  merchant?: string;
  category?: string;
  subcategory?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  raw?: Record<string, any>;
  embedding?: number[];
  notes?: string;
  createdAt?: Date;
}

export interface Liability {
  _id?: string;
  householdId: string;
  type: 'mortgage' | 'loan' | 'credit_card' | 'other';
  name: string;
  apr: number; // Annual Percentage Rate
  balance: number;
  minPayment: number;
  paymentFrequency: 'monthly' | 'biweekly' | 'weekly';
  remainingTerm?: number; // in months
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export interface InsurancePolicy {
  _id?: string;
  householdId: string;
  kind: 'auto' | 'home' | 'health' | 'life' | 'other';
  provider: string;
  premiumMonthly: number;
  deductible: number;
  renewalDate: Date;
  coverageDetails?: Record<string, any>;
  createdAt?: Date;
}

export interface Insight {
  _id?: string;
  householdId: string;
  type: 'savings_opportunity' | 'anomaly' | 'interest_leakage' | 'recommendation' | 'alert';
  title: string;
  body: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
  embedding?: number[];
  actions?: Array<{
    label: string;
    query: string;
    type?: string;
  }>;
  data?: Record<string, any>;
}

export interface ChatMessage {
  _id?: string;
  householdId: string;
  role: 'user' | 'assistant' | 'tool';
  text: string;
  createdAt: Date;
  embedding?: number[];
  metadata?: {
    toolCalls?: Array<{
      name: string;
      arguments: any;
      result?: any;
    }>;
    [key: string]: any;
  };
}

export interface Asset {
  _id?: string;
  householdId: string;
  type: 'cash' | 'investment' | 'property' | 'vehicle' | 'other';
  name: string;
  value: number;
  currency: string;
  valuationDate: Date;
  metadata?: Record<string, any>;
  createdAt?: Date;
}