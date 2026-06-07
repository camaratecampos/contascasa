import { NextResponse } from 'next/server';
import { classify } from '@/lib/classifier';

export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'Descrição inválida' }, { status: 400 });
    }

    const result = await classify(description);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Classify error:', err);
    return NextResponse.json({ error: 'Erro na classificação' }, { status: 500 });
  }
}
