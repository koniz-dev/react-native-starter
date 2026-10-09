/**
 * Renders a component with the providers the app's root layout gives every
 * screen: safe-area metrics, the Paper theme, and (optionally) the session.
 * For full-app tests with routing, use renderRouter('./app') from
 * expo-router/testing-library instead.
 */
import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { SessionProvider } from '@/shared/session/SessionProvider';
import { getTheme } from '@/shared/ui/theme';

export const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export interface ProvidersOptions {
  /** Theme to render with (default 'light'). */
  scheme?: 'light' | 'dark';
  /** Wrap in SessionProvider (restores the session from the mocked stores). */
  withSession?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    scheme = 'light',
    withSession = false,
    ...options
  }: ProvidersOptions & Omit<RenderOptions, 'wrapper'> = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        <PaperProvider theme={getTheme(scheme)}>
          {withSession ? (
            <SessionProvider>{children}</SessionProvider>
          ) : (
            children
          )}
        </PaperProvider>
      </SafeAreaProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
