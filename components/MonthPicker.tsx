'use client';

interface MonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
}

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function addMonths(ym: string, delta: number): string {
  const [year, month] = ym.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function MonthPicker({ value, onChange }: MonthPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(addMonths(value, -1))}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        aria-label="Mês anterior"
      >
        ◀
      </button>
      <span className="text-base font-semibold text-gray-800 min-w-[160px] text-center">
        {formatMonthLabel(value)}
      </span>
      <button
        onClick={() => onChange(addMonths(value, 1))}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        aria-label="Próximo mês"
      >
        ▶
      </button>
    </div>
  );
}
