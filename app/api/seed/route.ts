import { NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';
import { classification_rules } from '@/lib/schema';
import { SEED_RULES } from '@/lib/seed-rules';
import { nanoid } from 'nanoid';

export async function POST() {
  try {
    // Initialize DB tables
    await initDB();

    // Seed classification rules
    const existing = await db.select().from(classification_rules);
    const existingKeywords = new Set(existing.map(r => r.keyword.toUpperCase()));

    const toInsert = SEED_RULES
      .filter(r => !existingKeywords.has(r.keyword.toUpperCase()))
      .map(r => ({
        id: nanoid(),
        keyword: r.keyword.toUpperCase(),
        category: r.category,
        subcategory: r.subcategory || '',
        priority: 0,
      }));

    if (toInsert.length > 0) {
      await db.insert(classification_rules).values(toInsert);
    }

    return NextResponse.json({
      ok: true,
      seeded: toInsert.length,
      skipped: SEED_RULES.length - toInsert.length,
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json(
      { error: 'Erro ao inicializar: ' + (err instanceof Error ? err.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
