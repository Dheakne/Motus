import { formatTime, progressPercentage, remainingTime } from '../src/utils/audioFormat';

describe('audioFormat', () => {
  describe('formatTime', () => {
    test('tempo zero retorna "0:00"', () => {
      expect(formatTime(0)).toBe('0:00');
    });
    test('60000ms (1 minuto) retorna "1:00"', () => {
      expect(formatTime(60000)).toBe('1:00');
    });
    test('formatação M:SS com zero à esquerda para segundos < 10', () => {
      expect(formatTime(65000)).toBe('1:05');
    });
    test('formatação M:SS com zero à esquerda para segundos = 9', () => {
      expect(formatTime(9000)).toBe('0:09');
    });
    test('valor negativo tratado como zero', () => {
      expect(formatTime(-1000)).toBe('0:00');
    });
    test('173000ms (2:53) retorna corretamente', () => {
      expect(formatTime(173000)).toBe('2:53');
    });
    test('múltiplos minutos com segundos variados', () => {
      expect(formatTime(125000)).toBe('2:05');
    });
  });

  describe('progressPercentage', () => {
    test('progresso 0% quando currentTime é 0', () => {
      expect(progressPercentage(0, 100000)).toBe(0);
    });
    test('progresso 50% quando currentTime é metade da duração', () => {
      expect(progressPercentage(50000, 100000)).toBe(50);
    });
    test('progresso 100% quando currentTime iguala duração', () => {
      expect(progressPercentage(100000, 100000)).toBe(100);
    });
    test('progresso 100% (capped) quando currentTime > duração', () => {
      expect(progressPercentage(150000, 100000)).toBe(100);
    });
    test('progresso 0% quando duração é zero (divisão por zero)', () => {
      expect(progressPercentage(50, 0)).toBe(0);
    });
    test('progresso 25% em ponto intermediário', () => {
      expect(progressPercentage(25000, 100000)).toBe(25);
    });
  });

  describe('remainingTime', () => {
    test('tempo restante zero quando duração iguala currentTime', () => {
      expect(remainingTime(100000, 100000)).toBe(0);
    });
    test('tempo restante 50000 quando metade foi consumida', () => {
      expect(remainingTime(100000, 50000)).toBe(50000);
    });
    test('tempo restante nunca negativo quando currentTime > duração', () => {
      expect(remainingTime(100000, 150000)).toBe(0);
    });
    test('tempo restante total quando currentTime é zero', () => {
      expect(remainingTime(100000, 0)).toBe(100000);
    });
    test('tempo restante 10000ms (10 segundos)', () => {
      expect(remainingTime(60000, 50000)).toBe(10000);
    });
  });
});
