/**
 * Runs the analytics recipe in docs/plug-in-a-provider.md (taken from the
 * page itself): `useAnalyticsIdentity` with the PostHog adapter, against a
 * fake PostHog client.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Pressable, Text } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { analyticsSeam, type Analytics } from '@/shared/integrations/analytics';
import { useSession } from '@/shared/session/SessionProvider';
import { setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { renderWithProviders, secureStore } from '@/testing';
import { linkDependencies } from '@/testing/projectCopy';

const DOC = path.resolve(__dirname, '../../../docs/plug-in-a-provider.md');
const snippetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'analytics-'));
// The compiled modules need this repo's packages (Babel helpers).
linkDependencies(snippetDir);
afterAll(() => fs.rmSync(snippetDir, { recursive: true, force: true }));

/** Writes the snippet that starts with `first` (up to `end`) and loads it. */
function loadSnippet<T>(first: string, end = '\n```'): T {
  const doc = fs.readFileSync(DOC, 'utf8');
  const start = doc.indexOf(first);
  if (start < 0) throw new Error(`${DOC}: no "${first}" snippet`);
  const code = doc.slice(start, doc.indexOf(end, start));
  const file = path.join(snippetDir, `${path.basename(first)}`);
  fs.writeFileSync(file, code);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(file);
}

const { useAnalyticsIdentity } = loadSnippet<{
  useAnalyticsIdentity: () => void;
}>('// features/auth/hooks/useAnalyticsIdentity.ts');
// The adapter, without the registration below it (which needs a real client).
const { createPostHogAnalytics } = loadSnippet<{
  createPostHogAnalytics: (client: typeof posthog) => Analytics;
}>('// shared/integrations/adapters/posthog.ts', '// In configureIntegrations');

const posthog = {
  capture: jest.fn(),
  screen: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
};

function App() {
  useAnalyticsIdentity();
  const { session, signOut } = useSession();
  return (
    <Pressable onPress={() => void signOut()}>
      <Text>{session.status}</Text>
    </Pressable>
  );
}

beforeEach(() => analyticsSeam.set(createPostHogAnalytics(posthog)));
afterEach(() => analyticsSeam.reset());

it("keeps PostHog's anonymous id on a launch that starts signed out", async () => {
  renderWithProviders(<App />, { withSession: true });
  await screen.findByText('signedOut');
  // Let any effect of the change run.
  await new Promise(resolve => setTimeout(resolve, 0));

  expect(posthog.reset).not.toHaveBeenCalled();
  expect(posthog.identify).not.toHaveBeenCalled();
});

it('identifies a restored user, and resets once on sign-out', async () => {
  secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'token');
  await setItem(STORAGE_KEYS.USER_DATA, {
    id: 7,
    email: 'ada@example.com',
    name: 'Ada',
  });
  renderWithProviders(<App />, { withSession: true });

  await screen.findByText('signedIn');
  expect(posthog.identify).toHaveBeenCalledWith('7', undefined);

  fireEvent.press(screen.getByText('signedIn'));
  await screen.findByText('signedOut');
  await waitFor(() => expect(posthog.reset).toHaveBeenCalledTimes(1));
  // And only once: the signed-out state that follows doesn't reset again.
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(posthog.reset).toHaveBeenCalledTimes(1);
});
