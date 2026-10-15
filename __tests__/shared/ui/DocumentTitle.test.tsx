import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';
import { DocumentTitle as WebDocumentTitle } from '@/shared/ui/DocumentTitle.web';

// Render what Head is given, as the web's Head puts it in the document.
jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));

describe('<DocumentTitle />', () => {
  it('puts its title in the document head on the web', () => {
    const { UNSAFE_root } = render(<WebDocumentTitle title="Settings" />);
    expect(UNSAFE_root.findByType('title' as never).props.children).toBe(
      'Settings'
    );
  });

  it('renders nothing on native', () => {
    expect(render(<DocumentTitle title="Settings" />).toJSON()).toBeNull();
  });
});
