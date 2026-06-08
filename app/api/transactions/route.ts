import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { eq, and, like, sql, asc, desc, isNull } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM
    const owner = searchParams.get('owner');
    const bank = searchParams.get('bank');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const sortDir = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';
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
    if (category === 'none') {
      conditions.push(isNull(transactions.category));
    } else if (category) {
      conditions.push(eq(transactions.category, category));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const order = sortDir === 'asc' ? asc(transactions.date) : desc(transactions.date);

    const [countResult, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(transactions).where(where),
      db.select().from(transactions)
        .where(where)
        .orderBy(order)
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
