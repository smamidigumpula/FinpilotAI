# FinpilotAI

AI-powered personal finance application for households with multi-agent orchestration, MongoDB Vector Search, and generative UI.

## Features

- **Multi-Account Data Ingestion**: Import transactions from bank accounts, credit cards, and manual entry
- **AI-Powered Chat Interface**: Ask questions about your finances and get intelligent answers
- **Expense Reduction Recommendations**: Automatic identification of savings opportunities
- **Interest Rate Analysis**: Analyze and optimize interest rates on debts
- **Complete Financial Picture**: View income, expenses, assets, liabilities, and net worth
- **Vector Search Memory**: Semantic search through financial data using VoyageAI embeddings
- **Generative UI**: Dynamic UI components generated from AI responses

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas with Vector Search
- **Embeddings**: VoyageAI
- **UI Generation**: Thesys (React components for generative UI)
- **Charts**: Recharts

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn (or Docker)
- MongoDB Atlas cluster with Vector Search enabled (or local MongoDB)
- VoyageAI API key

### Quick Start with Docker

The easiest way to run the application locally is using Docker:

```bash
# 1. Clone the repository
git clone <repository-url>
cd FinpilotAI

# 2. Create .env.local file (see .env.local.example)
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 3. Start with Docker
docker-compose up --build

# 4. Access the application
open http://localhost:3000
```

For more Docker options, see [DOCKER.md](./DOCKER.md).

### Local Development (without Docker)

1. Clone the repository:
```bash
git clone <repository-url>
cd FinpilotAI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=FinpilotAI
VOYAGE_API_KEY=your_voyage_api_key_here
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_URL=http://localhost:3000
```

4. Set up MongoDB Vector Search indexes:

Go to MongoDB Atlas → Atlas Search → Create Search Index

Use the index definitions in `lib/vector-index-setup.ts`:
- `transactions_vector_index` on `transactions.embedding`
- `insights_vector_index` on `insights.embedding`
- `chat_messages_vector_index` on `chat_messages.embedding`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

### Agent System

The application uses a multi-agent orchestration system:

1. **Coordinator Agent**: Routes queries to appropriate agents
2. **Ingestion Agent**: Normalizes and stores financial data
3. **Analytics Agent**: Performs aggregations and calculations
4. **Savings Agent**: Identifies savings opportunities
5. **Chat/RAG Agent**: Answers questions using vector search
6. **UI Composer Agent**: Generates UI specifications for Thesys

### Data Model

- **households**: User households
- **users**: User accounts
- **accounts**: Financial accounts (bank, credit card, etc.)
- **transactions**: Financial transactions with embeddings
- **liabilities**: Debts and loans
- **insurance_policies**: Insurance policies
- **assets**: Assets and investments
- **insights**: Generated insights with embeddings
- **chat_messages**: Chat history with embeddings

### API Routes

- `POST /api/auth/login` - User authentication
- `POST /api/ingest/csv` - Upload CSV transactions
- `POST /api/ingest/manual` - Manual entry (liabilities, insurance, assets)
- `GET /api/analytics/overview` - Financial overview
- `POST /api/analytics/what-if` - Scenario calculations
- `POST /api/chat` - Chat interface
- `GET /api/chat` - Chat history
- `POST /api/accounts` - Create account
- `GET /api/accounts` - List accounts

## Usage

### Upload Data

1. Go to the "Upload Data" tab
2. Create an account (bank or credit card)
3. Upload a CSV file with transactions
4. Or manually enter liabilities, insurance, or assets

### Ask Questions

Use the Chat Assistant to ask questions like:
- "How can I reduce my expenses?"
- "Show me my complete financial picture"
- "What are my highest interest rates?"
- "Where can I save money?"
- "How much am I spending on food?"

### View Overview

The Overview tab shows:
- Cashflow (income vs expenses)
- Net worth (assets vs liabilities)
- Spending breakdown by category
- Top spending categories

## Demo Data

For testing, you can create a CSV file with sample transactions:

```csv
date,amount,merchant,category
2024-01-01,1500.00,Employer,Income
2024-01-05,-45.99,Costco,Groceries
2024-01-10,-15.99,Netflix,Entertainment
2024-01-15,-120.00,Electric Company,Utilities
```

## Development

### Project Structure

```
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── page.tsx         # Main page
│   └── layout.tsx       # Root layout
├── components/          # React components
│   ├── ChatInterface.tsx
│   ├── Dashboard.tsx
│   ├── DataUpload.tsx
│   ├── FinancialOverview.tsx
│   ├── Login.tsx
│   └── UIRenderer.tsx
├── lib/                 # Core library
│   ├── agents/         # Agent implementations
│   ├── embeddings.ts   # VoyageAI integration
│   ├── mongodb.ts      # MongoDB connection
│   ├── types.ts        # TypeScript types
│   └── vector-index-setup.ts
└── README.md
```

## Notes

- Vector Search indexes must be created in MongoDB Atlas before embeddings will work
- VoyageAI API key is required for embedding generation
- For production, implement proper authentication and authorization
- Add rate limiting and input validation for production use

## License

MIT

## Credits

Built with:
- MongoDB Atlas
- VoyageAI
- Thesys (generative UI)
- Next.js
- React