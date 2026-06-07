import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { filterDuplicates } from '@/lib/duplicate';
import type { NewTransaction } from '@/lib/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const incoming: NewTransaction[] = body.transactions;

    if (!incoming || !Array.isArray(incoming)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Final duplicate check against DB
    const existingRaw = await db.select({
      date: transactions.date,
      debit: transactions.debit,
      credit: transactions.credit,
      description: transactions.description,
    }).from(transactions);

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
