import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import { classification_rules } from './schema';
import type { ClassificationRule } from './schema';

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

async function loadSortedRules(): Promise<ClassificationRule[]> {
  const rules = await db.select().from(classification_rules);
  // Priority descending, then keyword length descending (more specific first)
  return rules.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.keyword.length - a.keyword.length;
  });
}

function matchRule(description: string, rules: ClassificationRule[]): ClassificationResult | null {
  const upper = description.toUpperCase();
  for (const rule of rules) {
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

export async function classifyByRules(description: string): Promise<ClassificationResult | null> {
  return matchRule(description, await loadSortedRules());
}

// Classify many descriptions in a single Anthropic API call.
// Returns a map from input index to result; indexes the model couldn't
// classify are simply absent.
async function classifyBatchByAI(
  descriptions: string[]
): Promise<Map<number, ClassificationResult>> {
  const results = new Map<number, ClassificationResult>();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || descriptions.length === 0) return results;

  try {
    const client = new Anthropic({ apiKey });

    const list = descriptions.map((d, i) => `${i}: ${d}`).join('\n');
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Classify these Portuguese bank transactions into one of these categories: ${CATEGORIES.join(', ')}.

Transactions (one per line, prefixed by index):
${list}

Return ONLY a JSON array, one object per transaction, like:
[{"index": 0, "category": "...", "subcategory": "..."}, ...]`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return results;

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return results;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return results;

    const validCategories = new Set<string>(CATEGORIES);
    for (const item of parsed) {
      const idx = Number(item?.index);
      if (!Number.isInteger(idx) || idx < 0 || idx >= descriptions.length) continue;
      if (typeof item.category !== 'string' || !validCategories.has(item.category)) continue;
      results.set(idx, {
        category: item.category,
        subcategory: typeof item.subcategory === 'string' ? item.subcategory : '',
        source: 'ai',
      });
    }
  } catch (err) {
    console.error('AI classification error:', err);
  }

  return results;
}

export async function classifyByAI(description: string): Promise<ClassificationResult | null> {
  const batch = await classifyBatchByAI([description]);
  return batch.get(0) ?? null;
}

export async function classify(description: string): Promise<ClassificationResult> {
  const ruleResult = await classifyByRules(description);
  if (ruleResult) return ruleResult;

  const aiResult = await classifyByAI(description);
  if (aiResult) return aiResult;

  return { category: '', subcategory: '', source: 'none' };
}

export async function classifyTransactions<T extends { description: string; category?: string | null; subcategory?: string | null }>(
  transactions: T[]
): Promise<T[]> {
  // Load rules once for the whole batch
  const rules = await loadSortedRules();

  const results: (T | null)[] = transactions.map(tx => {
    if (tx.category) return tx;
    const ruleResult = matchRule(tx.description, rules);
    if (ruleResult) {
      return { ...tx, category: ruleResult.category, subcategory: ruleResult.subcategory || null };
    }
    return null; // needs AI
  });

  // Batch-classify everything the rules didn't match in one API call
  const unmatchedIdx = results
    .map((r, i) => (r === null ? i : -1))
    .filter(i => i >= 0);

  if (unmatchedIdx.length > 0) {
    const aiResults = await classifyBatchByAI(unmatchedIdx.map(i => transactions[i].description));
    unmatchedIdx.forEach((txIdx, batchIdx) => {
      const ai = aiResults.get(batchIdx);
      results[txIdx] = {
        ...transactions[txIdx],
        category: ai?.category || null,
        subcategory: ai?.subcategory || null,
      };
    });
  }

  return results as T[];
}
