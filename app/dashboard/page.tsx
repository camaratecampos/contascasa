'use client';

import { useState, useEffect, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import { categoryColor } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, Receipt } from 'lucide-react';

const MONTHS = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [String(CURRENT_YEAR - 1), String(CURRENT_YEAR), String(CURRENT_YEAR + 1)];

function fmt(v: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
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
  const now = new Date();
  const [year,  setYear]  = useState(String(now.getFullYear()));
  const [month, setMonth] = useState<string>(''); // '' = all months in year
  const [owner, setOwner] = useState('');
  const [bank,  setBank]  = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (month) {
        params.set('month', `${year}-${month}`);
      } else if (year !== 'all') {
        params.set('year', year);
      }
      if (owner) params.set('owner', owner);
      if (bank)  params.set('bank',  bank);
      const res = await fetch(`/api/stats?${params}`);
      setStats(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [year, month, owner, bank]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const expChange = stats && stats.prevExpenses > 0
    ? ((stats.totalExpenses - stats.prevExpenses) / stats.prevExpenses) * 100 : null;

  const topCat = stats?.categories[0];
  const maxCat = stats?.categories[0]?.total ?? 1;
  const rodrigo = stats?.byOwner['Rodrigo'];
  const mariana  = stats?.byOwner['Mariana'];

  const periodLabel = month
    ? `${MONTHS.find(m => m.value === month)?.label} ${year}`
    : year === 'all' ? 'Todo o período' : `Ano ${year}`;

  return (
    <div className="flex min-h-screen bg-background">
      <NavBar />
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        {/* Header + filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{periodLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={year} onChange={e => { setYear(e.target.value); setMonth(''); }}
              className="h-8 rounded-md border border-border bg-card text-sm px-2 text-foreground">
              <option value="all">Todo o período</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={month} onChange={e => setMonth(e.target.value)}
              disabled={year === 'all'}
              className="h-8 rounded-md border border-border bg-card text-sm px-2 text-foreground disabled:opacity-40">
              <option value="">Todos os meses</option>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={owner} onChange={e => setOwner(e.target.value)}
              className="h-8 rounded-md border border-border bg-card text-sm px-2 text-foreground">
              <option value="">Todos</option>
              <option value="Rodrigo">Rodrigo</option>
              <option value="Mariana">Mariana</option>
            </select>
            <select value={bank} onChange={e => setBank(e.target.value)}
              className="h-8 rounded-md border border-border bg-card text-sm px-2 text-foreground">
              <option value="">Todos os bancos</option>
              <option value="novobanco">Novo Banco</option>
              <option value="millennium">Millennium</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            A carregar...
          </div>
        ) : !stats ? null : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Despesas"
                value={fmt(stats.totalExpenses)}
                icon={<TrendingDown className="w-4 h-4 text-rose-400" />}
                sub={expChange !== null ? (
                  <span className={cn('flex items-center gap-0.5 text-xs font-medium',
                    expChange > 0 ? 'text-rose-400' : 'text-emerald-400')}>
                    {expChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(expChange).toFixed(1)}% vs período anterior
                  </span>
                ) : <span className="text-xs text-muted-foreground">sem comparação</span>}
                accent="rose"
              />
              <KpiCard
                label="Total Receitas"
                value={fmt(stats.totalIncome)}
                icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                sub={<span className="text-xs text-muted-foreground">&nbsp;</span>}
                accent="emerald"
              />
              <KpiCard
                label="Transações"
                value={String(stats.count)}
                icon={<Receipt className="w-4 h-4 text-violet-400" />}
                sub={<span className="text-xs text-muted-foreground">{stats.pendingCount} pendentes</span>}
                accent="violet"
              />
              <KpiCard
                label="Top Categoria"
                value={topCat?.category ?? '—'}
                icon={<Wallet className="w-4 h-4 text-amber-400" />}
                sub={topCat ? <span className="text-xs text-muted-foreground">{fmt(topCat.total)}</span> : null}
                accent="amber"
              />
            </div>

            {/* Category + Owner split */}
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Category bars — 2/3 width */}
              <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h2>
                {stats.categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados para este período</p>
                ) : (
                  <div className="space-y-3">
                    {stats.categories.map(({ category, total }) => (
                      <div key={category} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                            categoryColor(category)
                          )}>
                            {category}
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground font-medium">
                            {fmt(total)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/60 group-hover:bg-primary transition-colors"
                            style={{ width: `${Math.max(2, (total / maxCat) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Owner split — 1/3 */}
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-foreground">Por Pessoa</h2>
                <OwnerCard name="Rodrigo" bank="Novo Banco" data={rodrigo} color="cyan" />
                <OwnerCard name="Mariana" bank="Millennium" data={mariana} color="pink" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({
  label, value, icon, sub, accent,
}: {
  label: string; value: string; icon: React.ReactNode;
  sub: React.ReactNode; accent: 'rose' | 'emerald' | 'violet' | 'amber';
}) {
  const ring: Record<string, string> = {
    rose: 'bg-rose-500/10', emerald: 'bg-emerald-500/10',
    violet: 'bg-violet-500/10', amber: 'bg-amber-500/10',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', ring[accent])}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-foreground tabular-nums truncate">{value}</p>
      <div className="mt-1.5">{sub}</div>
    </div>
  );
}

function OwnerCard({
  name, bank, data, color,
}: {
  name: string; bank: string;
  data?: { expenses: number; income: number };
  color: 'cyan' | 'pink';
}) {
  const pill: Record<string, string> = {
    cyan: 'bg-cyan-500/15 text-cyan-300',
    pink: 'bg-pink-500/15 text-pink-300',
  };
  return (
    <div className="rounded-lg bg-white/[0.03] border border-border p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', pill[color])}>{name}</span>
        <span className="text-xs text-muted-foreground">{bank}</span>
      </div>
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Despesas</p>
          <p className="font-semibold text-rose-400 tabular-nums">
            {data ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(data.expenses) : '—'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-0.5">Receitas</p>
          <p className="font-semibold text-emerald-400 tabular-nums">
            {data ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(data.income) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
