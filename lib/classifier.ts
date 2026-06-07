import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { classification_rules } from './schema';
import { like } from 'drizzle-orm';

export const CATEGORIES = [
  'Casa',
  'Saúde',
  'Supermercado',
  'Restaurantes',
  'Carro',
  'Escola',
  'Miúdos',
  'Viagens',
  'Vestuário',
  'Outros',
  'Ordenados',
] as const;

export type Category = typeof CATEGORIES[number];

export interface ClassificationResult {
  category: string;
  subcategory: string;
  source: 'rule' | 'ai' | 'none';
}

export async function classifyByRules(description: string): Promise<ClassificationResult | null> {
  const upper = description.toUpperCase();

  // Get all rules ordered by priority desc
  const rules = await db.select().from(classification_rules).orderBy();

  // Sort by priority descending, then by keyword length descending (more specific first)
  const sorted = rules.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.keyword.length - a.keyword.length;
  });

  for (const rule of sorted) {
    if (upper.includes(rule.keyword.toUpperCase())) {
      return {
        category: rule.category,
        subcategory: rule.subcategory || '',
        source: 'rule',
      };
    }
  }

  return null;
}

export async function classifyByAI(description: string): Promise<ClassificationResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Classify this Portuguese bank transaction into one of these categories: Casa, Saúde, Supermercado, Restaurantes, Carro, Escola, Miúdos, Viagens, Vestuário, Outros, Ordenados.
Transaction: "${description}"
Return JSON only: {"category": "...", "subcategory": "..."}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;

    const text = content.text.trim();
    // Extract JSON from response
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);
    return {
      category: result.category || 'Outros',
      subcategory: result.subcategory || '',
      source: 'ai',
    };
  } catch {
    return null;
  }
}

export async function classify(description: string): Promise<ClassificationResult> {
  // First try rules
  const ruleResult = await classifyByRules(description);
  if (ruleResult) return ruleResult;

  // Then try AI
  const aiResult = await classifyByAI(description);
  if (aiResult) return aiResult;

  return { category: '', subcategory: '', source: 'none' };
}

export async function classifyTransactions<T extends { description: string; category?: string | null; subcategory?: string | null }>(
  transactions: T[]
): Promise<T[]> {
  const results: T[] = [];

  for (const tx of transactions) {
    if (tx.category) {
      results.push(tx);
      continue;
    }

    const result = await classify(tx.description);
    results.push({
      ...tx,
      category: result.category || null,
      subcategory: result.subcategory || null,
    });
  }

  return results;
}
