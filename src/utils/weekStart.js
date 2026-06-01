// src/utils/weekStart.js
// Cópia exata da lógica de getWeekStart() que hoje vive dentro de
// src/hooks/useWeeklyChallenge.js, extraída para ser testável isoladamente.
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
