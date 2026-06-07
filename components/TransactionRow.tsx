'use client';

import { useState } from 'react';
import CategorySelect from './CategorySelect';
import type { Transaction } from '@/lib/schema';

interface TransactionRowProps {
  transaction: Transaction;
  onUpdate: (id: string, updates: Partial<Transaction>) => Promise<void>;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function TransactionRow({ transaction, onUpdate }: TransactionRowProps) {
  const [category, setCategory] = useState(transaction.category || '');
  const [subcategory, setSubcategory] = useState(transaction.subcategory || '');
  const [saving, setSaving] = useState(false);

  async function handleCategoryChange(newCategory: string) {
    setCategory(newCategory);
    setSaving(true);
    await onUpdate(transaction.id, { category: newCategory || null });
    setSaving(false);
  }

  async function handleSubcategoryBlur() {
    setSaving(true);
    await onUpdate(transaction.id, { subcategory: subcategory || null });
    setSaving(false);
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-2 px-3 text-sm text-gray-600 whitespace-nowrap">
        {formatDate(transaction.date)}
      </td>
      <td className="py-2 px-3 text-sm text-gray-900 max-w-xs">
        <div className="truncate" title={transaction.description}>
          {transaction.description}
        </div>
      </td>
      <td className="py-2 px-3 text-sm">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          transaction.bank === 'novobanco'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-purple-100 text-purple-700'
        }`}>
          {transaction.bank === 'novobanco' ? 'NB' : 'BCP'}
        </span>
      </td>
      <td className="py-2 px-3 text-sm">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          transaction.owner === 'Rodrigo'
            ? 'bg-cyan-100 text-cyan-700'
            : 'bg-pink-100 text-pink-700'
        }`}>
          {transaction.owner}
        </span>
      </td>
      <td className="py-2 px-3 text-sm text-right font-medium">
        {transaction.debit != null ? (
          <span className="text-red-600">-{formatCurrency(transaction.debit)}</span>
        ) : transaction.credit != null ? (
          <span className="text-green-600">+{formatCurrency(transaction.credit)}</span>
        ) : '-'}
      </td>
      <td className="py-2 px-3">
        <CategorySelect value={category} onChange={handleCategoryChange} className="w-full" />
      </td>
      <td className="py-2 px-3">
        <input
          type="text"
          value={subcategory}
          onChange={e => setSubcategory(e.target.value)}
          onBlur={handleSubcategoryBlur}
          placeholder="Sub-categoria"
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </td>
      <td className="py-2 px-3">
        {saving ? (
          <span className="text-xs text-gray-400">A guardar...</span>
        ) : (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            transaction.status === 'confirmed'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {transaction.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
          </span>
        )}
      </td>
    </tr>
  );
}
