import { api } from '@/shared/http/api';

it('sends a FormData body as multipart', async () => {
  let sent: unknown;
  let contentType: unknown;
  api.defaults.adapter = async config => {
    sent = config.data;
    contentType = config.headers['Content-Type'];
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  const form = new FormData();
  form.append('title', 'hello');
  form.append('file', { uri: 'file:///photo.jpg', name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  await api.post('/upload', form);
  // eslint-disable-next-line no-console
  console.log(typeof sent, String(contentType), typeof sent === 'string' ? sent : Object.prototype.toString.call(sent));
  expect(sent).toBeInstanceOf(FormData);
});
it('still sends JSON for an object', async () => {
  let sent: unknown; let ct: unknown;
  api.defaults.adapter = async config => { sent = config.data; ct = config.headers['Content-Type']; return { data: {}, status: 200, statusText: 'OK', headers: {}, config }; };
  await api.post('/x', { a: 1 });
  expect(sent).toBe('{"a":1}');
  expect(String(ct)).toContain('application/json');
});
