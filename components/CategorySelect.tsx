'use client';

import { CATEGORIES } from '@/lib/categories';

interface Props { value: string; onChange: (v: string) => void; className?: string; }

export default function CategorySelect({ value, onChange, className = '' }: Props) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={`h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground
        focus:outline-none focus:ring-1 focus:ring-ring
        [&>option]:bg-[#1a1a1f] ${className}`}
    >
      <option value="">— Categoria —</option>
      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}
