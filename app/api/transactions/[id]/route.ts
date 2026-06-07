import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions, classification_rules } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { category, subcategory, status } = body;

    const updates: {
      category?: string | null;
      subcategory?: string | null;
      status?: string;
    } = {};

    if (category !== undefined) updates.category = category;
    if (subcategory !== undefined) updates.subcategory = subcategory;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    // If category is being changed, save as a classification rule
    if (category) {
      const tx = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
      if (tx[0]) {
        const keyword = tx[0].description.substring(0, 30).toUpperCase().trim();
        // Check if rule already exists
        const existing = await db.select().from(classification_rules)
          .where(eq(classification_rules.keyword, keyword))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(classification_rules).values({
            id: nanoid(),
            keyword,
            category,
            subcategory: subcategory || '',
            priority: 0,
          });
        } else {
          await db.update(classification_rules)
            .set({ category, subcategory: subcategory || '' })
            .where(eq(classification_rules.keyword, keyword));
        }
      }
    }

    await db.update(transactions)
      .set(updates)
      .where(eq(transactions.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Transaction update error:', err);
    return NextResponse.json({ error: 'Erro ao actualizar' }, { status: 500 });
  }
}
