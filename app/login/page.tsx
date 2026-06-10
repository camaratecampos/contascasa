'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingDown, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error || 'Palavra-passe incorreta');
      }
    } catch {
      setError('Erro de ligação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground leading-none">Contas Casa</p>
            <p className="text-xs text-muted-foreground mt-0.5">Rodrigo · Mariana</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-7">
          <h1 className="text-lg font-semibold text-foreground mb-1">Bem-vindo</h1>
          <p className="text-sm text-muted-foreground mb-6">Introduza a palavra-passe para aceder</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="pwd">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="pwd"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 pr-10 text-sm
                    text-foreground placeholder:text-muted-foreground/40
                    focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold
                hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
