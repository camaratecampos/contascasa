import { NextResponse } from 'next/server';
import { setSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const expectedPassword = process.env.APP_PASSWORD || 'contascasa2026';

    if (password !== expectedPassword) {
      return NextResponse.json({ error: 'Palavra-passe incorreta' }, { status: 401 });
    }

    await setSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
