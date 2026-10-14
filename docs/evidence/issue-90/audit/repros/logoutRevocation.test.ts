/**
 * Repro: the documented adapter's logout revokes the refresh token through
 * the `authenticated` client. With an expired access token (the usual case
 * after the app sat in the background), DELETE /sessions gets a 401; the
 * HTTP client then tries `refresh`, which finds the refresh token already
 * cleared, so the revocation request is never retried and the refresh
 * token stays valid on the server.
 */
import { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios';
import { authClients, authService, setAuthAdapter } from '@/shared/session/authService';
import { myBackendAuthAdapter } from '@/features/auth/myBackendAdapter';
import { secureStore } from '@/testing';

const validAccess = new Set<string>();
const validRefresh = new Set<string>();
const log: string[] = [];
const adapter: AxiosAdapter = async config => {
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  const bearer = (config.headers.Authorization as string | undefined)?.replace(/^Bearer /, '');
  const key = `${(config.method ?? 'get').toUpperCase()} ${config.url}`;
  log.push(`${key} bearer=${bearer ?? '-'}`);
  const ok = (data: unknown, status = 200) => ({ data: data === null ? null : { data }, status, statusText: '', headers: {}, config });
  const unauthorized = () => {
    throw new AxiosError('401', 'ERR_BAD_REQUEST', config, null, {
      data: { error: { message: 'Token expired' } }, status: 401, statusText: '', headers: new AxiosHeaders(), config,
    });
  };
  if (key === 'POST /sessions') {
    validAccess.add('access-1'); validRefresh.add('refresh-1');
    return ok({ access_token: 'access-1', refresh_token: 'refresh-1' }, 201);
  }
  if (key === 'GET /me') return bearer && validAccess.has(bearer) ? ok({ uuid: 'u', email: 'a@b.c' }) : unauthorized();
  if (key === 'POST /sessions/refresh') {
    if (!validRefresh.delete(body?.refresh_token)) return unauthorized();
    validAccess.add('access-2'); validRefresh.add('refresh-2');
    return ok({ access_token: 'access-2', refresh_token: 'refresh-2' });
  }
  if (key === 'DELETE /sessions') {
    // A real authenticated endpoint checks the access token first.
    if (!bearer || !validAccess.has(bearer)) return unauthorized();
    validRefresh.delete(body?.refresh_token);
    return ok(null, 204);
  }
  throw new Error(key);
};

beforeEach(() => {
  authClients.public.defaults.adapter = adapter;
  authClients.authenticated.defaults.adapter = adapter;
  setAuthAdapter(myBackendAuthAdapter);
});

it('revokes the refresh token on logout when the access token has expired', async () => {
  await authService.login({ username: 'a@b.c', password: 'x' });
  validAccess.clear(); // the access token expires
  await authService.logout();
  // eslint-disable-next-line no-console
  console.log(log.join('\n'));
  expect(secureStore.size).toBe(0); // signed out locally: fine
  expect(validRefresh.has('refresh-1')).toBe(false); // FAILS: still valid on the server
});
