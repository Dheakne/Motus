import { getWeekStart } from '../src/utils/weekStart';

describe('getWeekStart', () => {
  test('quarta-feira retorna a segunda-feira da mesma semana', () => {
    expect(getWeekStart(new Date(2026, 4, 27))).toBe('2026-05-25');
  });
  test('segunda-feira retorna ela mesma', () => {
    expect(getWeekStart(new Date(2026, 4, 25))).toBe('2026-05-25');
  });
  test('domingo retorna a segunda-feira anterior (não a próxima)', () => {
    expect(getWeekStart(new Date(2026, 4, 31))).toBe('2026-05-25');
  });
  test('vira o mês corretamente', () => {
    expect(getWeekStart(new Date(2026, 5, 2))).toBe('2026-06-01');
  });
  test('vira o ano corretamente', () => {
    expect(getWeekStart(new Date(2027, 0, 1))).toBe('2026-12-28');
  });
  test('formato sempre YYYY-MM-DD com zero à esquerda', () => {
    const result = getWeekStart(new Date(2026, 2, 4));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).toBe('2026-03-02');
  });
});
