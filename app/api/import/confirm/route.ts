import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { filterDuplicates, dateBoundsOf } from '@/lib/duplicate';
import { and, gte, lte } from 'drizzle-orm';
import type { NewTransaction } from '@/lib/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const incoming: NewTransaction[] = body.transactions;

    if (!incoming || !Array.isArray(incoming)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Final duplicate check — scoped to the date range of the incoming batch
    const bounds = dateBoundsOf(incoming);
    const existingRaw = await db.select({
      date: transactions.date,
      debit: transactions.debit,
      credit: transactions.credit,
      description: transactions.description,
    }).from(transactions).where(
      bounds
        ? and(gte(transactions.date, bounds.minDate), lte(transactions.date, bounds.maxDate))
        : undefined
    );

    const { unique, duplicateCount } = filterDuplicates(incoming, existingRaw);

    // Save in batches
    let saved = 0;
    const batchSize = 50;
    for (let i = 0; i < unique.length; i += batchSize) {
      const batch = unique.slice(i, i + batchSize);
      await db.insert(transactions).values(batch);
      saved += batch.length;
    }

    return NextResponse.json({ saved, skipped: duplicateCount });
  } catch (err) {
    console.error('Confirm import error:', err);
    return NextResponse.json(
      { error: 'Erro ao guardar: ' + (err instanceof Error ? err.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
