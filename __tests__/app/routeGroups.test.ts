import * as SplashScreen from 'expo-splash-screen';
import * as appGroup from '@/app/(app)/_layout';
import * as authGroup from '@/app/(auth)/_layout';
import * as tabsGroup from '@/app/(tabs)/_layout';
import { RouteErrorBoundary } from '@/shared/ui/ErrorBoundary';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

describe('the root and group layouts', () => {
  it.each([
    ['(app)', appGroup],
    ['(auth)', authGroup],
    ['(tabs)', tabsGroup],
  ])('%s has the route error boundary', (_group, layout) => {
    expect(layout.ErrorBoundary).toBe(RouteErrorBoundary);
  });

  it('keeps the native splash screen up from the moment the app loads', () => {
    jest.isolateModules(() => {
      // A fresh copy of the module, so its top level runs in this test.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/app/_layout');
    });
    expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalledTimes(1);
  });
});
