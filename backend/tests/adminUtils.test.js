// Testes unitários dos utilitários do painel admin: não acessam o Supabase
jest.mock('../src/config/supabase', () => ({}));

const {
  toDayKey,
  lastNDays,
  countByDay,
  distinctUsersByDay,
  distinctUsersSince,
  markedDays,
  average,
} = require('../src/utils/metricsUtils');
const { parsePagination, sanitizeSearch } = require('../src/utils/adminQuery');

describe('metricsUtils', () => {
  it('toDayKey usa o fuso de São Paulo (UTC-3)', () => {
    // 02:00 UTC de 10/09 ainda é 09/09 em São Paulo
    expect(toDayKey('2026-09-10T02:00:00Z')).toBe('2026-09-09');
    expect(toDayKey('2026-09-10T03:00:00Z')).toBe('2026-09-10');
  });

  it('lastNDays devolve N dias em ordem crescente terminando hoje', () => {
    const now = new Date('2026-09-10T15:00:00Z');
    expect(lastNDays(3, now)).toEqual(['2026-09-08', '2026-09-09', '2026-09-10']);
  });

  it('countByDay preenche dias vazios com zero e ignora dias fora da série', () => {
    const days = ['2026-09-08', '2026-09-09', '2026-09-10'];
    const result = countByDay(days, [
      '2026-09-08T12:00:00Z',
      '2026-09-08T13:00:00Z',
      '2026-09-10T12:00:00Z',
      '2026-01-01T12:00:00Z',
    ]);
    expect(result).toEqual([
      { day: '2026-09-08', count: 2 },
      { day: '2026-09-09', count: 0 },
      { day: '2026-09-10', count: 1 },
    ]);
  });

  it('distinctUsersByDay conta cada usuário uma vez por dia', () => {
    const days = ['2026-09-08', '2026-09-09'];
    const result = distinctUsersByDay(days, [
      { user_id: 'a', at: '2026-09-08T12:00:00Z' },
      { user_id: 'a', at: '2026-09-08T18:00:00Z' },
      { user_id: 'b', at: '2026-09-08T12:00:00Z' },
      { user_id: 'a', at: '2026-09-09T12:00:00Z' },
    ]);
    expect(result).toEqual([
      { day: '2026-09-08', active_users: 2 },
      { day: '2026-09-09', active_users: 1 },
    ]);
  });

  it('distinctUsersSince considera só eventos a partir da data', () => {
    const events = [
      { user_id: 'a', at: '2026-09-01T12:00:00Z' },
      { user_id: 'b', at: '2026-09-09T12:00:00Z' },
      { user_id: 'b', at: '2026-09-10T12:00:00Z' },
    ];
    expect(distinctUsersSince(events, '2026-09-05T00:00:00Z')).toBe(1);
  });

  it('markedDays soma os dias marcados da semana', () => {
    expect(markedDays({ monday: true, tuesday: false, friday: true, sunday: true })).toBe(3);
    expect(markedDays({})).toBe(0);
  });

  it('average arredonda para 1 casa e trata lista vazia', () => {
    expect(average([1, 2, 2])).toBe(1.7);
    expect(average([])).toBe(0);
  });
});

describe('adminQuery', () => {
  it('parsePagination aplica padrão e limites', () => {
    expect(parsePagination({})).toEqual({ page: 1, pageSize: 20, from: 0, to: 19 });
    expect(parsePagination({ page: '3', pageSize: '10' })).toEqual({ page: 3, pageSize: 10, from: 20, to: 29 });
    expect(parsePagination({ page: '-1', pageSize: '5000' })).toEqual({ page: 1, pageSize: 100, from: 0, to: 99 });
    expect(parsePagination({ page: 'abc' }).page).toBe(1);
  });

  it('sanitizeSearch remove caracteres que alteram o filtro do PostgREST', () => {
    expect(sanitizeSearch('  sofia  ')).toBe('sofia');
    expect(sanitizeSearch('a,b),user_id.eq.(x')).toBe('a b  user_id.eq. x');
    expect(sanitizeSearch('100%*')).toBe('100');
    expect(sanitizeSearch(undefined)).toBe('');
    expect(sanitizeSearch('x'.repeat(300))).toHaveLength(100);
  });
});
