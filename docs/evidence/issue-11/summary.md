# Issue #11 automated verification summary

Verified on 2026-09-30.

1. Authentication tokens are stored, read, and deleted through `expo-secure-store`;
   user data remains in AsyncStorage. Evidence: `03-test-ci.log`.
2. When protected storage is unavailable, login rejects before either a token or user
   profile is persisted. Evidence: `03-test-ci.log`.
3. The storage model and web limitation are documented in `docs/api-and-storage.md`.
4. Lint, TypeScript, Jest, and format checks pass. Evidence: `01-lint.log`,
   `02-type-check.log`, `03-test-ci.log`, `04-format-check.log`.

Native UAT remains required to verify Keychain/Keystore persistence on a physical iOS
and Android device or simulator.

## Native UAT (2026-10-03 – 2026-10-04)

| Criterion                                                                          | Evidence                                                                                                                                                                                                                                                                                                                                                                     | Result |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1. Tokens stored, read, deleted through platform-secure storage on iOS and Android | iOS 18.6 simulator Keychain + AsyncStorage inspection: [uat-ios-simulator.md](uat-ios-simulator.md). Android 17 rooted emulator SharedPreferences (Keystore-wrapped AES-GCM entry) + Keystore + AsyncStorage inspection: [uat-android-root-emulator.md](uat-android-root-emulator.md). Behavioral run on the Play image: [uat-android-emulator.md](uat-android-emulator.md). | PASS   |
| 2. Non-sensitive data in AsyncStorage                                              | Only `user_data` in AsyncStorage on both platforms (same files).                                                                                                                                                                                                                                                                                                             | PASS   |
| 3–5                                                                                | Automated evidence above.                                                                                                                                                                                                                                                                                                                                                    | PASS   |

Follow-ups found during UAT and tracked separately: no user-facing logout or
session state (#22), and dummyjson token cookies in the native cookie store
(#23).
