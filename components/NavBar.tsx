'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  ListChecks,
  Download,
  BookOpen,
  LogOut,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/import',    label: 'Importar',   icon: Upload },
  { href: '/review',    label: 'Rever',      icon: ListChecks },
  { href: '/export',    label: 'Exportar',   icon: Download },
  { href: '/rules',     label: 'Regras',     icon: BookOpen },
];

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [monthTotal, setMonthTotal] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/stats?month=${getCurrentMonth()}`)
      .then(r => r.json())
      .then(d => setMonthTotal(d.totalExpenses ?? null))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const monthLabel = new Date().toLocaleString('pt-PT', { month: 'long', year: 'numeric' });

  return (
    <aside className="w-60 min-h-screen flex flex-col bg-[hsl(var(--sidebar))] border-r border-border shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))] leading-none">Contas Casa</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Rodrigo · Mariana</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-[hsl(var(--sidebar-foreground))] hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Month total */}
      <div className="px-4 pb-3">
        <div className="rounded-lg bg-white/5 border border-border px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{monthLabel}</p>
          <p className="text-base font-semibold text-rose-400">
            {monthTotal !== null ? fmt(monthTotal) : '—'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">total despesas</p>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-[hsl(var(--sidebar-foreground))] hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
