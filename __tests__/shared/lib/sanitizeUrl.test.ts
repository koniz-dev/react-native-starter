import { sanitizeUrl } from '@/shared/lib/sanitizeUrl';

it.each([
  [
    'https://user:password@host.example/path?token=x#fragment',
    'https://host.example/path',
  ],
  ['https://u%40name:p%40ss@host.example/path', 'https://host.example/path'],
  ['HTTPS://user:password@[::1]:8443/path', 'HTTPS://[::1]:8443/path'],
  ['https://user@host.example/path', 'https://host.example/path'],
  ['//user:password@host.example/path', '//host.example/path'],
  ['/users/name@example.com?token=x', '/users/name@example.com'],
  [
    'https://host.example/users/name@example.com',
    'https://host.example/users/name@example.com',
  ],
  ['', ''],
])('sanitizes %s for logs', (url, expected) => {
  expect(sanitizeUrl(url)).toBe(expected);
});
