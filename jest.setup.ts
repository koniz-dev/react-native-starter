/**
 * Shared test setup (Jest setupFilesAfterEnv): native-module mocks used by
 * every test file, reset before each test. See docs/testing.md.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetSecureStore } from '@/testing/secureStore';
import { setColorScheme } from '@/testing/colorScheme';
import { STORAGE_KEYS } from '@/shared/storage/storage';

// AsyncStorage: the library's in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

// expo-secure-store: an in-memory store (testing/secureStore.ts).
jest.mock(
  'expo-secure-store',
  () => jest.requireActual('@/testing/secureStore').secureStoreModule
);

// The system color scheme: set it with setColorScheme() from '@/testing'.
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => jest.requireActual('@/testing/colorScheme').getColorScheme(),
}));

// Assets: jest-expo mocks react-native/asset-registry, but expo-asset reads
// `AssetRegistry` from 'react-native', a separate module since React Native
// 0.88. Without this, loading an icon font rejects ("Module "1" is missing
// from the asset registry"). Remove it once jest-expo mocks that module too.
jest.mock('react-native/src/private/assets/AssetRegistry', () => ({
  AssetRegistry: jest.requireMock('react-native/asset-registry'),
}));

beforeEach(async () => {
  resetSecureStore();
  await AsyncStorage.clear();
  // Each test is an app that has launched before; a test of the first launch
  // after an install removes the marker (see clearSessionFromPreviousInstall).
  await AsyncStorage.setItem(STORAGE_KEYS.INSTALL_MARKER, 'true');
  setColorScheme('light');
});
