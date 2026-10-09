import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { darkTheme, getTheme, lightTheme } from '@/shared/ui/theme';

/** Channels (0-255) of a `#rrggbb` or `rgb(r, g, b)` color. */
function channelsOf(color: string): number[] {
  const rgb = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
  if (rgb) return rgb.slice(1, 4).map(Number);
  return [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
}

/** WCAG relative luminance. */
function luminance(color: string): number {
  const channels = channelsOf(color).map(channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [r = NaN, g = NaN, b = NaN] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

describe.each([
  ['light', lightTheme, MD3LightTheme],
  ['dark', darkTheme, MD3DarkTheme],
] as const)('%s theme', (scheme, theme, baseline) => {
  const { colors } = theme;

  it('is what getTheme returns for the scheme', () => {
    expect(getTheme(scheme)).toBe(theme);
    expect(theme.dark).toBe(scheme === 'dark');
  });

  it('uses the brand primary rather than the MD3 baseline', () => {
    expect(colors.primary).not.toBe(baseline.colors.primary);
    expect(colors.primary).not.toMatch(/^#fff(fff)?$/i);
  });

  it.each([
    ['onPrimary', 'primary'],
    ['onPrimaryContainer', 'primaryContainer'],
    ['onSecondaryContainer', 'secondaryContainer'],
    ['onBackground', 'background'],
    ['onSurface', 'surface'],
    ['primary', 'background'],
    ['inversePrimary', 'inverseSurface'],
  ] as const)('%s on %s meets WCAG AA contrast (4.5:1)', (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

it('getTheme falls back to light for an unknown scheme', () => {
  expect(getTheme(null)).toBe(lightTheme);
});
