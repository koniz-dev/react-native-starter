import { renderRouter, screen } from 'expo-router/testing-library';

// An iOS build that isn't Expo Go has expo-router's native ExpoHead module,
// whose Head throws without a hosted origin (#101). Every screen must still
// render.
jest.mock('expo-router/build/head/ExpoHeadModule', () => ({
  ExpoHead: {
    activities: { INDEXED_ROUTE: 'index_route' },
    getActivities: () => [],
    createActivity: jest.fn(),
    clearActivitiesAsync: jest.fn(),
    revokeActivity: jest.fn(),
    suspendActivity: jest.fn(),
  },
}));

describe('screens in an iOS native build', () => {
  it.each([
    ['/', 'Session'],
    ['/login', 'Welcome Back'],
    ['/no-such-page', 'Page not found'],
    // @demo remove-block-start
    ['/explore', 'API Example'],
    ['/showcase', 'Buttons'],
    // @demo remove-block-end
  ])('%s renders', async (initialUrl, text) => {
    await renderRouter('./app', { initialUrl });
    expect(await screen.findByText(text)).toBeTruthy();
    expect(screen.queryByTestId('error-fallback')).toBeNull();
  });
});
