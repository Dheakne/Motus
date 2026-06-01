import { DAY_COLUMNS } from '../src/utils/dayColumns';

describe('DAY_COLUMNS', () => {
  test('possui exatamente 7 dias', () => {
    expect(DAY_COLUMNS).toHaveLength(7);
  });
  test('índice 0 (domingo) mapeia para sunday', () => {
    expect(DAY_COLUMNS[0]).toBe('sunday');
  });
  test('índice 1 (segunda) mapeia para monday', () => {
    expect(DAY_COLUMNS[1]).toBe('monday');
  });
  test('índice 6 (sábado) mapeia para saturday', () => {
    expect(DAY_COLUMNS[6]).toBe('saturday');
  });
  test('a ordem completa corresponde à semana iniciada no domingo', () => {
    expect(DAY_COLUMNS).toEqual(['sunday','monday','tuesday','wednesday','thursday','friday','saturday']);
  });
  test('não há colunas duplicadas', () => {
    expect(new Set(DAY_COLUMNS).size).toBe(DAY_COLUMNS.length);
  });
});
