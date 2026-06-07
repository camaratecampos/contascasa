'use client';

import { CATEGORIES } from '@/lib/seed-rules';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function CategorySelect({ value, onChange, className = '' }: CategorySelectProps) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={`border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="">-- Categoria --</option>
      {CATEGORIES.map(cat => (
        <option key={cat} value={cat}>{cat}</option>
      ))}
    </select>
  );
}
