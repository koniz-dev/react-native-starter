/**
 * Repro: a refresh in flight when the user signs out. The service discards
 * the new access token (generation check), but the documented adapter has
 * already stored the rotated refresh token, so a valid refresh token stays in
 * the Keychain/Keystore after sign-out, and the server never revokes it.
 */
import { type AxiosAdapter, AxiosError, AxiosHeaders } from 'axios';
import { authClients, authService, setAuthAdapter } from '@/shared/session/authService';
import { myBackendAuthAdapter } from '@/features/auth/myBackendAdapter';
import { secureStore } from '@/testing';

let releaseRefresh: () => void = () => {};
const validAccess = new Set<string>();
const validRefresh = new Set<string>();
const adapter: AxiosAdapter = async config => {
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  const bearer = (config.headers.Authorization as string | undefined)?.replace(/^Bearer /, '');
  const key = `${(config.method ?? 'get').toUpperCase()} ${config.url}`;
  const ok = (data: unknown, status = 200) => ({ data: data === null ? null : { data }, status, statusText: '', headers: {}, config });
  const unauthorized = () => {
    throw new AxiosError('401', 'ERR_BAD_REQUEST', config, null, { data: {}, status: 401, statusText: '', headers: new AxiosHeaders(), config });
  };
  if (key === 'POST /sessions') { validAccess.add('access-1'); validRefresh.add('refresh-1'); return ok({ access_token: 'access-1', refresh_token: 'refresh-1' }, 201); }
  if (key === 'GET /me') return bearer && validAccess.has(bearer) ? ok({ uuid: 'u', email: 'a@b.c' }) : unauthorized();
  if (key === 'POST /sessions/refresh') {
    if (!validRefresh.delete(body?.refresh_token)) return unauthorized();
    validAccess.add('access-2'); validRefresh.add('refresh-2');
    await new Promise<void>(resolve => { releaseRefresh = resolve; }); // slow network
    return ok({ access_token: 'access-2', refresh_token: 'refresh-2' });
  }
  if (key === 'DELETE /sessions') { validRefresh.delete(body?.refresh_token); return ok(null, 204); }
  throw new Error(key);
};

beforeEach(() => {
  authClients.public.defaults.adapter = adapter;
  authClients.authenticated.defaults.adapter = adapter;
  setAuthAdapter(myBackendAuthAdapter);
});

it('leaves no refresh token behind when a refresh finishes after sign-out', async () => {
  await authService.login({ username: 'a@b.c', password: 'x' });
  validAccess.clear();
  const profile = authService.fetchProfile().catch(() => null); // 401 -> refresh starts
  await new Promise(resolve => setTimeout(resolve, 50));
  await authService.logout(); // user signs out meanwhile
  releaseRefresh();
  await profile;
  expect(secureStore.has('auth_token')).toBe(false); // discarded: fine
  expect(secureStore.get('refresh_token')).toBeUndefined(); // FAILS: 'refresh-2' stored
  expect(validRefresh.size).toBe(0); // FAILS: refresh-2 valid on the server
});
