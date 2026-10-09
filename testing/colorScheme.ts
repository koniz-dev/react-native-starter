/**
 * The color scheme React Native reports in tests ('light' unless a test sets
 * it). jest.setup.ts mocks useColorScheme to read it and resets it before
 * each test.
 */
let current: 'light' | 'dark' = 'light';

export function setColorScheme(scheme: 'light' | 'dark'): void {
  current = scheme;
}

export function getColorScheme(): 'light' | 'dark' {
  return current;
}
