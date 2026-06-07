import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { eq, and, like, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const owner = searchParams.get('owner');
    const bank = searchParams.get('bank');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const conditions = [];

    if (month) {
      conditions.push(like(transactions.date, `${month}%`));
    }
    if (owner) {
      conditions.push(eq(transactions.owner, owner));
    }
    if (bank) {
      conditions.push(eq(transactions.bank, bank));
    }
    if (status) {
      conditions.push(eq(transactions.status, status));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(transactions).where(where),
      db.select().from(transactions)
        .where(where)
        .orderBy(sql`${transactions.date} DESC`)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      transactions: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error('Transactions fetch error:', err);
    return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 });
  }
}
