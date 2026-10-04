import { StyleSheet } from 'react-native';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Colors } from '@/constants/Colors';
import { getTabBarColors, getTheme } from '@/constants/Theme';

// The login route imports the auth service, which loads both storage modules.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

jest.mock('expo-secure-store', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const mockColorScheme = jest.fn<'light' | 'dark', []>(() => 'light');
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme(),
}));

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
    mockColorScheme.mockReturnValue(scheme);
  });

  test('tab bar colors come from the active theme tokens', () => {
    expect(expected).toEqual({
      background: theme.colors.surface,
      border: theme.colors.outlineVariant,
      active: Colors[scheme].tabIconSelected,
      inactive: Colors[scheme].tabIconDefault,
    });
    expect(expected.active).not.toBe(expected.background);
    expect(expected.inactive).not.toBe(expected.background);
  });

  test('renders the tab bar with the theme background and tints', async () => {
    renderRouter('./app', { initialUrl: '/' });
    await screen.findByText('React Native Paper');

    const [tabBar] = findTabBar(expected.background);
    expect(tabBar).toBeDefined();
    expect(flatStyle(tabBar).borderTopColor).toBe(expected.border);

    expect(labelColor('Home')).toBe(expected.active);
    expect(labelColor('Explore')).toBe(expected.inactive);
  });
});
