describe('recoveryDetect', () => {
  const originalWindow = global.window;
  afterEach(() => {
    global.window = originalWindow;
    jest.resetModules();
  });
  test('seta a flag quando o hash contém type=recovery', () => {
    global.window = { location: { hash: '#access_token=abc&type=recovery' } };
    jest.isolateModules(() => { require('../src/utils/recoveryDetect'); });
    expect(global.window.__motusIsRecovery).toBe(true);
  });
  test('NÃO seta a flag quando o hash não tem type=recovery', () => {
    global.window = { location: { hash: '#access_token=abc&type=signup' } };
    jest.isolateModules(() => { require('../src/utils/recoveryDetect'); });
    expect(global.window.__motusIsRecovery).toBeUndefined();
  });
  test('NÃO quebra quando o hash está vazio', () => {
    global.window = { location: { hash: '' } };
    expect(() => {
      jest.isolateModules(() => { require('../src/utils/recoveryDetect'); });
    }).not.toThrow();
    expect(global.window.__motusIsRecovery).toBeUndefined();
  });
});
