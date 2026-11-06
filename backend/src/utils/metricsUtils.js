// Utilitários puros (sem Supabase) para agregar métricas do painel admin.
// Todos os "dias" são calculados no fuso America/Sao_Paulo, o mesmo do app.

const TIME_ZONE = 'America/Sao_Paulo';
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Converte uma data/timestamp para "YYYY-MM-DD" no fuso de São Paulo.
 * @param {string|number|Date} value
 * @returns {string}
 */
exports.toDayKey = (value) => dayFormatter.format(new Date(value));

/**
 * Lista os últimos N dias (incluindo hoje) como "YYYY-MM-DD", do mais antigo ao mais recente.
 * @param {number} days
 * @param {Date} [now]
 * @returns {string[]}
 */
exports.lastNDays = (days, now = new Date()) => {
  const keys = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(exports.toDayKey(now.getTime() - i * DAY_MS));
  }
  return keys;
};

/**
 * Timestamp ISO de N dias atrás.
 * @param {number} days
 * @param {Date} [now]
 * @returns {string}
 */
exports.daysAgoIso = (days, now = new Date()) =>
  new Date(now.getTime() - days * DAY_MS).toISOString();

/**
 * Conta itens por dia, preenchendo com zero os dias sem registro.
 * @param {string[]} dayKeys - Dias da série (de lastNDays)
 * @param {Array<string|Date>} timestamps
 * @returns {Array<{ day: string, count: number }>}
 */
exports.countByDay = (dayKeys, timestamps) => {
  const counts = new Map(dayKeys.map((d) => [d, 0]));
  for (const ts of timestamps) {
    const key = exports.toDayKey(ts);
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  }
  return dayKeys.map((day) => ({ day, count: counts.get(day) }));
};

/**
 * Conta usuários distintos por dia, preenchendo com zero os dias sem atividade.
 * @param {string[]} dayKeys
 * @param {Array<{ user_id: string, at: string }>} events
 * @returns {Array<{ day: string, active_users: number }>}
 */
exports.distinctUsersByDay = (dayKeys, events) => {
  const sets = new Map(dayKeys.map((d) => [d, new Set()]));
  for (const { user_id: userId, at } of events) {
    const set = sets.get(exports.toDayKey(at));
    if (set) set.add(userId);
  }
  return dayKeys.map((day) => ({ day, active_users: sets.get(day).size }));
};

/**
 * Conta usuários distintos com evento a partir de uma data.
 * @param {Array<{ user_id: string, at: string }>} events
 * @param {string} sinceIso
 * @returns {number}
 */
exports.distinctUsersSince = (events, sinceIso) => {
  const since = new Date(sinceIso).getTime();
  const users = new Set();
  for (const { user_id: userId, at } of events) {
    if (new Date(at).getTime() >= since) users.add(userId);
  }
  return users.size;
};

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Quantos dias da semana foram marcados em uma linha de user_challenge_progress.
 * @param {object} row
 * @returns {number}
 */
exports.markedDays = (row) => WEEK_DAYS.reduce((sum, day) => sum + (row[day] ? 1 : 0), 0);

exports.WEEK_DAYS = WEEK_DAYS;

/**
 * Média arredondada para 1 casa decimal (0 para lista vazia).
 * @param {number[]} values
 * @returns {number}
 */
exports.average = (values) =>
  values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
