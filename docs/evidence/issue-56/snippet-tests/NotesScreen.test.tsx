import { screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { renderWithProviders } from '@/testing';
import { NotesScreen } from '@/features/notes/screens/NotesScreen';
import { lightTheme } from '@/shared/ui/theme';
import { SessionProvider } from '@/shared/session/SessionProvider';

it('signed out: a prompt on the theme background, with its own strings, and no list', async () => {
  const view = renderWithProviders(<SessionProvider><NotesScreen /></SessionProvider>);
  expect(await screen.findByText('Sign in to see your notes')).toBeTruthy();
  expect(screen.getByText('Sign in')).toBeTruthy();
  expect(screen.queryByText('The notes list')).toBeNull();
  void view;
  // The nearest ancestor with a background: the SafeAreaView.
  let node = screen.getByText('Sign in to see your notes').parent;
  while (node && !StyleSheet.flatten(node.props.style)?.backgroundColor) node = node.parent;
  expect(StyleSheet.flatten(node?.props.style)).toMatchObject({ backgroundColor: lightTheme.colors.background });
});
