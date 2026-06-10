import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { eq, and, inArray, ne, like } from 'drizzle-orm';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { ids, status, owner, bank, month } = body;

    if (ids && Array.isArray(ids) && ids.length > 0) {
      // Bulk update specific IDs
      await db.update(transactions)
        .set({ status: status || 'confirmed' })
        .where(inArray(transactions.id, ids));

      return NextResponse.json({ updated: ids.length });
    }

    // Otherwise update by filter — only the "confirm all" flow is supported here
    if (status !== 'confirmed') {
      return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
    }

    const conditions = [ne(transactions.status, 'confirmed')];
    if (owner) conditions.push(eq(transactions.owner, owner));
    if (bank) conditions.push(eq(transactions.bank, bank));
    if (month) conditions.push(like(transactions.date, `${month}%`));

    await db.update(transactions)
      .set({ status: 'confirmed' })
      .where(and(...conditions));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Bulk update error:', err);
    return NextResponse.json({ error: 'Erro ao actualizar' }, { status: 500 });
  }
}
