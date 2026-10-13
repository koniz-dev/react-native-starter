import { AccessibilityInfo } from 'react-native';
import { act, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '@/features/auth/screens/ProfileScreen';
import { ApiError } from '@/shared/http/apiError';
import { authService } from '@/shared/session/authService';
import { logger } from '@/shared/lib/logger';
import { setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { renderWithProviders, secureStore } from '@/testing';

async function signInWithoutProfile() {
  secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
  await setItem(STORAGE_KEYS.INSTALL_MARKER, true);
}

describe('<ProfileScreen />', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows placeholders until a profile is known', async () => {
    await signInWithoutProfile();
    jest.spyOn(authService, 'fetchProfile').mockResolvedValue(null);

    const { findByTestId, queryByTestId, getAllByText } = renderWithProviders(
      <ProfileScreen />,
      { withSession: true }
    );

    await findByTestId('profile-logout');
    await waitForRefresh(queryByTestId);
    expect(getAllByText('—')).toHaveLength(2);
  });

  it('shows and announces a failed reload in a live region', async () => {
    await signInWithoutProfile();
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    jest
      .spyOn(authService, 'fetchProfile')
      .mockRejectedValue(new ApiError('Network Error', { code: 'network' }));

    const { findByTestId } = renderWithProviders(<ProfileScreen />, {
      withSession: true,
    });

    const error = await findByTestId('profile-error');
    const status = await findByTestId('profile-status');
    const message =
      'Could not refresh your profile: No connection. Check your network and try again.';
    expect(error).toHaveTextContent(message);
    expect(status.props.accessibilityLiveRegion).toBe('polite');
    expect(status).toContainElement(error);
    expect(announce).toHaveBeenCalledWith(message);
  });

  it('shows nothing for a 401: the session ends and the guard leaves', async () => {
    await signInWithoutProfile();
    jest
      .spyOn(authService, 'fetchProfile')
      .mockRejectedValue(new ApiError('Expired', { code: 'unauthorized' }));

    const { findByTestId, queryByTestId } = renderWithProviders(
      <ProfileScreen />,
      { withSession: true }
    );

    await findByTestId('profile-logout');
    await waitForRefresh(queryByTestId);
    expect(queryByTestId('profile-error')).toBeNull();
  });

  it('shows a labeled indicator while reloading', async () => {
    await signInWithoutProfile();
    const pending: (() => void)[] = [];
    jest
      .spyOn(authService, 'fetchProfile')
      .mockImplementation(
        () => new Promise(resolve => pending.push(() => resolve(null)))
      );
    const { findByLabelText, queryByTestId } = renderWithProviders(
      <ProfileScreen />,
      { withSession: true }
    );

    expect(await findByLabelText('Refreshing your profile')).toBeTruthy();
    await act(async () => pending.forEach(finish => finish()));
    await waitForRefresh(queryByTestId);
  });

  it('logs a reload that failed for a reason other than the server', async () => {
    await signInWithoutProfile();
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => {});
    const failure = new Error('The profile did not match the schema');
    jest.spyOn(authService, 'fetchProfile').mockRejectedValue(failure);

    const { findByTestId } = renderWithProviders(<ProfileScreen />, {
      withSession: true,
    });

    expect(await findByTestId('profile-error')).toHaveTextContent(
      /Something went wrong/
    );
    expect(logged).toHaveBeenCalledWith(
      'Refreshing the profile failed',
      failure
    );
  });
});

/** Waits until the screen's refresh has settled (the spinner is gone). */
async function waitForRefresh(
  queryByTestId: (id: string) => unknown
): Promise<void> {
  await waitFor(() => expect(queryByTestId('profile-refreshing')).toBeNull());
}
