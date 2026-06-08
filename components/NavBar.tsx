'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/import', label: 'Importar', icon: '📥' },
  { href: '/review', label: 'Rever', icon: '✏️' },
  { href: '/export', label: 'Exportar', icon: '📤' },
  { href: '/rules', label: 'Regras', icon: '📋' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="w-56 min-h-screen flex flex-col" style={{ background: '#0f2035' }}>
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">Contas Casa</h1>
        <p className="text-xs text-blue-300 mt-1">Rodrigo + Mariana</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
