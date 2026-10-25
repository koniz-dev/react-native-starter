import { Platform } from 'react-native';

const mockInit = jest.fn();
const mockAvailable = jest.fn(() => true);
const mockListener = jest.fn();
jest.mock(
  'react-native-ssl-public-key-pinning',
  () => ({
    initializeSslPinning: (o: unknown) => mockInit(o),
    isSslPinningAvailable: () => mockAvailable(),
    addSslPinningErrorListener: (cb: unknown) => mockListener(cb),
  }),
  { virtual: true }
);
jest.mock('@/shared/config/env', () => {
  const actual = jest.requireActual('@/shared/config/env');
  return {
    ...actual,
    getConfig: () => ({
      ...actual.getConfig(),
      apiUrl: 'https://api.example.com/v1',
      authApiUrl: 'https://auth.example.com',
      appEnv: 'production',
    }),
  };
});

function deferred() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => jest.resetModules());
function load() {
  const { api } = require('@/shared/http/api');
  const { logger } = require('@/shared/lib/logger');
  const { holdRequests, ok } = require('@/testing/http');
  const { startSslPinning } = require('@/shared/http/sslPinning');
  return { api, logger, holdRequests, ok, startSslPinning };
}

it('pins both hosts and holds requests until pinning is on', async () => {
  const init = deferred();
  mockInit.mockReturnValue(init.promise);
  const { api, holdRequests, ok, startSslPinning } = load();
  const held = holdRequests(api);
  startSslPinning();
  expect(mockInit).toHaveBeenCalledWith({
    'api.example.com': { publicKeyHashes: expect.any(Array) },
    'auth.example.com': { publicKeyHashes: expect.any(Array) },
  });
  const request = api.get('/items');
  await new Promise(r => setTimeout(r, 10));
  expect(held).toHaveLength(0); // not sent yet
  let outcome = 'pending';
  request.then(
    () => (outcome = 'ok'),
    (e: unknown) =>
      (outcome = 'rejected: ' + String((e as Error)?.message ?? e))
  );
  init.resolve();
  for (let i = 0; i < 50 && held.length === 0 && outcome === 'pending'; i++)
    await new Promise(r => setTimeout(r, 10));
  expect(outcome).toBe('pending');
  expect(held).toHaveLength(1); // sent after pinning is on
  held[0].resolve(ok(held[0].config, ['item']));
  await expect(request).resolves.toMatchObject({ data: ['item'] });
});

it('fails requests closed when pinning fails to start', async () => {
  const { api, logger, holdRequests, startSslPinning } = load();
  jest.spyOn(logger, 'error').mockImplementation(() => {});
  jest.spyOn(logger, 'warn').mockImplementation(() => {});
  const init = deferred();
  mockInit.mockReturnValue(init.promise);
  const held = holdRequests(api);
  startSslPinning();
  init.reject(new Error('TrustKit: at least two pins'));
  await expect(api.get('/items')).rejects.toBeTruthy();
  expect(held).toHaveLength(0);
  expect(logger.error).toHaveBeenCalledWith(
    'Certificate pinning failed',
    expect.any(Error)
  );
});

it('does nothing on the web', () => {
  const os = Platform.OS;
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  mockInit.mockClear();
  const { startSslPinning } = load();
  startSslPinning();
  expect(mockInit).not.toHaveBeenCalled();
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
});
