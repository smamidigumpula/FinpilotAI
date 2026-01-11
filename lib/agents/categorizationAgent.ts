export class CategorizationAgent {
  categorize(merchant?: string): string | undefined {
    if (!merchant) return undefined;
    const lower = merchant.toLowerCase();

    const mappings: Array<[RegExp, string]> = [
      [/uber|lyft|rideshare/, 'Transportation'],
      [/delta|southwest|united|air|airlines|flight/, 'Travel'],
      [/amazon|amzn|marketplace/, 'Shopping'],
      [/costco|walmart|target|safeway|whole foods|trader joe/, 'Groceries'],
      [/gas|fuel|chevron|shell|exxon|mobil/, 'Gas'],
      [/restaurant|cafe|coffee|starbucks|dunkin|pizza|food|eats/, 'Dining'],
      [/intuit|quickbooks/, 'Software'],
      [/insurance|geico|progressive|state farm/, 'Insurance'],
      [/mortgage|rent/, 'Housing'],
      [/payment thank you|autopay|payment/, 'Payment'],
      [/fastrak|toll/, 'Transportation'],
    ];

    for (const [pattern, category] of mappings) {
      if (pattern.test(lower)) {
        return category;
      }
    }

    return 'Uncategorized';
  }
}
