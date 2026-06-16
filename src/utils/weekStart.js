/**
 * Retorna a segunda-feira da semana de referência no formato YYYY-MM-DD.
 * Extraída de useWeeklyChallenge para ser testável isoladamente.
 */
export function getWeekStart(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  const dow = today.getDay();
  const daysBack = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysBack);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
