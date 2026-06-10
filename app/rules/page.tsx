'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { CATEGORIES } from '@/lib/classifier';
import { categoryColor } from '@/lib/categories';
import type { ClassificationRule } from '@/lib/schema';
import { Trash2, Plus, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RulesPage() {
  const [rules,    setRules]    = useState<ClassificationRule[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [keyword,  setKeyword]  = useState('');
  const [category, setCategory] = useState('');
  const [subcat,   setSubcat]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [seeding,  setSeeding]  = useState(false);
  const [error,    setError]    = useState('');

  async function fetchRules() {
    setLoading(true);
    try {
      const d = await fetch('/api/rules').then(r => r.json());
      setRules(d.rules || []);
    } catch { setError('Erro ao carregar regras'); }
    finally  { setLoading(false); }
  }

  useEffect(() => { fetchRules(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword || !category) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/rules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, category, subcategory: subcat }),
      });
      if (!res.ok) { setError((await res.json()).error || 'Erro'); return; }
      setKeyword(''); setCategory(''); setSubcat('');
      fetchRules();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta regra?')) return;
    await fetch(`/api/rules?id=${id}`, { method: 'DELETE' });
    fetchRules();
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res  = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) { fetchRules(); }
      else alert('Erro: ' + (data.error || 'desconhecido'));
    } finally { setSeeding(false); }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <NavBar />
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Regras de Classificação</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{rules.length} regras configuradas</p>
            </div>
            <button onClick={handleSeed} disabled={seeding}
              className="h-8 px-3 rounded-md border border-border text-xs text-muted-foreground
                hover:text-foreground hover:bg-white/5 disabled:opacity-50 transition-colors flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              {seeding ? 'A inicializar…' : 'Inicializar BD'}
            </button>
          </div>

          {/* Add form */}
          <div className="rounded-xl border border-border bg-card p-5 mb-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Adicionar regra</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Palavra-chave
                </label>
                <input type="text" value={keyword}
                  onChange={e => setKeyword(e.target.value.toUpperCase())}
                  placeholder="EX: PINGO DOCE" required
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground uppercase
                    placeholder:normal-case placeholder:text-muted-foreground/40
                    focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Categoria
                </label>
                <select value={category} onChange={e => setCategory(e.target.value)} required
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground
                    focus:outline-none focus:ring-2 focus:ring-ring [&>option]:bg-[#1a1a1f]">
                  <option value="">— Seleccionar —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Sub-categoria
                </label>
                <input type="text" value={subcat} onChange={e => setSubcat(e.target.value)}
                  placeholder="Opcional"
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground
                    placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button type="submit" disabled={saving}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold
                  hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                <Plus className="w-3.5 h-3.5" />
                {saving ? '…' : 'Adicionar'}
              </button>
            </form>
            {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
          </div>

          {/* Rules table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">A carregar…</div>
            ) : rules.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma regra. Clique em "Inicializar BD" para criar as predefinidas.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Palavra-chave', 'Categoria', 'Sub-categoria', ''].map(h => (
                      <th key={h} className="py-2.5 px-4 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => (
                    <tr key={rule.id} className="border-b border-border hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 font-mono text-xs text-foreground">{rule.keyword}</td>
                      <td className="py-2.5 px-4">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          categoryColor(rule.category)
                        )}>
                          {rule.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground">{rule.subcategory || '—'}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button onClick={() => handleDelete(rule.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
