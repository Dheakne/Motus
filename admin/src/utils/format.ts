const numberFmt = new Intl.NumberFormat('pt-BR');
const percentFmt = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
const decimalFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short' });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'short',
});

export const formatNumber = (n: number | null | undefined) => (n == null ? '—' : numberFmt.format(n));
export const formatPercent = (n: number | null | undefined) => (n == null ? '—' : percentFmt.format(n));
export const formatDecimal = (n: number | null | undefined) => (n == null ? '—' : decimalFmt.format(n));
export const formatDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const formatDateTime = (iso: string | null | undefined) =>
  iso ? dateTimeFmt.format(new Date(iso)) : '—';

/** "2026-09-03" → "03/09" (dias já vêm no fuso de São Paulo do backend). */
export const formatDayShort = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/** "2026-09-03" → "03/09/2026". */
export const formatDayLong = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;

// Valores de sessions.category (CHECK no banco) → nome exibido no app
export const SESSION_CATEGORIES: Record<string, string> = {
  gratidao: 'Gratidão',
  atencao: 'Atenção Concentrada',
  meditacao: 'Meditação',
  reflexao: 'Reflexão',
  descanso: 'Descanso',
};

export const categoryLabel = (value: string | null | undefined) =>
  (value && SESSION_CATEGORIES[value]) || value || '—';
