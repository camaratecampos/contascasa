'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import MonthPicker from '@/components/MonthPicker';
import type { Transaction } from '@/lib/schema';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPrevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

interface CategoryTotal {
  category: string;
  total: number;
}

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prevTransactions, setPrevTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');

  const fetchData = useCallback(async (m: string, prevM: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: m, pageSize: '500' });
      if (ownerFilter) params.set('owner', ownerFilter);
      if (bankFilter) params.set('bank', bankFilter);

      const [currRes, prevRes] = await Promise.all([
        fetch(`/api/transactions?${params}`),
        fetch(`/api/transactions?month=${prevM}&pageSize=500`),
      ]);

      const currData = await currRes.json();
      const prevData = await prevRes.json();

      setTransactions(currData.transactions || []);
      setPrevTransactions(prevData.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [ownerFilter, bankFilter]);

  useEffect(() => {
    fetchData(month, getPrevMonth(month));
  }, [month, fetchData]);

  const debits = transactions.filter(tx => tx.debit != null);
  const totalExpenses = debits.reduce((sum, tx) => sum + (tx.debit ?? 0), 0);
  const totalIncome = transactions.filter(tx => tx.credit != null).reduce((sum, tx) => sum + (tx.credit ?? 0), 0);

  const prevDebits = prevTransactions.filter(tx => tx.debit != null);
  const prevTotalExpenses = prevDebits.reduce((sum, tx) => sum + (tx.debit ?? 0), 0);

  const expenseChange = prevTotalExpenses > 0
    ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100
    : 0;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  for (const tx of debits) {
    const cat = tx.category || 'Sem categoria';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (tx.debit ?? 0);
  }
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  const maxCategoryAmount = sortedCategories[0]?.[1] ?? 1;

  // By owner
  const rodrigoExpenses = transactions
    .filter(tx => tx.owner === 'Rodrigo' && tx.debit != null)
    .reduce((sum, tx) => sum + (tx.debit ?? 0), 0);
  const marianaExpenses = transactions
    .filter(tx => tx.owner === 'Mariana' && tx.debit != null)
    .reduce((sum, tx) => sum + (tx.debit ?? 0), 0);

  // Recent transactions
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  return (
    <div className="flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <div className="flex items-center gap-4">
              <select
                value={ownerFilter}
                onChange={e => setOwnerFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                <option value="Rodrigo">Rodrigo</option>
                <option value="Mariana">Mariana</option>
              </select>
              <select
                value={bankFilter}
                onChange={e => setBankFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Todos os bancos</option>
                <option value="novobanco">Novo Banco</option>
                <option value="millennium">Millennium BCP</option>
              </select>
              <MonthPicker value={month} onChange={setMonth} />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">A carregar...</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm text-gray-500 mb-1">Total Despesas</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                  {prevTotalExpenses > 0 && (
                    <div className={`text-xs mt-1 ${expenseChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {expenseChange > 0 ? '▲' : '▼'} {Math.abs(expenseChange).toFixed(1)}% vs mês anterior
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm text-gray-500 mb-1">Total Receitas</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                  <div className="text-xs text-gray-400 mt-1">{transactions.filter(tx => tx.credit != null).length} entradas</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm text-gray-500 mb-1">Transações</div>
                  <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {transactions.filter(tx => tx.status === 'pending').length} pendentes
                  </div>
                </div>
              </div>

              {/* Owner Split */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">Rodrigo</span>
                    <span className="text-sm text-gray-500">Novo Banco</span>
                  </div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(rodrigoExpenses)}</div>
                  <div className="text-sm text-green-600 mt-1">
                    +{formatCurrency(transactions.filter(tx => tx.owner === 'Rodrigo' && tx.credit != null).reduce((s, tx) => s + (tx.credit ?? 0), 0))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">Mariana</span>
                    <span className="text-sm text-gray-500">Millennium</span>
                  </div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(marianaExpenses)}</div>
                  <div className="text-sm text-green-600 mt-1">
                    +{formatCurrency(transactions.filter(tx => tx.owner === 'Mariana' && tx.credit != null).reduce((s, tx) => s + (tx.credit ?? 0), 0))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Category Bar Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Despesas por Categoria</h3>
                  {sortedCategories.length === 0 ? (
                    <p className="text-gray-400 text-sm">Sem dados para este mês</p>
                  ) : (
                    <div className="space-y-3">
                      {sortedCategories.map(([cat, amount]) => (
                        <div key={cat}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{cat}</span>
                            <span className="text-gray-600">{formatCurrency(amount)}</span>
                          </div>
                          <div className="bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${(amount / maxCategoryAmount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Transações Recentes</h3>
                  <div className="space-y-2">
                    {recent.length === 0 ? (
                      <p className="text-gray-400 text-sm">Sem transações</p>
                    ) : (
                      recent.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 truncate" title={tx.description}>
                              {tx.description}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDate(tx.date)} · {tx.category || 'Sem categoria'}
                            </div>
                          </div>
                          <div className="ml-3 text-sm font-medium whitespace-nowrap">
                            {tx.debit != null ? (
                              <span className="text-red-600">-{formatCurrency(tx.debit)}</span>
                            ) : (
                              <span className="text-green-600">+{formatCurrency(tx.credit ?? 0)}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
