import { AccessibilityInfo } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '@/features/auth/screens/ProfileScreen';
import { ApiError } from '@/shared/http/apiError';
import { authService } from '@/shared/session/authService';
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
});

/** Waits until the screen's refresh has settled (the spinner is gone). */
async function waitForRefresh(
  queryByTestId: (id: string) => unknown
): Promise<void> {
  await waitFor(() => expect(queryByTestId('profile-refreshing')).toBeNull());
}
