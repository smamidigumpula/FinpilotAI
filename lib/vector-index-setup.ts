/**
 * MongoDB Vector Search Index Setup
 * 
 * Run this script to create vector search indexes in MongoDB Atlas.
 * You can also create these indexes manually in the Atlas UI.
 * 
 * Index definitions:
 */

export const VECTOR_INDEX_DEFINITIONS = {
  transactions: {
    name: 'transactions_vector_index',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 1024,
          similar: 'cosine',
        },
        {
          type: 'filter',
          path: 'householdId',
        },
        {
          type: 'filter',
          path: 'accountId',
        },
        {
          type: 'filter',
          path: 'category',
        },
        {
          type: 'filter',
          path: 'postedAt',
        },
      ],
    },
  },
  insights: {
    name: 'insights_vector_index',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 1024,
          similar: 'cosine',
        },
        {
          type: 'filter',
          path: 'householdId',
        },
        {
          type: 'filter',
          path: 'type',
        },
        {
          type: 'filter',
          path: 'severity',
        },
      ],
    },
  },
  chat_messages: {
    name: 'chat_messages_vector_index',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: 1024,
          similar: 'cosine',
        },
        {
          type: 'filter',
          path: 'householdId',
        },
        {
          type: 'filter',
          path: 'role',
        },
      ],
    },
  },
};

/**
 * Instructions for creating indexes in MongoDB Atlas:
 * 
 * 1. Go to your Atlas cluster
 * 2. Navigate to "Atlas Search" tab
 * 3. Click "Create Search Index"
 * 4. Select "JSON Editor"
 * 5. Use the definitions above
 * 
 * Or use MongoDB Compass / MongoDB Shell:
 * 
 * db.transactions.createSearchIndex({
 *   name: "transactions_vector_index",
 *   definition: { ... }
 * });
 */