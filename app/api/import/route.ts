import { NextResponse } from 'next/server';
import { parseTransactions } from '@/lib/parsers';
import { classifyTransactions } from '@/lib/classifier';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { filterDuplicates } from '@/lib/duplicate';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum ficheiro enviado' }, { status: 400 });
    }

    let allParsed: Awaited<ReturnType<typeof parseTransactions>>['transactions'] = [];
    const banks: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { transactions: parsed, bank } = await parseTransactions(buffer, nanoid());
      allParsed = allParsed.concat(parsed);
      banks.push(bank);
    }

    // Classify transactions using rules
    const classified = await classifyTransactions(allParsed);

    // Check for duplicates against existing DB records
    const existingRaw = await db.select({
      date: transactions.date,
      debit: transactions.debit,
      credit: transactions.credit,
      description: transactions.description,
    }).from(transactions);

    const { unique, duplicateCount } = filterDuplicates(classified, existingRaw);

    const withIds = unique.map(tx => ({ ...tx, id: nanoid() }));

    return NextResponse.json({
      transactions: withIds,
      filtered: 0,
      duplicates: duplicateCount,
      banks,
    });
  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json(
      { error: 'Erro ao processar PDF: ' + (err instanceof Error ? err.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

