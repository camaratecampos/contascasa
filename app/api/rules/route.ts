import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classification_rules } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const rules = await db.select().from(classification_rules)
      .orderBy(classification_rules.keyword);
    return NextResponse.json({ rules });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao buscar regras' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { keyword, category, subcategory, priority } = body;

    if (!keyword || !category) {
      return NextResponse.json({ error: 'Keyword e categoria são obrigatórios' }, { status: 400 });
    }

    const rule = {
      id: nanoid(),
      keyword: keyword.toUpperCase().trim(),
      category,
      subcategory: subcategory || '',
      priority: priority || 0,
    };

    await db.insert(classification_rules).values(rule);
    return NextResponse.json({ rule });
  } catch (err) {
    console.error('Create rule error:', err);
    return NextResponse.json({ error: 'Erro ao criar regra' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    await db.delete(classification_rules).where(eq(classification_rules.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao eliminar regra' }, { status: 500 });
  }
}
