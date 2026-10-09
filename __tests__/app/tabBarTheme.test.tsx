import { StyleSheet } from 'react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { getTabBarColors, getTheme } from '@/shared/ui/theme';
import { setColorScheme } from '@/testing';

// The login route imports the auth service, which loads both storage modules.
type Instance = typeof screen.UNSAFE_root;

function flatStyle(node: Instance) {
  return StyleSheet.flatten(node.props.style) ?? {};
}

function findTabBar(backgroundColor: string) {
  return screen.UNSAFE_root.findAll(
    (node: Instance) =>
      typeof node.type === 'string' &&
      flatStyle(node).backgroundColor === backgroundColor &&
      flatStyle(node).borderTopColor !== undefined
  );
}

function labelColor(text: string) {
  return flatStyle(screen.getByText(text)).color;
}

describe.each(['light', 'dark'] as const)('tab bar in %s mode', scheme => {
  const theme = getTheme(scheme);
  const expected = getTabBarColors(theme);

  beforeEach(() => {
    setColorScheme(scheme);
  });

  test('tab bar colors come from the active theme tokens', () => {
    expect(expected).toEqual({
      background: theme.colors.surface,
      border: theme.colors.outlineVariant,
      active: theme.colors.primary,
      inactive: theme.colors.onSurfaceVariant,
    });
    expect(expected.active).not.toBe(expected.background);
    expect(expected.inactive).not.toBe(expected.background);
  });

  test('renders the tab bar with the theme background and tints', async () => {
    renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('Session');

    const [tabBar] = findTabBar(expected.background);
    if (!tabBar) throw new Error('tab bar not found');
    expect(flatStyle(tabBar).borderTopColor).toBe(expected.border);

    expect(labelColor('Home')).toBe(expected.active);
    // @demo remove-block-start
    expect(labelColor('Explore')).toBe(expected.inactive);
    // @demo remove-block-end
  });
});
