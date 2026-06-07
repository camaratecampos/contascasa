import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
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

    let allParsed: ReturnType<typeof parseTransactions>['transactions'] = [];
    let totalFiltered = 0;
    const banks: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;

      const { transactions: parsed, bank } = parseTransactions(text, nanoid());

      // Count lines that would have been filtered (noise)
      // The parser already filters internally; we estimate 0 additional filtered
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

    // Assign IDs to unique transactions
    const withIds = unique.map(tx => ({
      ...tx,
      id: nanoid(),
    }));

    return NextResponse.json({
      transactions: withIds,
      filtered: totalFiltered,
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
