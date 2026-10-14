import { Activity } from 'react';
import { Text } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { renderRouter, screen as rscreen } from 'expo-router/testing-library';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { getTheme } from '@/shared/ui/theme';
import { useFetch } from '@/shared/lib/useFetch';
import { analyticsSeam, type Analytics } from '@/shared/integrations/analytics';
import { configureIntegrations } from '@/shared/integrations/setup';

describe('audit: ui', () => {
  afterEach(() => { analyticsSeam.reset(); jest.restoreAllMocks(); });

  it('B1 useFetch keeps a stale error after a successful re-run of its effect', async () => {
    const fetchFn = jest.fn<Promise<string>, [AbortSignal]>()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce('ok');
    function Probe() {
      const { data, loading, error } = useFetch(fetchFn);
      return <Text testID="probe">{`${loading}:${data}:${error?.message ?? 'none'}`}</Text>;
    }
    const view = (mode: 'visible' | 'hidden') => <Activity mode={mode}><Probe /></Activity>;
    const { rerender } = render(view('visible'));
    await waitFor(() => expect(screen.getByTestId('probe', { includeHiddenElements: true })).toHaveTextContent('false:null:down'));
    await act(async () => rerender(view('hidden')));
    await act(async () => rerender(view('visible')));
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
    await act(async () => {});
    const text = screen.getByTestId('probe', { includeHiddenElements: true }).props.children;
    console.log('B1', text);
    expect(text).toBe('false:ok:none'); // expect FAIL: false:ok:down
  });

  it('B2 the app ErrorBoundary and a falsy thrown value', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    function Thrower(): never { throw undefined; }
    let caught: unknown = 'none';
    try {
      render(<PaperProvider theme={getTheme('light')}><ErrorBoundary><Thrower /></ErrorBoundary></PaperProvider>);
    } catch (e) { caught = e; }
    console.log('B2 escaped boundary:', caught === 'none' ? 'no' : `yes (${String(caught)})`);
    expect(caught).toBe('none');
  });

  it('B3 an analytics provider that throws in screen() takes the app down', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const provider: Analytics = { track: jest.fn(), identify: jest.fn(), screen: () => { throw new Error('analytics SDK not ready'); } };
    configureIntegrations();
    analyticsSeam.set(provider);
    let caught: unknown = null;
    try {
      renderRouter('./app', { initialUrl: '/' });
      await rscreen.findByText('Not signed in');
    } catch (e) { caught = e; }
    console.log('B3', caught ? `crashed: ${(caught as Error).message?.slice(0, 120)}` : 'survived');
    expect(caught).toBeNull();
  });

  it('B4 screen tracking sends the concrete path with dynamic segment values', async () => {
    const provider: Analytics = { track: jest.fn(), identify: jest.fn(), screen: jest.fn() };
    configureIntegrations();
    analyticsSeam.set(provider);
    renderRouter({ appDir: './app', overrides: { 'reset/[token]': () => <Text>reset</Text> } }, { initialUrl: '/reset/SECRET-RESET-TOKEN' });
    await rscreen.findByText('reset');
    console.log('B4', JSON.stringify((provider.screen as jest.Mock).mock.calls));
  });
});
