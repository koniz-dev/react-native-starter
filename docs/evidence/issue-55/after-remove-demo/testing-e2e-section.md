## End-to-end flows (Maestro)

[Maestro](https://maestro.dev) flows in `.maestro/` drive the app in Expo Go
on a simulator or emulator. No account is needed.

| Flow                 | Checks                                                                        |
| -------------------- | ----------------------------------------------------------------------------- |
| `01-cold-start.yaml` | a fresh start opens Home, signed out, with the Sign in button                 |
| `06-login-back.yaml` | Back from Login returns Home (Android system back; skipped on iOS, see below) |
| `dark-mode.yaml`     | screenshots with the device in dark mode                                      |

Run them with a booted device that has Expo Go:

```bash
npm run test:e2e:ios       # booted iOS Simulator
npm run test:e2e:android   # emulator or device on adb
```

`scripts/e2e/run.sh` starts Metro and, by default, points
`EXPO_PUBLIC_API_URL` at the e2e mock API (`scripts/e2e/mock-api.js`, on
port 9999). On Android it sets up `adb reverse` for Metro and for every
`localhost` URL it uses. It runs the numbered flows, then switches the device
to dark mode for `dark-mode.yaml` and back. Results, screenshots, and a JUnit
report go to `e2e-results/<platform>/` (gitignored).

The e2e mock is there so a flow can check an error state without a real
backend failing: a flow switches it between `ok` and `error`
(`.maestro/scripts/set-api-mode.js`), and in `error` mode it answers every
request with a 503. In `ok` mode it answers only the routes in its `ROUTES`
table; add the ones your error-state flows need. For anything more, such as
signed-in flows that load real data, use your own backend or mock.

On iOS, Back from Login is the left-edge swipe, which Maestro's `swipe` does
not trigger, so `run.sh` skips the `android-only` flow there. Check the edge
swipe by hand on the Simulator, or with an XCUITest UI test, which can drive
it.

Setup:

- **Maestro CLI**: download `maestro.zip` from the
  [Maestro releases](https://github.com/mobile-dev-inc/maestro/releases),
  check it against `checksums_sha256.txt`, unzip it, and put `maestro/bin` on
  your `PATH` (or set `MAESTRO=/path/to/maestro/bin/maestro`). It needs Java
  17+ (`JAVA_HOME`).
- **Expo Go** for SDK 57 on the device (`npx expo start` offers to install it
  on a simulator or emulator).
- **iOS Simulator keyboard**: the login flows type with the software
  keyboard, so turn off Simulator's **I/O > Keyboard > Connect Hardware
  Keyboard** (or run
  `defaults write com.apple.iphonesimulator ConnectHardwareKeyboard -bool false`
  and restart the Simulator).
- To run against a development build instead, set `E2E_APP_ID` (its bundle /
  package ID) and `E2E_APP_URL` (its dev-client URL).
- Slow emulators: the runner allows Maestro 180 s to start its driver
  (`MAESTRO_DRIVER_STARTUP_TIMEOUT`, in ms), builds the bundle before the
  flows start, and on Android turns off system animations and the "isn't
  responding" dialogs for background apps (test-device settings it leaves
  in place).

The Android flows can also run in GitHub Actions: the manual
**E2E (Android, manual)** workflow (`.github/workflows/e2e-android.yml`)
boots an emulator, installs the Maestro release and the app, and uploads
`e2e-results/android`. Its `app` input picks Expo Go (the default) or
`native-debug`: a debug build of the development variant
(`npm run prebuild:development`, then Gradle `assembleDebug`), which loads
its bundle from Metro and opens with `rnstarter-dev://`. It is not part of the per-push checks because an
emulator run takes much longer.

### Your backend or mock

Set these when you run the flows; with none set, the runner uses the e2e mock
as above.

| Variable           | Default       | What it does                                                                                                      |
| ------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `E2E_API_URL`      | the e2e mock  | `EXPO_PUBLIC_API_URL` for the run                                                                                 |
| `E2E_AUTH_API_URL` | `E2E_API_URL` | `EXPO_PUBLIC_AUTH_API_URL` for the run                                                                            |
| `E2E_BACKEND_CMD`  | none          | a command that starts your backend or mock; the runner waits until `E2E_API_URL` answers, and stops it at the end |

For example, with a mock backend in `scripts/` (see
[Where code goes](conventions.md#where-code-goes)) that listens on port 4000:

```bash
E2E_API_URL=http://localhost:4000 E2E_BACKEND_CMD="node scripts/<your-mock>.js" \
  MAESTRO_E2E_USERNAME=tester@example.com MAESTRO_E2E_PASSWORD=test-password \
  npm run test:e2e:android
```

- **Signed-in flows** sign in through the Login screen with a test account,
  never a real user. Maestro passes `MAESTRO_*` variables to every flow, so a
  flow types `${MAESTRO_E2E_USERNAME}` and the password never goes in the
  repository. Start the flow with `.maestro/subflows/open-app.yaml` and
  `CLEAR_STATE: 'true'` so it begins signed out.
- **A backend on another machine or HTTPS** works too: set the URL, and leave
  `E2E_BACKEND_CMD` unset. Only `localhost` URLs get `adb reverse`; see
  [A backend on your computer](connect-your-backend.md#a-backend-on-your-computer).
- **The e2e mock still runs** on port 9999, so flows that switch it keep
  working; they only affect screens that load from it.

## Timeouts
