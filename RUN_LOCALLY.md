# Run Application Locally

## Quick Start

### Option 1: Using the Script (Easiest)

```bash
./run-local.sh
```

This script will:
1. ✅ Check Node.js is installed
2. ✅ Install dependencies if needed
3. ✅ Create `.env.local` if missing
4. ✅ Start the development server

### Option 2: Manual Steps

#### Step 1: Install Dependencies

```bash
npm install
```

#### Step 2: Create Environment File

```bash
cp env.local.template .env.local
```

Edit `.env.local` and update:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `VOYAGE_API_KEY` - Your VoyageAI API key

**Quick setup** (using your MongoDB credentials):
```bash
cat > .env.local << 'EOF'
MONGODB_URI=mongodb+srv://smamidigump:Rippling%401234@YOUR_CLUSTER_URL.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=FinpilotAI
VOYAGE_API_KEY=your_voyage_api_key_here
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
EOF
```

Replace `YOUR_CLUSTER_URL` with your actual MongoDB Atlas cluster URL.

#### Step 3: Start Development Server

```bash
npm run dev
```

#### Step 4: Open in Browser

Open http://localhost:3000 in your browser.

## Accessing the UI

Once the server is running:

1. **Open**: http://localhost:3000
2. **Login**: Use any email address (e.g., `demo@example.com`)
3. **Explore**:
   - **Overview Tab**: Financial dashboard with charts
   - **Chat Assistant Tab**: Ask questions about your finances
   - **Upload Data Tab**: Upload CSV files or enter data manually

## UI Screenshots & Features

### Login Page
- Clean, modern login interface
- Email-based authentication
- Auto-creates household on first login

### Dashboard Overview
- **Cashflow Card**: Income vs Expenses, Net cashflow
- **Net Worth Card**: Assets vs Liabilities, Net worth
- **Top Category Card**: Highest spending category
- **Spending Chart**: Pie chart by category
- **Detailed Breakdown**: Table with all categories

### Chat Assistant
- Conversational AI interface
- Suggested queries for quick start
- Real-time responses with UI components
- Vector search-powered context

### Data Upload
- CSV file upload
- Manual entry for:
  - Liabilities (mortgage, loans, credit cards)
  - Insurance policies
  - Assets
- Account management

## Troubleshooting

### Port 3000 Already in Use

If you get "port 3000 already in use":

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### MongoDB Connection Errors

1. **Check `.env.local`** has correct MongoDB URI
2. **Verify IP whitelist** in MongoDB Atlas
3. **Test connection**: Check MongoDB Atlas dashboard

### Missing Dependencies

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Development Mode Features

- ✅ **Hot Reload**: Changes reflect immediately
- ✅ **TypeScript**: Full type checking
- ✅ **Error Overlay**: Helpful error messages
- ✅ **Fast Refresh**: React components update instantly

## Next Steps After Starting

1. ✅ **Login** with any email
2. ✅ **Create Account** in Upload Data tab
3. ✅ **Upload CSV** or enter data manually
4. ✅ **View Overview** to see financial picture
5. ✅ **Chat** with AI assistant

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Production Build

To build for production:

```bash
npm run build
npm start
```

Production server will run on port 3000 (or PORT environment variable).

Enjoy exploring the FinpilotAI application! 🚀