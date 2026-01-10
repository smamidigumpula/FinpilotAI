# Architecture Overview

## System Design

The Atlas Household CFO application uses a multi-agent architecture with MongoDB Atlas as the central data store and memory system.

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)            │
│  - React Components                     │
│  - Chat Interface                       │
│  - Dashboard                            │
│  - Data Upload                          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        API Routes (Next.js API)         │
│  - /api/auth/login                      │
│  - /api/ingest/csv                      │
│  - /api/ingest/manual                   │
│  - /api/analytics/overview              │
│  - /api/analytics/what-if               │
│  - /api/chat                            │
│  - /api/accounts                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Agent Orchestration             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Coordinator Agent             │   │
│  │   - Routes queries              │   │
│  │   - Orchestrates agents         │   │
│  │   - Combines results            │   │
│  └──────┬──────────────┬───────────┘   │
│         │              │                │
│  ┌──────▼──────┐  ┌────▼────────────┐  │
│  │  Analytics  │  │   Savings       │  │
│  │   Agent     │  │   Agent         │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  Chat/RAG    │  │  UI Composer    │ │
│  │   Agent      │  │   Agent         │ │
│  └──────────────┘  └─────────────────┘ │
│                                         │
│  ┌──────────────┐                      │
│  │  Ingestion   │                      │
│  │   Agent      │                      │
│  └──────────────┘                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│       MongoDB Atlas                     │
│                                         │
│  Collections:                           │
│  - households                           │
│  - users                                │
│  - accounts                             │
│  - transactions (with embeddings)       │
│  - liabilities                          │
│  - insurance_policies                   │
│  - assets                               │
│  - insights (with embeddings)           │
│  - chat_messages (with embeddings)      │
│                                         │
│  Vector Search Indexes:                 │
│  - transactions_vector_index            │
│  - insights_vector_index                │
│  - chat_messages_vector_index           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         External Services               │
│                                         │
│  - VoyageAI (Embeddings)                │
│  - Thesys (Generative UI - via React)   │
└─────────────────────────────────────────┘
```

## Agent Responsibilities

### Coordinator Agent
- **Purpose**: Orchestrates the entire system
- **Responsibilities**:
  - Receives user queries
  - Routes to appropriate agents
  - Combines results from multiple agents
  - Generates UI specifications
  - Tracks agent execution trace

### Ingestion Agent
- **Purpose**: Normalizes and stores financial data
- **Responsibilities**:
  - Parses CSV files
  - Normalizes transaction data
  - Creates accounts
  - Creates households
  - Maps categories

### Analytics Agent
- **Purpose**: Performs calculations and aggregations
- **Responsibilities**:
  - Cashflow analysis
  - Spend breakdown
  - Net worth calculation
  - Anomaly detection
  - Recurring expense identification

### Savings Agent
- **Purpose**: Identifies savings opportunities
- **Responsibilities**:
  - Subscription detection
  - Interest rate analysis
  - Insurance optimization suggestions
  - Food spending analysis
  - Generates insights with embeddings

### Chat/RAG Agent
- **Purpose**: Answers questions using semantic search
- **Responsibilities**:
  - Creates query embeddings
  - Performs vector search
  - Retrieves relevant context
  - Generates responses
  - Handles different query types

### UI Composer Agent
- **Purpose**: Generates UI specifications
- **Responsibilities**:
  - Converts data to UI components
  - Creates dashboard layouts
  - Generates action cards
  - Creates what-if sliders
  - Adapts UI based on data

## Data Flow

### 1. Data Ingestion Flow
```
CSV Upload / Manual Entry
    ↓
Ingestion Agent
    ↓
Normalize & Validate
    ↓
Create Embeddings (VoyageAI)
    ↓
Store in MongoDB
    ↓
Index in Vector Search
```

### 2. Query Flow
```
User Query (Chat Interface)
    ↓
Coordinator Agent
    ↓
Route to Appropriate Agent(s)
    ↓
Analytics Agent → Calculations
    ↓
Savings Agent → Opportunities
    ↓
Chat Agent → Vector Search
    ↓
UI Composer → UI Spec
    ↓
Coordinator → Combine Results
    ↓
Return Response + UI Components
```

### 3. Vector Search Flow
```
User Question
    ↓
Create Embedding (VoyageAI)
    ↓
MongoDB Vector Search
    ↓
Filter by householdId
    ↓
Retrieve Similar Documents
    ↓
Use as Context for Response
```

## Key Features

### Multi-Agent Collaboration
- Agents work independently but share MongoDB state
- Coordinator orchestrates complex multi-step queries
- Agent trace shows execution path for transparency

### Vector Search Memory
- Transactions, insights, and chat messages are embedded
- Semantic search finds relevant context
- Enables "remembering" past conversations

### Generative UI
- UI components generated dynamically based on data
- Adapts to different household situations
- Action cards, charts, sliders created on-the-fly

### Privacy & Security
- All queries filtered by householdId
- Row-level access control
- Embeddings stored per household
- No cross-household data leakage

## Technology Choices

### Why MongoDB Atlas?
- Native vector search support
- Flexible schema for financial data
- Easy to add new fields
- Built-in aggregation pipelines
- Shared memory for agents

### Why VoyageAI?
- High-quality embeddings
- 1024 dimensions (good balance)
- Fast API
- Good for financial text

### Why Next.js?
- Full-stack framework
- API routes for backend
- React for frontend
- Easy deployment
- TypeScript support

### Why Agent Architecture?
- Modular and extensible
- Easy to add new agents
- Clear separation of concerns
- Can run agents in parallel
- Transparent execution (agent trace)

## Scaling Considerations

### Current Implementation
- Single MongoDB cluster
- Embeddings created on-demand
- Agents run synchronously

### Potential Improvements
- Background jobs for embeddings
- Parallel agent execution
- Caching frequently accessed data
- Separate read/write replicas
- Horizontal scaling of agents

## Security Considerations

### Current
- JWT-based authentication (simple)
- Household-level data isolation
- Environment variables for secrets

### Production Needs
- Proper OAuth implementation
- Rate limiting
- Input validation
- SQL injection prevention (N/A - using MongoDB)
- XSS prevention (React escapes by default)
- CORS configuration
- Audit logging

## Performance Optimizations

1. **Embeddings**: Batch create embeddings instead of one-by-one
2. **Vector Search**: Use appropriate numCandidates for balance
3. **Caching**: Cache analytics results for dashboard
4. **Indexes**: Ensure proper MongoDB indexes on filters
5. **Pagination**: Limit result sizes in vector search

## Future Enhancements

1. **Real-time Updates**: WebSocket for live data updates
2. **Plaid Integration**: Direct bank account connection
3. **Scheduled Jobs**: Automatic insight generation
4. **Advanced Analytics**: ML-based predictions
5. **Mobile App**: React Native version
6. **Multi-currency**: Support for international users
7. **Collaborative Budgeting**: Multiple users per household