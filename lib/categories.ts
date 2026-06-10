// Client-safe category constants — no server-only imports here.
export const CATEGORIES = [
  'Casa',
  'Saúde',
  'Supermercado',
  'Restaurantes',
  'Carro',
  'Escola',
  'Miúdos',
  'Viagens',
  'Vestuário',
  'Outros',
  'Ordenados',
] as const;

export type Category = typeof CATEGORIES[number];

// Shared category color map — used across dashboard, review, import, rules.
export const CATEGORY_COLORS: Record<string, string> = {
  'Casa':          'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Saúde':         'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Supermercado':  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Restaurantes':  'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'Carro':         'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Escola':        'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Miúdos':        'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Viagens':       'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Vestuário':     'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Ordenados':     'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Outros':        'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
};

export function categoryColor(category: string | null | undefined): string {
  if (!category) return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  return CATEGORY_COLORS[category] ?? 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
}
