'use client';

import { useState } from 'react';
import CategorySelect from './CategorySelect';
import type { Transaction } from '@/lib/schema';
import { categoryColor } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface TransactionRowProps {
  transaction: Transaction;
  onUpdate: (id: string, updates: Partial<Transaction>) => Promise<void>;
}

function fmt(v: number | null | undefined): string {
  if (v == null) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
}

function fmtDate(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

export default function TransactionRow({ transaction: tx, onUpdate }: TransactionRowProps) {
  const [category,    setCategory]    = useState(tx.category    || '');
  const [subcategory, setSubcategory] = useState(tx.subcategory || '');
  const [saving, setSaving] = useState(false);

  async function handleCategory(v: string) {
    setCategory(v);
    setSaving(true);
    await onUpdate(tx.id, { category: v || null });
    setSaving(false);
  }

  async function handleSubBlur() {
    setSaving(true);
    await onUpdate(tx.id, { subcategory: subcategory || null });
    setSaving(false);
  }

  return (
    <tr className="border-b border-border hover:bg-white/[0.02] transition-colors group">
      {/* Date */}
      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
        {fmtDate(tx.date)}
      </td>
      {/* Description */}
      <td className="py-2.5 px-3 max-w-[260px]">
        <p className="text-sm text-foreground truncate" title={tx.description}>
          {tx.description}
        </p>
      </td>
      {/* Bank */}
      <td className="py-2.5 px-3">
        <span className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide',
          tx.bank === 'novobanco'
            ? 'bg-blue-500/15 text-blue-300'
            : 'bg-violet-500/15 text-violet-300'
        )}>
          {tx.bank === 'novobanco' ? 'NB' : 'BCP'}
        </span>
      </td>
      {/* Owner */}
      <td className="py-2.5 px-3">
        <span className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold',
          tx.owner === 'Rodrigo' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-pink-500/15 text-pink-300'
        )}>
          {tx.owner}
        </span>
      </td>
      {/* Amount */}
      <td className="py-2.5 px-3 text-right tabular-nums text-sm font-semibold whitespace-nowrap">
        {tx.debit  != null ? <span className="text-rose-400">−{fmt(tx.debit)}</span>
       : tx.credit != null ? <span className="text-emerald-400">+{fmt(tx.credit)}</span>
       : '—'}
      </td>
      {/* Category */}
      <td className="py-2.5 px-3">
        <CategorySelect value={category} onChange={handleCategory} />
      </td>
      {/* Subcategory */}
      <td className="py-2.5 px-3">
        <input
          type="text"
          value={subcategory}
          onChange={e => setSubcategory(e.target.value)}
          onBlur={handleSubBlur}
          placeholder="Sub-categoria"
          className="w-full bg-transparent border border-transparent rounded px-1.5 py-0.5 text-xs text-muted-foreground
            focus:outline-none focus:border-border focus:bg-card focus:text-foreground placeholder:text-muted-foreground/40
            hover:border-border transition-colors"
        />
      </td>
      {/* Status */}
      <td className="py-2.5 px-3">
        {saving ? (
          <span className="text-[10px] text-muted-foreground">···</span>
        ) : (
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold',
            tx.status === 'confirmed'
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-amber-500/15 text-amber-400'
          )}>
            {tx.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
          </span>
        )}
      </td>
    </tr>
  );
}
