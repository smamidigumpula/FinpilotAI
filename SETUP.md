# Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account
- VoyageAI API key
- npm or yarn package manager

## Step 1: Clone and Install

```bash
cd FinpilotAI
npm install
```

## Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is fine for testing)
3. Create a database user
4. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

## Step 3: Set Up Vector Search Indexes

1. In MongoDB Atlas, go to "Atlas Search" tab
2. Click "Create Search Index"
3. Select "JSON Editor"
4. Create three indexes using the definitions in `lib/vector-index-setup.ts`:

### Index 1: transactions_vector_index
- Collection: `transactions`
- Index name: `transactions_vector_index`

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similar": "cosine"
    },
    {
      "type": "filter",
      "path": "householdId"
    },
    {
      "type": "filter",
      "path": "accountId"
    },
    {
      "type": "filter",
      "path": "category"
    },
    {
      "type": "filter",
      "path": "postedAt"
    }
  ]
}
```

### Index 2: insights_vector_index
- Collection: `insights`
- Index name: `insights_vector_index`

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similar": "cosine"
    },
    {
      "type": "filter",
      "path": "householdId"
    },
    {
      "type": "filter",
      "path": "type"
    },
    {
      "type": "filter",
      "path": "severity"
    }
  ]
}
```

### Index 3: chat_messages_vector_index
- Collection: `chat_messages`
- Index name: `chat_messages_vector_index`

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1024,
      "similar": "cosine"
    },
    {
      "type": "filter",
      "path": "householdId"
    },
    {
      "type": "filter",
      "path": "role"
    }
  ]
}
```

## Step 4: Get VoyageAI API Key

1. Go to [VoyageAI](https://www.voyageai.com/)
2. Sign up for an account
3. Get your API key from the dashboard

## Step 5: Configure Environment Variables

Create `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=atlas_household_cfo
VOYAGE_API_KEY=your_voyage_api_key_here
JWT_SECRET=your_random_jwt_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**Important:** Replace:
- `username:password` with your MongoDB Atlas credentials
- `cluster.mongodb.net` with your cluster URL
- `your_voyage_api_key_here` with your VoyageAI API key
- `your_random_jwt_secret_here` with a random secret string (use `openssl rand -base64 32`)

## Step 6: Seed Sample Data (Optional)

To test the application with sample data:

```bash
npm install -g tsx
tsx scripts/seed-data.ts
```

This will create:
- A demo household
- Sample accounts
- ~90 transactions
- Sample liabilities, insurance, and assets

The script will output the household ID which you can use to test.

## Step 7: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 8: Test the Application

1. **Login**: Use any email address (e.g., `demo@example.com`)
2. **Upload Data**: 
   - Go to "Upload Data" tab
   - Create an account (bank or credit card)
   - Upload a CSV file with transactions
   - Or manually enter liabilities, insurance, assets
3. **View Overview**: See your financial picture
4. **Chat**: Ask questions like:
   - "How can I reduce my expenses?"
   - "Show me my complete financial picture"
   - "What are my highest interest rates?"

## Troubleshooting

### MongoDB Connection Issues
- Check your connection string in `.env.local`
- Make sure your IP address is whitelisted in MongoDB Atlas
- Verify database user credentials

### Vector Search Not Working
- Ensure Vector Search indexes are created and active in Atlas
- Check that embeddings have 1024 dimensions
- Verify collection names match exactly

### VoyageAI API Errors
- Check your API key is correct
- Verify you have API credits available
- Check network connectivity

### Build Errors
- Run `npm install` again
- Clear `.next` directory: `rm -rf .next`
- Check Node.js version: `node --version` (should be 18+)

## Next Steps

- Add more data sources (Plaid integration, bank APIs)
- Enhance agent capabilities
- Add more UI components
- Implement authentication properly
- Add rate limiting and security measures
- Deploy to production (Vercel, AWS, etc.)

## Support

For issues or questions, check:
- README.md for general information
- Code comments for implementation details
- MongoDB Atlas documentation for database setup
- VoyageAI documentation for embedding API