'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function ExportPage() {
  const currentMonth = getCurrentMonth();
  const [from, setFrom] = useState(currentMonth);
  const [to, setTo] = useState(currentMonth);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function fetchCount() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('month', from);
      const res = await fetch(`/api/transactions?${params}&pageSize=1`);
      const data = await res.json();
      setCount(data.total ?? 0);
    } catch {
      setCount(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCount();
  }, [from, to]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await fetch(`/api/export?${params}`);
      if (!res.ok) {
        const err = await res.json();
        alert('Erro: ' + (err.error || 'Erro desconhecido'));
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contascasa_${from}_${to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao exportar');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Exportar para Excel</h2>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  De (mês)
                </label>
                <input
                  type="month"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Até (mês)
                </label>
                <input
                  type="month"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {count !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  {loading ? 'A contar...' : (
                    <>
                      <span className="font-semibold">{count} transações</span> serão exportadas
                    </>
                  )}
                </p>
              </div>
            )}

            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Colunas exportadas</h4>
              <div className="flex flex-wrap gap-2">
                {['Data', 'Descrição', 'Débito', 'Crédito', 'Quem Pagou', 'Banco', 'Categoria', 'Subcategoria', 'Estado'].map(col => (
                  <span key={col} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading || count === 0}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {downloading ? 'A exportar...' : '📥 Descarregar Excel'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
