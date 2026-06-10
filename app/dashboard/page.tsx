'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import MonthPicker from '@/components/MonthPicker';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
}

interface Stats {
  totalExpenses: number;
  totalIncome: number;
  count: number;
  pendingCount: number;
  prevExpenses: number;
  categories: { category: string; total: number }[];
  byOwner: Record<string, { expenses: number; income: number }>;
}

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month });
      if (ownerFilter) params.set('owner', ownerFilter);
      if (bankFilter) params.set('bank', bankFilter);

      const res = await fetch(`/api/stats?${params}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, ownerFilter, bankFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const expenseChange = stats && stats.prevExpenses > 0
    ? ((stats.totalExpenses - stats.prevExpenses) / stats.prevExpenses) * 100
    : 0;

  const maxCategoryAmount = stats?.categories[0]?.total ?? 1;
  const rodrigo = stats?.byOwner['Rodrigo'];
  const mariana = stats?.byOwner['Mariana'];

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

          {loading || !stats ? (
            <div className="text-center py-12 text-gray-500">A carregar...</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm text-gray-500 mb-1">Total Despesas</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</div>
                  {stats.prevExpenses > 0 && (
                    <div className={`text-xs mt-1 ${expenseChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {expenseChange > 0 ? '▲' : '▼'} {Math.abs(expenseChange).toFixed(1)}% vs mês anterior
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm text-gray-500 mb-1">Total Receitas</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-sm text-gray-500 mb-1">Transações</div>
                  <div className="text-2xl font-bold text-gray-900">{stats.count}</div>
                  <div className="text-xs text-gray-400 mt-1">{stats.pendingCount} pendentes</div>
                </div>
              </div>

              {/* Owner Split */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">Rodrigo</span>
                    <span className="text-sm text-gray-500">Novo Banco</span>
                  </div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(rodrigo?.expenses ?? 0)}</div>
                  <div className="text-sm text-green-600 mt-1">+{formatCurrency(rodrigo?.income ?? 0)}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">Mariana</span>
                    <span className="text-sm text-gray-500">Millennium</span>
                  </div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(mariana?.expenses ?? 0)}</div>
                  <div className="text-sm text-green-600 mt-1">+{formatCurrency(mariana?.income ?? 0)}</div>
                </div>
              </div>

              {/* Category Bar Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Despesas por Categoria</h3>
                {stats.categories.length === 0 ? (
                  <p className="text-gray-400 text-sm">Sem dados para este mês</p>
                ) : (
                  <div className="space-y-3">
                    {stats.categories.map(({ category, total }) => (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 font-medium">{category}</span>
                          <span className="text-gray-600">{formatCurrency(total)}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(total / maxCategoryAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
