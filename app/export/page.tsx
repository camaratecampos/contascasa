'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { Download, TableProperties } from 'lucide-react';

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const COLUMNS = ['Data', 'Descrição', 'Débito', 'Crédito', 'Quem Pagou', 'Banco', 'Categoria', 'Subcategoria', 'Estado'];

export default function ExportPage() {
  const cur = getCurrentMonth();
  const [from,        setFrom]        = useState(cur);
  const [to,          setTo]          = useState(cur);
  const [count,       setCount]       = useState<number | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('month', from);
    fetch(`/api/transactions?${params}&pageSize=1`)
      .then(r => r.json())
      .then(d => setCount(d.total ?? 0))
      .catch(() => setCount(null))
      .finally(() => setLoading(false));
  }, [from, to]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to)   params.set('to',   to);
      const res = await fetch(`/api/export?${params}`);
      if (!res.ok) { alert('Erro ao exportar'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `contascasa_${from}_${to}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } finally { setDownloading(false); }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <NavBar />
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        <div className="max-w-xl mx-auto">
          <h1 className="text-xl font-semibold text-foreground mb-1">Exportar para Excel</h1>
          <p className="text-sm text-muted-foreground mb-6">Descarregue as transações num ficheiro .xlsx</p>

          <div className="rounded-xl border border-border bg-card p-6 space-y-5">
            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'De (mês)', value: from, set: setFrom },
                { label: 'Até (mês)', value: to,  set: setTo  },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
                  <input type="month" value={value} onChange={e => set(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground
                      focus:outline-none focus:ring-2 focus:ring-ring [color-scheme:dark]" />
                </div>
              ))}
            </div>

            {/* Count */}
            <div className={`rounded-lg px-4 py-3 text-sm border ${
              count === 0
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-violet-500/10 border-violet-500/20 text-violet-300'
            }`}>
              {loading ? 'A contar…' : count === null ? '—' : (
                <><span className="font-semibold">{count} transações</span> serão exportadas</>
              )}
            </div>

            {/* Column preview */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <TableProperties className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Colunas exportadas</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COLUMNS.map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-md bg-secondary text-xs text-muted-foreground border border-border">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <button onClick={handleDownload} disabled={downloading || count === 0}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold
                hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              {downloading ? 'A exportar…' : 'Descarregar Excel'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
