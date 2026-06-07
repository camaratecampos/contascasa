'use client';

import { useState } from 'react';
import type { NewTransaction } from '@/lib/schema';

interface ImportPreviewProps {
  transactions: NewTransaction[];
  filtered: number;
  duplicates: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
}

export default function ImportPreview({ transactions, filtered, duplicates, onConfirm, onCancel }: ImportPreviewProps) {
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-blue-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Pré-visualização da Importação</h3>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{transactions.length}</div>
            <div className="text-sm text-gray-600">Transações novas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{filtered}</div>
            <div className="text-sm text-gray-600">Filtradas (ruído)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{duplicates}</div>
            <div className="text-sm text-gray-600">Duplicadas</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Data</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Descrição</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Banco</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Quem</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Valor</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Categoria</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 100).map((tx, idx) => (
              <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-1.5 px-3 text-gray-600 whitespace-nowrap">{tx.date}</td>
                <td className="py-1.5 px-3 text-gray-900 max-w-xs">
                  <div className="truncate" title={tx.description}>{tx.description}</div>
                </td>
                <td className="py-1.5 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    tx.bank === 'novobanco' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {tx.bank === 'novobanco' ? 'NB' : 'BCP'}
                  </span>
                </td>
                <td className="py-1.5 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    tx.owner === 'Rodrigo' ? 'bg-cyan-100 text-cyan-700' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {tx.owner}
                  </span>
                </td>
                <td className="py-1.5 px-3 text-right font-medium">
                  {tx.debit != null ? (
                    <span className="text-red-600">-{formatCurrency(tx.debit)}</span>
                  ) : tx.credit != null ? (
                    <span className="text-green-600">+{formatCurrency(tx.credit)}</span>
                  ) : '-'}
                </td>
                <td className="py-1.5 px-3 text-gray-500">{tx.category || '-'}</td>
              </tr>
            ))}
            {transactions.length > 100 && (
              <tr>
                <td colSpan={6} className="py-2 px-3 text-center text-gray-500 text-sm">
                  ... e mais {transactions.length - 100} transações
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={confirming || transactions.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {confirming ? 'A importar...' : `Importar ${transactions.length} transações`}
        </button>
      </div>
    </div>
  );
}
