import { dummyJsonAuthAdapter } from '@/features/demo-auth/dummyJsonAdapter';

test('normalizeUser accepts payloads AuthUser does not allow', () => {
  const odd = [
    { id: 1, email: 42 },
    { id: { nested: true }, email: 'a@b.c' },
    { id: 1, email: 'a@b.c', firstName: { x: 1 } },
    { id: 1, email: '   ' },
  ];
  const out = odd.map(raw => dummyJsonAuthAdapter.normalizeUser(raw));
  console.log(JSON.stringify(out));
  expect(out).toHaveLength(4);
});
