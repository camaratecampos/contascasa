'use client';

import { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { CATEGORIES } from '@/lib/seed-rules';
import type { ClassificationRule } from '@/lib/schema';

export default function RulesPage() {
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  async function fetchRules() {
    setLoading(true);
    try {
      const res = await fetch('/api/rules');
      const data = await res.json();
      setRules(data.rules || []);
    } catch {
      setError('Erro ao carregar regras');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRules();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword || !category) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, category, subcategory }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao criar regra');
        return;
      }

      setKeyword('');
      setCategory('');
      setSubcategory('');
      fetchRules();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar esta regra?')) return;

    await fetch(`/api/rules?id=${id}`, { method: 'DELETE' });
    fetchRules();
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Base de dados inicializada! ${data.seeded} regras criadas, ${data.skipped} já existiam.`);
        fetchRules();
      } else {
        alert('Erro: ' + (data.error || 'Erro desconhecido'));
      }
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <NavBar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Regras de Classificação</h2>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {seeding ? 'A inicializar...' : '🌱 Inicializar BD'}
            </button>
          </div>

          {/* Add Rule Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Adicionar Nova Regra</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Palavra-chave</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value.toUpperCase())}
                  placeholder="Ex: PINGO DOCE"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sub-categoria</label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={e => setSubcategory(e.target.value)}
                  placeholder="Opcional"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'A adicionar...' : 'Adicionar'}
                </button>
              </div>
            </form>
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Rules List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-sm font-medium text-gray-600">{rules.length} regras</span>
            </div>
            {loading ? (
              <div className="py-8 text-center text-gray-400">A carregar...</div>
            ) : rules.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <p>Nenhuma regra encontrada.</p>
                <p className="text-sm mt-1">Clique em "Inicializar BD" para criar as regras predefinidas.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Palavra-chave</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase">Sub-categoria</th>
                    <th className="text-right py-2 px-4 text-xs font-medium text-gray-500 uppercase">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => (
                    <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-4 text-sm font-mono text-gray-900">{rule.keyword}</td>
                      <td className="py-2 px-4">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {rule.category}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-500">{rule.subcategory || '-'}</td>
                      <td className="py-2 px-4 text-right">
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Eliminar
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
