import { NextRequest, NextResponse } from 'next/server';
import { CoordinatorAgent } from '@/lib/agents/coordinatorAgent';
import { CategorizationAgent } from '@/lib/agents/categorizationAgent';
import { embedTransaction } from '@/lib/embeddings';
import { getDb } from '@/lib/mongodb';
import { spawn } from 'child_process';

const parsePdfTextWithNode = async (buffer: Buffer) =>
  new Promise<string>((resolve, reject) => {
    const script = `
      const { PDFParse } = require('pdf-parse');
      let input = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => { input += chunk; });
      process.stdin.on('end', async () => {
        try {
          const data = Buffer.from(input, 'base64');
          const parser = new PDFParse({ data });
          const result = await parser.getText();
          await parser.destroy();
          process.stdout.write(result.text || '');
        } catch (err) {
          console.error(err && err.message ? err.message : String(err));
          process.exit(1);
        }
      });
    `;

    const child = spawn(process.execPath, ['-e', script], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || 'PDF parse failed'));
        return;
      }
      resolve(stdout);
    });

    child.stdin.write(buffer.toString('base64'));
    child.stdin.end();
  });

type ParsedTransaction = {
  postedAt: Date;
  amount: number;
  merchant?: string;
  category?: string;
  raw: string;
};

const parseAmount = (rawAmount: string) => {
  const trimmed = rawAmount.trim().replace(/\s+/g, '');
  const isParen = trimmed.startsWith('(') && trimmed.endsWith(')');
  const cleaned = trimmed.replace(/[(),$]/g, '');
  const value = parseFloat(cleaned.replace(/,/g, ''));
  if (Number.isNaN(value)) return null;
  return isParen ? -Math.abs(value) : value;
};

const parseDate = (rawDate: string) => {
  const normalized = rawDate.replace(/\./g, '/').replace(/-/g, '/');
  const parts = normalized.split('/');
  if (parts.length < 2) return null;
  let month = parts[0];
  let day = parts[1];
  let yearPart = parts[2];

  if (!yearPart) {
    yearPart = String(new Date().getFullYear());
  } else if (yearPart.length === 2) {
    yearPart = `20${yearPart}`;
  }

  const date = new Date(
    `${yearPart}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  );
  return Number.isNaN(date.getTime()) ? null : date;
};

const extractPdfTransactions = (text: string) => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const results: ParsedTransaction[] = [];
  const dateStartRegex = /^(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+/;
  const amountEndRegex = /(-?\$?\d{1,3}(?:,\d{3})*\.\d{2}|\$?\d+\.\d{2})\s*$/;
  const headerRegex =
    /^(ACCOUNT ACTIVITY|PAYMENTS AND OTHER CREDITS|PURCHASE|Date of Transaction|Merchant Name|Amount)$/i;

  let activityStarted = false;
  let current: ParsedTransaction | null = null;

  const flushCurrent = () => {
    if (current) {
      results.push(current);
      current = null;
    }
  };

  for (const line of lines) {
    if (headerRegex.test(line)) {
      if (/ACCOUNT ACTIVITY/i.test(line)) activityStarted = true;
      continue;
    }

    const dateMatch = line.match(dateStartRegex);
    if (dateMatch) {
      if (current) flushCurrent();

      const rawDate = dateMatch[1];
      const date = parseDate(rawDate);
      if (!date) continue;

      const amountMatch = line.match(amountEndRegex);
      if (!amountMatch) continue;

      const rawAmount = amountMatch[1];
      const amount = parseAmount(rawAmount);
      if (amount === null) continue;

      const merchant = line
        .replace(dateMatch[0], '')
        .replace(amountMatch[0], '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      current = {
        postedAt: date,
        amount,
        merchant: merchant || undefined,
        raw: line,
      };

      activityStarted = true;
      continue;
    }

    if (!activityStarted) continue;

    if (current) {
      current.merchant = `${current.merchant || ''} ${line}`.trim();
      current.raw = `${current.raw} ${line}`.trim();
    }
  }

  flushCurrent();

  return results;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const householdId = formData.get('householdId') as string;
    const accountId = formData.get('accountId') as string;
    const accountType = (formData.get('accountType') as 'bank' | 'credit_card') || 'bank';

    if (!file || !householdId || !accountId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, householdId, accountId' },
        { status: 400 }
      );
    }

    const coordinator = new CoordinatorAgent();
    const ingestionAgent = coordinator.getIngestionAgent();
    const categorizationAgent = new CategorizationAgent();

    const fileName = file.name || '';
    const isPdf =
      file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfText = await parsePdfTextWithNode(buffer);
      const parsedTransactions = extractPdfTransactions(pdfText);

      if (parsedTransactions.length === 0) {
        return NextResponse.json(
          {
            error:
              'No transactions detected in the PDF. Please ensure it is a statement with line-item transactions.',
          },
          { status: 400 }
        );
      }

      const normalizedTransactions = parsedTransactions.map((tx) => {
        const normalizedAmount =
          accountType === 'credit_card'
            ? tx.amount > 0
              ? -Math.abs(tx.amount)
              : Math.abs(tx.amount)
            : tx.amount;

        return {
          accountId,
          postedAt: tx.postedAt,
          amount: normalizedAmount,
          currency: 'USD',
          merchant: tx.merchant,
          category: tx.category || categorizationAgent.categorize(tx.merchant),
          raw: { line: tx.raw },
        };
      });

      const db = await getDb();
      const transactionsCollection = db.collection('transactions');

      const transactionsWithEmbeddings = await Promise.all(
        normalizedTransactions.map(async (tx) => {
          const embedded = await embedTransaction(tx as any);
          return {
            ...embedded,
            householdId,
            createdAt: new Date(),
          };
        })
      );

      if (transactionsWithEmbeddings.length > 0) {
        await transactionsCollection.insertMany(transactionsWithEmbeddings);
      }

      return NextResponse.json({
        success: true,
        count: transactionsWithEmbeddings.length,
        message: `Successfully imported ${transactionsWithEmbeddings.length} transactions from PDF`,
      });
    }

    // Read file content
    const csvContent = await file.text();

    // Normalize and store transactions
    const normalizedTransactions = await ingestionAgent.normalizeCSV(
      csvContent,
      householdId,
      accountId,
      accountType
    );

    // Create embeddings for transactions
    const db = await getDb();
    const transactionsCollection = db.collection('transactions');

    const transactionsWithEmbeddings = await Promise.all(
      normalizedTransactions.map(async (tx) => {
        const embedded = await embedTransaction(tx as any);
        return {
          ...embedded,
          householdId,
          createdAt: new Date(),
        };
      })
    );

    // Insert transactions
    if (transactionsWithEmbeddings.length > 0) {
      await transactionsCollection.insertMany(transactionsWithEmbeddings);
    }

    return NextResponse.json({
      success: true,
      count: transactionsWithEmbeddings.length,
      message: `Successfully imported ${transactionsWithEmbeddings.length} transactions`,
    });
  } catch (error: any) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import CSV' },
      { status: 500 }
    );
  }
}
