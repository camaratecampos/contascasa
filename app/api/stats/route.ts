import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { and, eq, like, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year  = searchParams.get('year');
    const owner = searchParams.get('owner');
    const bank  = searchParams.get('bank');

    function buildWhere(periodOverride?: string | null) {
      const conds = [];
      const period = periodOverride !== undefined ? periodOverride : (month ?? null);
      if (period) {
        conds.push(like(transactions.date, `${period}%`));
      } else if (year) {
        conds.push(like(transactions.date, `${year}%`));
      }
      if (owner) conds.push(eq(transactions.owner, owner));
      if (bank)  conds.push(eq(transactions.bank,  bank));
      return conds.length > 0 ? and(...conds) : undefined;
    }

    let prevPeriod: string | null = null;
    if (month) {
      const [y, mo] = month.split('-').map(Number);
      const d = new Date(y, mo - 2, 1);
      prevPeriod = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else if (year) {
      prevPeriod = String(Number(year) - 1);
    }

    const [summary, categorySums, ownerSums, prevSummary] = await Promise.all([
      db.select({
        totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN debit IS NOT NULL THEN debit ELSE 0 END), 0)`,
        totalIncome:   sql<number>`COALESCE(SUM(CASE WHEN credit IS NOT NULL THEN credit ELSE 0 END), 0)`,
        count:         sql<number>`COUNT(*)`,
        pendingCount:  sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
      }).from(transactions).where(buildWhere()),

      db.select({
        category: sql<string>`COALESCE(category, 'Sem categoria')`,
        total:    sql<number>`SUM(debit)`,
      }).from(transactions)
        .where(buildWhere())
        .groupBy(sql`COALESCE(category, 'Sem categoria')`),

      db.select({
        owner:    transactions.owner,
        expenses: sql<number>`COALESCE(SUM(CASE WHEN debit IS NOT NULL THEN debit ELSE 0 END), 0)`,
        income:   sql<number>`COALESCE(SUM(CASE WHEN credit IS NOT NULL THEN credit ELSE 0 END), 0)`,
      }).from(transactions)
        .where(buildWhere())
        .groupBy(transactions.owner),

      prevPeriod
        ? db.select({
            totalExpenses: sql<number>`COALESCE(SUM(CASE WHEN debit IS NOT NULL THEN debit ELSE 0 END), 0)`,
          }).from(transactions).where(buildWhere(prevPeriod))
        : Promise.resolve([{ totalExpenses: 0 }]),
    ]);

    return NextResponse.json({
      totalExpenses: Number(summary[0]?.totalExpenses ?? 0),
      totalIncome:   Number(summary[0]?.totalIncome   ?? 0),
      count:         Number(summary[0]?.count         ?? 0),
      pendingCount:  Number(summary[0]?.pendingCount  ?? 0),
      prevExpenses:  Number(prevSummary[0]?.totalExpenses ?? 0),
      categories: categorySums
        .filter(r => r.total != null)
        .map(r => ({ category: r.category, total: Number(r.total) }))
        .sort((a, b) => b.total - a.total),
      byOwner: Object.fromEntries(
        ownerSums.map(r => [r.owner, { expenses: Number(r.expenses), income: Number(r.income) }])
      ),
    });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: 'Erro ao calcular estatísticas' }, { status: 500 });
  }
}
