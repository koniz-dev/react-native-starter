import { render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { DemoCredentialsHint } from '@/features/demo-auth/DemoCredentialsHint';
import * as env from '@/shared/config/env';
import { lightTheme } from '@/shared/ui/theme';

function renderHint(useDemoBackends: boolean) {
  const config = env.getConfig();
  jest.spyOn(env, 'getConfig').mockReturnValue({ ...config, useDemoBackends });
  return render(
    <PaperProvider theme={lightTheme}>
      <DemoCredentialsHint />
    </PaperProvider>
  );
}

afterEach(() => jest.restoreAllMocks());

describe('<DemoCredentialsHint />', () => {
  it('shows the demo account with the demo backends on', () => {
    renderHint(true);

    expect(screen.getByTestId('demo-credentials-hint')).toHaveTextContent(
      /emilys \/ emilyspass/
    );
  });

  it('renders nothing without the demo backends', () => {
    renderHint(false);

    expect(screen.queryByTestId('demo-credentials-hint')).toBeNull();
  });
});
