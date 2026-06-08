const DAY_MAP = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

// Retorna "YYYY-MM-DD" da segunda-feira da semana atual (fuso America/Sao_Paulo, UTC-3)
exports.getWeekStart = () => {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );
  const day = now.getDay(); // 0=Dom, 1=Seg ...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10); // "YYYY-MM-DD"
};

// Retorna nome da coluna para o dia atual (ex.: "monday")
exports.getDayColumn = () => {
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  );
  return DAY_MAP[now.getDay()];
};
