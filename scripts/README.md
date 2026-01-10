# Seed Data Script

This script creates sample data for testing and demos.

## Usage

1. Make sure your `.env.local` file is configured with MongoDB connection string
2. Run the script:

```bash
npx tsx scripts/seed-data.ts
```

Or install tsx globally:
```bash
npm install -g tsx
tsx scripts/seed-data.ts
```

## What it creates

- 1 demo household
- 2 accounts (bank and credit card)
- ~90 transactions across 3 months (income and expenses)
- 3 liabilities (mortgage, credit card, auto loan)
- 3 insurance policies (auto, home, health)
- 3 assets (property, 401k, savings)

The script will output the household ID which you can use to test the application.