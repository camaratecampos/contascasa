'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import TransactionRow from '@/components/TransactionRow';
import type { Transaction } from '@/lib/schema';
import { CATEGORIES } from '@/lib/categories';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReviewPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total,        setTotal]        = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [confirming,   setConfirming]   = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [ownerFilter,  setOwnerFilter]  = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc');
  const [successMsg,   setSuccessMsg]   = useState('');

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), pageSize: '50', sort: sortDir });
      if (statusFilter) p.set('status', statusFilter);
      if (ownerFilter)  p.set('owner',  ownerFilter);
      if (catFilter)    p.set('category', catFilter);
      const res  = await fetch(`/api/transactions?${p}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, statusFilter, ownerFilter, catFilter, sortDir]);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function handleUpdate(id: string, updates: Partial<Transaction>) {
    await fetch(`/api/transactions/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      setTotal(t => Math.max(0, t - 1));
    }
  }

  async function handleConfirmAll() {
    setConfirming(true);
    try {
      const body: Record<string, string> = { status: 'confirmed' };
      if (ownerFilter) body.owner = ownerFilter;
      const res = await fetch('/api/transactions/bulk', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSuccessMsg('Todas as transações confirmadas');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetch_();
      }
    } finally { setConfirming(false); }
  }

  function Filter({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
    return (
      <select value={value} onChange={e => { onChange(e.target.value); setPage(1); }}
        className="h-8 rounded-md border border-border bg-card text-xs px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring [&>option]:bg-[#1a1a1f]">
        {children}
      </select>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <NavBar />
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Transações</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{total} resultados</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter value={statusFilter} onChange={setStatusFilter}>
              <option value="">Todos os estados</option>
              <option value="pending">Pendentes</option>
              <option value="confirmed">Confirmados</option>
            </Filter>
            <Filter value={ownerFilter} onChange={setOwnerFilter}>
              <option value="">Todos</option>
              <option value="Rodrigo">Rodrigo</option>
              <option value="Mariana">Mariana</option>
            </Filter>
            <Filter value={catFilter} onChange={setCatFilter}>
              <option value="">Todas as categorias</option>
              <option value="none">Sem categoria</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Filter>
            <button
              onClick={handleConfirmAll}
              disabled={confirming}
              className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold
                disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {confirming ? 'A confirmar...' : 'Confirmar todos'}
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {successMsg}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { label: 'Data', sortable: true },
                    { label: 'Descrição' },
                    { label: 'Banco' },
                    { label: 'Quem' },
                    { label: 'Valor', right: true },
                    { label: 'Categoria' },
                    { label: 'Sub-cat.' },
                    { label: 'Estado' },
                    { label: '' },
                  ].map((col, i) => (
                    <th key={i}
                      className={cn('py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
                        col.right ? 'text-right' : 'text-left')}
                    >
                      {col.sortable ? (
                        <button
                          onClick={() => { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); setPage(1); }}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          {col.label}
                          {sortDir === 'desc'
                            ? <ChevronDown className="w-3 h-3" />
                            : <ChevronUp className="w-3 h-3" />}
                        </button>
                      ) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">A carregar...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">Nenhuma transação encontrada</td></tr>
                ) : transactions.map(tx => (
                  <TransactionRow key={tx.id} transaction={tx} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                {[['Anterior', -1], ['Próxima', 1]].map(([label, delta]) => (
                  <button key={label as string}
                    onClick={() => setPage(p => Math.max(1, Math.min(totalPages, p + (delta as number))))}
                    disabled={(delta as number) < 0 ? page === 1 : page === totalPages}
                    className="h-7 px-3 rounded-md border border-border text-xs text-foreground
                      hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {label as string}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
