import { render } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';
import { DocumentTitle as WebDocumentTitle } from '@/shared/ui/DocumentTitle.web';

// Record what Head is given: on the web it puts it in the document head.
const mockHead = jest.fn<null, [{ children: ReactNode }]>(() => null);
jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: (props: { children: ReactNode }) => mockHead(props),
}));

describe('<DocumentTitle />', () => {
  it('puts its title in the document head on the web', async () => {
    await render(<WebDocumentTitle title="Settings" />);
    expect(mockHead.mock.lastCall?.[0].children).toMatchObject({
      type: 'title',
      props: { children: 'Settings' },
    });
  });

  it('renders nothing on native', async () => {
    expect(
      (await render(<DocumentTitle title="Settings" />)).toJSON()
    ).toBeNull();
  });
});
