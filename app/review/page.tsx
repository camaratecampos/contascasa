'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import TransactionRow from '@/components/TransactionRow';
import type { Transaction } from '@/lib/schema';

export default function ReviewPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '50' });
      if (statusFilter) params.set('status', statusFilter);
      if (ownerFilter) params.set('owner', ownerFilter);

      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, ownerFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function handleUpdate(id: string, updates: Partial<Transaction>) {
    await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    // Optimistically update local state
    setTransactions(prev => prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
  }

  async function handleConfirmAll() {
    setConfirming(true);
    try {
      const params: Record<string, string> = {};
      if (ownerFilter) params.owner = ownerFilter;

      const res = await fetch('/api/transactions/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed', ...params }),
      });

      if (res.ok) {
        setSuccessMsg('Todas as transações foram confirmadas');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchTransactions();
      }
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Rever Transações</h2>
              <p className="text-sm text-gray-500 mt-1">{total} transações no total</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos os estados</option>
                <option value="pending">Pendentes</option>
                <option value="confirmed">Confirmados</option>
              </select>
              <select
                value={ownerFilter}
                onChange={e => { setOwnerFilter(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="Rodrigo">Rodrigo</option>
                <option value="Mariana">Mariana</option>
              </select>
              <button
                onClick={handleConfirmAll}
                disabled={confirming}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {confirming ? 'A confirmar...' : 'Confirmar todos'}
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {successMsg}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Data</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Descrição</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Banco</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Quem</th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Valor</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Categoria</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Sub-categoria</th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">A carregar...</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        Nenhuma transação encontrada
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <TransactionRow key={tx.id} transaction={tx} onUpdate={handleUpdate} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
