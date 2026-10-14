import { api } from '@/shared/http/api';
import { ApiError } from '@/shared/http/apiError';
import { holdRequests, httpError, ok } from '@/testing';

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('holdRequests', () => {
  it('holds each request until the test answers it', async () => {
    const requests = holdRequests();

    const first = api.get('/notes');
    const second = api.get('/notes/1');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(requests.map(request => request.config.url)).toEqual([
      '/notes',
      '/notes/1',
    ]);

    requests[1]?.reject(
      httpError(requests[1].config, 404, { message: 'Gone' })
    );
    requests[0]?.resolve(ok(requests[0].config, ['a note']));

    await expect(first).resolves.toMatchObject({
      status: 200,
      data: ['a note'],
    });
    const error = await second.catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 'client',
      status: 404,
      message: 'Gone',
    });
  });

  it('answers a 5xx as a server error', async () => {
    const requests = holdRequests();
    const request = api.get('/notes');
    await new Promise(resolve => setTimeout(resolve, 0));
    requests[0]?.reject(httpError(requests[0].config, 503));
    await expect(request).rejects.toMatchObject({
      code: 'server',
      status: 503,
    });
  });
});
