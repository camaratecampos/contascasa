import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/schema';
import { and, like, gte, lte } from 'drizzle-orm';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from'); // YYYY-MM
    const to = searchParams.get('to');     // YYYY-MM

    const conditions = [];

    if (from) {
      conditions.push(gte(transactions.date, `${from}-01`));
    }
    if (to) {
      // Last day of month
      const [y, m] = to.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      conditions.push(lte(transactions.date, `${to}-${String(lastDay).padStart(2, '0')}`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db.select().from(transactions).where(where)
      .orderBy(transactions.date);

    // Build Excel
    const data = rows.map(tx => ({
      'Data': tx.date,
      'Descrição': tx.description,
      'Débito': tx.debit ?? '',
      'Crédito': tx.credit ?? '',
      'Quem Pagou': tx.owner,
      'Banco': tx.bank === 'novobanco' ? 'Novo Banco' : 'Millennium BCP',
      'Categoria': tx.category ?? '',
      'Subcategoria': tx.subcategory ?? '',
      'Estado': tx.status === 'confirmed' ? 'Confirmado' : 'Pendente',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-width columns
    const colWidths = [
      { wch: 12 }, // Data
      { wch: 50 }, // Descrição
      { wch: 12 }, // Débito
      { wch: 12 }, // Crédito
      { wch: 12 }, // Quem Pagou
      { wch: 16 }, // Banco
      { wch: 16 }, // Categoria
      { wch: 16 }, // Subcategoria
      { wch: 12 }, // Estado
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Transações');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = from && to
      ? `contascasa_${from}_${to}.xlsx`
      : `contascasa_export.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 });
  }
}
