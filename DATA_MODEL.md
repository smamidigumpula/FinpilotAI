# Data Model Documentation

Complete data model structure for FinpilotAI application.

## Collections Overview

The application uses **8 MongoDB collections** with the following structure:

```
households
  └── users (1-to-many)
      ├── accounts (1-to-many)
      │   └── transactions (1-to-many)
      ├── liabilities (1-to-many)
      ├── insurance_policies (1-to-many)
      ├── assets (1-to-many)
      ├── insights (1-to-many)
      └── chat_messages (1-to-many)
```

## Collection Details

### 1. Households Collection

**Purpose**: Represents a household/family unit that groups financial data.

```typescript
interface Household {
  _id?: string;                    // MongoDB ObjectId
  name: string;                    // "Smith Family Household"
  currency: string;                // "USD", "EUR", etc.
  members: string[];               // Array of user IDs
  goals?: {
    monthlySavings?: number;       // Target monthly savings amount
    targetNetWorth?: number;       // Target net worth goal
    [key: string]: any;            // Additional custom goals
  };
  createdAt?: Date;                // Creation timestamp
  updatedAt?: Date;                // Last update timestamp
}
```

**Example**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Smith Family Household",
  "currency": "USD",
  "members": ["507f1f77bcf86cd799439012"],
  "goals": {
    "monthlySavings": 500,
    "targetNetWorth": 1000000
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

---

### 2. Users Collection

**Purpose**: Individual users within a household.

```typescript
interface User {
  _id?: string;                    // MongoDB ObjectId
  householdId: string;             // Reference to Household._id
  email: string;                   // User email (unique)
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
  preferences?: {
    noAds?: boolean;               // Ad preferences
    [key: string]: any;            // Additional preferences
  };
  createdAt?: Date;                // Creation timestamp
}
```

**Example**:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "householdId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "riskProfile": "moderate",
  "preferences": {
    "noAds": true
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 3. Accounts Collection

**Purpose**: Financial accounts (bank accounts, credit cards, etc.).

```typescript
interface Account {
  _id?: string;                    // MongoDB ObjectId
  householdId: string;             // Reference to Household._id
  type: 'credit_card' | 'bank' | 'mortgage' | 'insurance' | 'asset';
  provider: string;                // "Chase", "Bank of America", etc.
  mask?: string;                   // Last 4 digits: "1234"
  name?: string;                   // "Primary Checking", "Sapphire Card"
  metadata?: Record<string, any>;  // Additional account details
  createdAt?: Date;                // Creation timestamp
}
```

**Example**:
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "householdId": "507f1f77bcf86cd799439011",
  "type": "credit_card",
  "provider": "Chase",
  "mask": "5678",
  "name": "Chase Sapphire Preferred",
  "metadata": {
    "accountNumber": "****5678",
    "creditLimit": 10000
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 4. Transactions Collection

**Purpose**: Individual financial transactions (income and expenses).

**⭐ Vector Search Enabled**: Has embeddings for semantic search.

```typescript
interface Transaction {
  _id?: string;                    // MongoDB ObjectId
  householdId: string;             // Reference to Household._id
  accountId: string;               // Reference to Account._id
  postedAt: Date;                  // Transaction date
  amount: number;                  // Negative for expenses, positive for income
  currency: string;                // "USD"
  merchant?: string;               // "Costco", "Employer", etc.
  category?: string;               // "Groceries", "Income", "Dining", etc.
  subcategory?: string;            // More specific categorization
  isRecurring?: boolean;           // Is this a recurring transaction?
  recurringPattern?: string;       // "monthly", "weekly", etc.
  raw?: Record<string, any>;       // Original CSV data
  embedding?: number[];            // Vector embedding (1024 dimensions) ⭐
  notes?: string;                  // User notes
  createdAt?: Date;                // Creation timestamp
}
```

**Example**:
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "householdId": "507f1f77bcf86cd799439011",
  "accountId": "507f1f77bcf86cd799439013",
  "postedAt": "2024-01-15T10:30:00Z",
  "amount": -45.99,
  "currency": "USD",
  "merchant": "Costco",
  "category": "Groceries",
  "subcategory": "Bulk Items",
  "isRecurring": true,
  "recurringPattern": "monthly",
  "embedding": [0.123, -0.456, ...],  // 1024 dimensions
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Vector Index**: `transactions_vector_index`
- Vector field: `embedding` (1024 dimensions, cosine similarity)
- Filter fields: `householdId`, `accountId`, `category`, `postedAt`

---

### 5. Liabilities Collection

**Purpose**: Debts and loans (mortgages, credit cards, loans).

```typescript
interface Liability {
  _id?: string;                    // MongoDB ObjectId
  householdId: string;             // Reference to Household._id
  type: 'mortgage' | 'loan' | 'credit_card' | 'other';
  name: string;                    // "Home Mortgage", "Auto Loan"
  apr: number;                     // Annual Percentage Rate (0.0675 = 6.75%)
  balance: number;                 // Current balance
  minPayment: number;              // Minimum monthly payment
  paymentFrequency: 'monthly' | 'biweekly' | 'weekly';
  remainingTerm?: number;          // Remaining term in months
  metadata?: Record<string, any>;  // Additional loan details
  createdAt?: Date;                // Creation timestamp
}
```

**Example**:
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "householdId": "507f1f77bcf86cd799439011",
  "type": "mortgage",
  "name": "Home Mortgage",
  "apr": 0.0675,
  "balance": 350000,
  "minPayment": 2100,
  "paymentFrequency": "monthly",
  "remainingTerm": 360,
  "metadata": {
    "propertyAddress": "123 Main St",
    "loanType": "30-year fixed"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 6. Insurance Policies Collection

**Purpose**: Insurance policies (auto, home, health, life).

```typescript
interface InsurancePolicy {
  _id?: string;                    // MongoDB ObjectId
  householdId: string;             // Reference to Household._id
  kind: 'auto' | 'home' | 'health' | 'life' | 'other';
  provider: string;                // "Geico", "State Farm", etc.
  premiumMonthly: number;          // Monthly premium cost
  deductible: number;              // Deductible amount
  renewalDate: Date;               // Next renewal date
  coverageDetails?: Record<string, any>;  // Coverage specifics
  createdAt?: Date;                // Creation timestamp
}
```

**Example**:
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "householdId": "507f1f77bcf86cd799439011",
  "kind": "auto",
  "provider": "Geico",
  "premiumMonthly": 120,
  "deductible": 500,
  "renewalDate": "2025-01-01T00:00:00Z",
  "coverageDetails": {
    "vehicles": ["Honda Civic", "Toyota Camry"],
    "coverageType": "Full Coverage"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 7. Assets Collection

**Purpose**: Assets and investments (cash, property, investments).

```typescript
interface Asset {
  _id?: string;                    // MongoDB ObjectId
  householdId: string;             // Reference to Household._id
  type: 'cash' | 'investment' | 'property' | 'vehicle' | 'other';
  name: string;                    // "Primary Residence", "401(k)"
  value: number;                   // Current value
  currency: string;                // "USD"
  valuationDate: Date;             // Date of valuation
  metadata?: Record<string, any>;  // Additional asset details
  createdAt?: Date;                // Creation timestamp
}
```

**Example**:
```json
{
  "_id": "507f1f77bcf86cd799439017",
  "householdId": "507f1f77bcf86cd799439011",
  "type": "property",
  "name": "Primary Residence",
  "value": 450000,
  "currency": "USD",
  "valuationDate": "2024-01-01T00:00:00Z",
  "metadata": {
    "address": "123 Main St",
    "propertyType": "Single Family Home"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 8. Insights Collection

**Purpose**: AI-generated insights and recommendations.

**⭐ Vector Search Enabled**: Has embeddings for semantic search.

```typescript
interface Insight {
  _id?: string;                    // MongoDB ObjectId
  householdId: string;             // Reference to Household._id
  type: 'savings_opportunity' | 'anomaly' | 'interest_leakage' | 'recommendation' | 'alert';
  title: string;                   // "Subscriptions up $86/mo"
  body: string;                    // Detailed description
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;                 // Creation timestamp
  embedding?: number[];            // Vector embedding (1024 dimensions) ⭐
  actions?: Array<{
    label: string;                 // "Review subscriptions"
    query: string;                 // "show recurring merchants"
    type?: string;                 // Action type
  }>;
  data?: Record<string, any>;      // Additional insight data
}
```

**Example**:
```json
{
  "_id": "507f1f77bcf86cd799439018",
  "householdId": "507f1f77bcf86cd799439011",
  "type": "savings_opportunity",
  "title": "Subscriptions up $86/mo",
  "body": "You have 4 recurring merchants that increased...",
  "severity": "medium",
  "createdAt": "2024-01-15T10:30:00Z",
  "embedding": [0.789, -0.123, ...],  // 1024 dimensions
  "actions": [
    {
      "label": "Review subscriptions",
      "query": "show recurring merchants",
      "type": "query"
    }
  ],
  "data": {
    "potentialMonthlySavings": 86.50,
    "category": "Subscriptions"
  }
}
```

**Vector Index**: `insights_vector_index`
- Vector field: `embedding` (1024 dimensions, cosine similarity)
- Filter fields: `householdId`, `type`, `severity`

---

### 9. Chat Messages Collection

**Purpose**: Chat conversation history with the AI assistant.

**⭐ Vector Search Enabled**: Has embeddings for semantic search.

```typescript
interface ChatMessage {
  _id?: string;                    // MongoDB ObjectId
  householdId: string;             // Reference to Household._id
  role: 'user' | 'assistant' | 'tool';
  text: string;                    // Message content
  createdAt: Date;                 // Creation timestamp
  embedding?: number[];            // Vector embedding (1024 dimensions) ⭐
  metadata?: {
    toolCalls?: Array<{
      name: string;                // Tool/function name
      arguments: any;              // Tool arguments
      result?: any;                // Tool result
    }>;
    [key: string]: any;            // Additional metadata
  };
}
```

**Example**:
```json
{
  "_id": "507f1f77bcf86cd799439019",
  "householdId": "507f1f77bcf86cd799439011",
  "role": "user",
  "text": "How can I reduce my expenses?",
  "createdAt": "2024-01-15T10:30:00Z",
  "embedding": [0.456, 0.789, ...],  // 1024 dimensions
  "metadata": {
    "agentTrace": ["Coordinator: Received query", "Savings Agent: Found 5 opportunities"]
  }
}
```

**Vector Index**: `chat_messages_vector_index`
- Vector field: `embedding` (1024 dimensions, cosine similarity)
- Filter fields: `householdId`, `role`

---

## Vector Search Indexes

The application uses **3 vector search indexes** for semantic search:

### 1. Transactions Vector Index
- **Collection**: `transactions`
- **Index Name**: `transactions_vector_index`
- **Purpose**: Semantic search for similar transactions
- **Vector Field**: `embedding` (1024 dimensions, cosine similarity)
- **Filter Fields**: `householdId`, `accountId`, `category`, `postedAt`

### 2. Insights Vector Index
- **Collection**: `insights`
- **Index Name**: `insights_vector_index`
- **Purpose**: Semantic search for relevant insights
- **Vector Field**: `embedding` (1024 dimensions, cosine similarity)
- **Filter Fields**: `householdId`, `type`, `severity`

### 3. Chat Messages Vector Index
- **Collection**: `chat_messages`
- **Index Name**: `chat_messages_vector_index`
- **Purpose**: Semantic search for conversation history
- **Vector Field**: `embedding` (1024 dimensions, cosine similarity)
- **Filter Fields**: `householdId`, `role`

---

## Relationships Diagram

```
┌─────────────────┐
│   Households    │
│  (1)            │
└────────┬────────┘
         │
         ├───┐
         │   │
    ┌────▼───▼────┐
    │    Users    │
    │  (many)     │
    └────┬────────┘
         │
    ┌────┴──────────────────────────────────┐
    │                                       │
┌───▼──────────┐  ┌───────────▼──────────┐  │
│   Accounts   │  │     Liabilities      │  │
│   (many)     │  │      (many)          │  │
└───┬──────────┘  └──────────────────────┘  │
    │                                        │
    │                                        │
┌───▼──────────┐              ┌───────────▼──────────┐
│Transactions  │              │ Insurance Policies   │
│   (many)     │              │      (many)          │
│              │              └──────────────────────┘
│ embedding ⭐  │
└──────────────┘              ┌───────────▼──────────┐
                              │       Assets         │
                              │      (many)          │
┌──────────────┐              └──────────────────────┘
│   Insights   │
│   (many)     │              ┌───────────▼──────────┐
│              │              │   Chat Messages      │
│ embedding ⭐  │              │      (many)          │
└──────────────┘              │                      │
                              │ embedding ⭐         │
                              └──────────────────────┘
```

---

## Data Privacy & Security

### Row-Level Access Control

All collections use `householdId` as the primary filter for privacy:

- ✅ Every query filters by `householdId` first
- ✅ Vector search indexes include `householdId` as a filter
- ✅ No cross-household data access
- ✅ User authentication ensures proper household assignment

### Embedded Data

- **Transactions**: Contain embeddings for semantic search
- **Insights**: Contain embeddings for recommendation relevance
- **Chat Messages**: Contain embeddings for conversation context

---

## Key Design Decisions

1. **Household-Centric**: All data is scoped to households for multi-user support
2. **Vector Embeddings**: Transactions, insights, and chat messages use embeddings for AI/ML
3. **Flexible Metadata**: Most collections have `metadata` fields for extensibility
4. **Type Safety**: All interfaces defined in TypeScript for compile-time safety
5. **Time-Series Support**: Transaction `postedAt` enables time-based analysis
6. **Semantic Search**: Vector indexes enable natural language querying

---

## Sample Queries

### Get All Transactions for Household
```typescript
db.transactions.find({ householdId: "507f1f77bcf86cd799439011" })
```

### Vector Search for Similar Transactions
```typescript
db.transactions.aggregate([
  {
    $vectorSearch: {
      queryVector: [0.123, -0.456, ...],  // Query embedding
      path: "embedding",
      filter: { householdId: "507f1f77bcf86cd799439011" },
      limit: 10
    }
  }
])
```

### Get Net Worth
```typescript
// Assets
db.assets.aggregate([
  { $match: { householdId: "..." } },
  { $group: { _id: null, total: { $sum: "$value" } } }
])

// Liabilities
db.liabilities.aggregate([
  { $match: { householdId: "..." } },
  { $group: { _id: null, total: { $sum: "$balance" } } }
])
```

---

This data model supports the full application functionality including multi-agent orchestration, vector search, and financial analytics! 🚀