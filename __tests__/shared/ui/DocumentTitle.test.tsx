import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';

// On native, expo-router's Head renders nothing; render what it is given.
jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));

describe('<DocumentTitle />', () => {
  it('puts its title in the document head', () => {
    const { UNSAFE_root } = render(<DocumentTitle title="Settings" />);
    expect(UNSAFE_root.findByType('title' as never).props.children).toBe(
      'Settings'
    );
  });
});
