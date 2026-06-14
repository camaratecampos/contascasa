import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';

export async function DELETE() {
  try {
    await db.delete(transactions);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Clear error:', err);
    return NextResponse.json({ error: 'Erro ao eliminar transações' }, { status: 500 });
  }
}
