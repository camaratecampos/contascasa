'use client';

import { useState } from 'react';
import type { NewTransaction } from '@/lib/schema';
import { categoryColor } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface Props {
  transactions: NewTransaction[];
  filtered: number;
  duplicates: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

function fmt(v: number | null | undefined) {
  if (v == null) return '—';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
}

export default function ImportPreview({ transactions, filtered, duplicates, onConfirm, onCancel }: Props) {
  const [confirming, setConfirming] = useState(false);

  async function go() {
    setConfirming(true);
    try { await onConfirm(); } finally { setConfirming(false); }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Summary bar */}
      <div className="px-5 py-4 border-b border-border flex flex-wrap items-center gap-6">
        <Stat label="Novas transações" value={transactions.length} color="violet" />
        <Stat label="Duplicadas ignoradas" value={duplicates} color="amber" />
        <Stat label="Filtradas (ruído)" value={filtered} color="zinc" />
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card border-b border-border">
            <tr>
              {['Data', 'Descrição', 'Banco', 'Quem', 'Valor', 'Categoria'].map(h => (
                <th key={h} className={cn('py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
                  h === 'Valor' ? 'text-right' : 'text-left')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 100).map((tx, i) => (
              <tr key={i} className="border-b border-border hover:bg-white/[0.02] transition-colors">
                <td className="py-1.5 px-3 text-xs text-muted-foreground whitespace-nowrap tabular-nums">{tx.date}</td>
                <td className="py-1.5 px-3 max-w-[240px]">
                  <p className="text-sm text-foreground truncate" title={tx.description}>{tx.description}</p>
                </td>
                <td className="py-1.5 px-3">
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded',
                    tx.bank === 'novobanco' ? 'bg-blue-500/15 text-blue-300' : 'bg-violet-500/15 text-violet-300')}>
                    {tx.bank === 'novobanco' ? 'NB' : 'BCP'}
                  </span>
                </td>
                <td className="py-1.5 px-3">
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded',
                    tx.owner === 'Rodrigo' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-pink-500/15 text-pink-300')}>
                    {tx.owner}
                  </span>
                </td>
                <td className="py-1.5 px-3 text-right tabular-nums text-sm font-semibold whitespace-nowrap">
                  {tx.debit  != null ? <span className="text-rose-400">−{fmt(tx.debit)}</span>
                 : tx.credit != null ? <span className="text-emerald-400">+{fmt(tx.credit)}</span>
                 : '—'}
                </td>
                <td className="py-1.5 px-3">
                  {tx.category ? (
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', categoryColor(tx.category))}>
                      {tx.category}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </td>
              </tr>
            ))}
            {transactions.length > 100 && (
              <tr><td colSpan={6} className="py-2 px-3 text-center text-xs text-muted-foreground">
                + {transactions.length - 100} transações adicionais
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-end gap-2">
        <button onClick={onCancel}
          className="h-8 px-4 rounded-md border border-border text-xs text-foreground hover:bg-white/5 transition-colors">
          Cancelar
        </button>
        <button onClick={go} disabled={confirming || transactions.length === 0}
          className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold
            hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {confirming ? 'A importar...' : `Importar ${transactions.length} transações`}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const c: Record<string, string> = {
    violet: 'text-violet-400', amber: 'text-amber-400', zinc: 'text-zinc-400',
  };
  return (
    <div>
      <p className={cn('text-xl font-semibold tabular-nums', c[color] ?? 'text-foreground')}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
