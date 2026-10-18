# R1docs: confirmation audit of ef39dd9, 63b4159, and the docs part of 12678ba

Result: no HIGH or MEDIUM findings. Every new claim checks out against the real sources (eas-cli 25.2.0, expo-notifications 57.0.23, expo-updates 57.0.26, react-native in node_modules, axios 1.20.0). There are 9 LOWs: nuances and wording.

## Gates run (in a scratch copy of HEAD, with node_modules symlinked)
- `npm run docs:check`: "Checked 19 files: 42 TypeScript snippets compiled with tsc ... No problems." (the push and OTA snippets compile and lint; the TanStack and Zustand snippets are skipped because those packages aren't installed, which is expected).
- `npx prettier --check docs`: all files pass.
- `npx jest __tests__/scripts __tests__/docs`: 162/163. removeDemo, initProject, and checkDocs pass, so remove-demo and init-project still leave no demo words. The one failure was testingSnippets timing out at 15 s while 7 heavy suites ran in parallel. Run alone, it passes in 1 s (see L9).

## Claims verified (accurate)
- **eas update env** (eas-cli 25.2.0, build/commands/update/index.js):
  - With `--environment`, `maybeServerEnv = {...getServerSideEnvironmentVariablesAsync(), EXPO_NO_DOTENV:'1'}` (lines 200-204) is passed as `extraEnv` to `buildBundlesAsync` (line 218). The `expo export` child process then skips every .env file: @expo/env `isEnabled()` returns `!EXPO_NO_DOTENV`.
  - Without the flag, `extraEnv = {}`, and `expo export` calls `loadEnvFiles(projectRoot)` (@expo/cli build/src/export/exportApp.js:133). It loads .env, plus .env.production and .env.local because NODE_ENV=production.
  - eas.json build-profile `env` is never read by `eas update` (only the `cli` config is read).
  - So the doc sentence is right for the JS bundle.
  - **APP_VARIANT with `--environment`:** yes, app.config.ts sees it. The server variables are merged into eas-cli's own `expo config` evaluation (DynamicProjectConfigContextField.js, expoConfig.js:25-36) and into the export child.
- **Web push keys:** expo-notifications build/getDevicePushTokenAsync.web.js:22-29 reads `Constants.expoConfig?.notification?.vapidPublicKey` and `...notification?.serviceWorkerPath`, and throws without them. `getExpoPushTokenAsync` calls it first. So `Platform.OS === 'web'` returning null / `unsupported` keeps the seam's promise. `'unsupported'` is in the seam type (shared/integrations/pushNotifications.ts:11).
- **expo-updates on the web:** build/ExpoUpdates.web.js has `isEnabled = true`, and `checkForUpdateAsync` always returns `isAvailable:false`. In `__DEV__`, Updates.js:194-198 throws ERR_UPDATES_DISABLED. So "reports itself enabled but can't update" is accurate, and the guard fixes the dev-web rejection.
- **Timeout row:**
  - iOS: RCTNetworking.mm:335 sets `request.timeoutInterval` (NSURLRequest idle interval). No resource timeout is set anywhere in Libraries/Network, and XMLHttpRequest.js only passes the timeout to native.
  - Android: NetworkingModule.kt:416 sets `clientBuilder.callTimeout(timeout)`. The base client has connect, read, and write timeouts of 0 (OkHttpClientProvider.kt:52-54), so the timeout covers the whole call.
  - Web: axios defaults to the `['xhr', ...]` adapter, and httpClient.ts doesn't override it. XHR `timeout` covers the whole request.
- **TanStack:** useFetch's `refetch` sets `loading` true and clears data on error. In the mapping, a successful-then-refetching query has isPending=false, so `loading` stays false. A failed refetch keeps `query.data` next to the error. Both stated differences are real.
- **Screen tracking:** useScreenTracking.ts has effect deps `[enabled, name]`, and `name` is the group-stripped pattern. So /orders/1 to /orders/2 is not reported. Accurate.
- **Error reporter:** SessionProvider.tsx:117-125 calls `setUser(userId ? {id} : null)` as soon as status is not loading. That includes a signed-out launch. Accurate.
- **ESLint 9:** the installed eslint is 9.39.5, and `npm view eslint@9.39.5 deprecated` gives "This version is no longer supported". The latest eslint-plugin-react (7.37.5, peer `^9.7`) and eslint-plugin-react-native (5.0.0, peer `^9`) don't allow ESLint 10. Accurate.
- **EAS development profile:** eas.json `development` has ios `simulator: true` and an Android `:app:assembleDebug` APK with no dev client. Accurate.
- **Zustand:** `createJSONStorage(() => AsyncStorage)` is the right adapter. shared/storage/storage.ts does JSON-encode values. No lint rule forbids importing AsyncStorage.
- **Tree additions:** features/not-found/screens/NotFoundScreen.tsx, app/+not-found.tsx (re-exports it), shared/ui/DocumentTitle(.web).tsx, shared/ui/useAnnouncement.ts, and __tests__/docs/testingSnippets.test.tsx all exist. The test does run the docs' snippets.

## LOW findings
- **R1docs-1 (LOW): docs/environment-variables.md:105-112. The interactive `eas update` prompt is a trap the paragraph doesn't name.**
  - On SDK >= 55, outside CI, without `--environment`, eas-cli prompts "Select environment:" (update/index.js:157-163, update/utils.js:266-281).
  - The answer is stored only as update metadata (`environment` is used only at index.js:419). The variables still come only from `environmentFromFlags` (lines 147 and 200).
  - So an adopter who picks "production" at the prompt still ships their local .env.
  - The doc's "without the flag" sentence is technically right, but this is the case adopters will hit.
  - Fix: add "picking an environment at the prompt doesn't load its variables; pass the flag."
- **R1docs-2 (LOW): same paragraph. "Without the flag it bundles with your local .env" applies to the JS bundle only, not the update's app config.**
  - The manifest's `extra.expoClient` (Constants.expoConfig after an update) is the `exp` from eas-cli's own `expo config` run (project/publish.js:143). That run always sets `EXPO_NO_DOTENV: '1'` (project/expoConfig.js:33-36).
  - So APP_VARIANT in .env is ignored there: it comes from the shell, or else defaults to `development` (app.config.ts:53).
  - The recommended fix (APP_VARIANT in EAS env plus `--environment`) is correct, so this is precision only.
- **R1docs-3 (LOW): docs/plug-in-a-provider.md:146-149. Web push config wording and typing.**
  - The key is `notification.serviceWorkerPath`; the doc's "`notification.vapidPublicKey` and `serviceWorkerPath`" can read as a top-level key.
  - `notification` is not in SDK 57's `ExpoConfig` type (@expo/config-types 57.0.2). An adopter who adds it to the typed app.config.ts gets "TS2353: 'notification' does not exist in type 'ExpoConfig'". I reproduced this with tsc in a scratch file.
  - It only matters to someone who enables web push, which the doc doesn't ask for.
- **R1docs-4 (LOW): push adapter `onNotification` still subscribes on the web.**
  - expo-notifications NotificationsEmitterModule.js (web) logs once: "Emitting notifications is not yet fully supported on web. Adding a listener will have no effect."
  - Harmless, but it doesn't match "reports it as unsupported there".
  - Fix (optional): `if (Platform.OS === 'web') return () => {};`.
- **R1docs-5 (LOW): shared/integrations/useScreenTracking.ts:7.** The doc comment still says "whenever the route changes". The docs were corrected to "whenever the route pattern changes", but the code comment was not.
- **R1docs-6 (LOW): docs/recipes/state-management.md:80-82 vs AGENTS.md ("persist preferences with the wrappers in shared/storage/").**
  - The recipe is right, but it conflicts with AGENTS.md without saying why.
  - There is also a stronger reason than double encoding: `getItem` in the wrapper turns read failures into `null`. Persist would then rehydrate empty and overwrite the stored state.
- **R1docs-7 (LOW): docs/conventions.md:20.** The new `not-found/screens/` line sits between `auth/screens/` and `auth/<backend>Adapter.ts`, which splits the auth entries. Cosmetic.
- **R1docs-8 (LOW): docs/api-and-storage.md:413-415. "Two things differ" isn't exhaustive.**
  - Going back to a query key that is already cached shows the cached data with `loading` false. useFetch shows `loading` with null data in that case.
  - This is the intended cache benefit, but the sentence implies those are the only differences.
- **R1docs-9 (LOW, observation): __tests__/docs/testingSnippets.test.tsx can hit the 15 s per-test timeout under heavy parallel load.**
  - It timed out once while running with the 6 script suites, and passed in 1026 ms alone.
  - It is not related to these commits. Noted only in case CI shows it.

## Files read
- Diffs: ef39dd9, 63b4159, 12678ba.
- Repo, in full: docs/environment-variables.md, docs/plug-in-a-provider.md, app.config.ts, eas.json, .env.example, shared/lib/useFetch.ts, shared/integrations/useScreenTracking.ts, shared/storage/storage.ts.
- Repo, sections: docs/api-and-storage.md (timeout table, TanStack section), docs/app-config.md:38-56, docs/conventions.md:1-45, docs/testing.md:15-45, docs/recipes/state-management.md:60-100, shared/session/SessionProvider.tsx:105-130, shared/integrations/pushNotifications.ts and updates.ts (types), __tests__/docs/testingSnippets.test.tsx (header).
- eas-cli 25.2.0: commands/update/index.js (env paths), update/utils.js:255-281, utils/prompts.js:87-112, commandUtils/flags.js:87-93, commandUtils/context/DynamicProjectConfigContextField.js, ServerSideEnvironmentVariablesContextField.js, contextUtils/loadServerSideEnvironmentVariablesAsync.js, project/expoConfig.js:15-60, project/publish.js:125-191, utils/expoCli.js:74-116.
- expo-notifications 57.0.23: getDevicePushTokenAsync.web.js, getExpoPushTokenAsync.js, NotificationsEmitter.js, NotificationsEmitterModule.js, NotificationPermissions.js.
- expo-updates 57.0.26: ExpoUpdates.web.js, Updates.js (isEnabled, checkForUpdateAsync, reloadAsync).
- react-native: RCTNetworking.mm:325-340, NetworkingModule.kt:408-420, OkHttpClientProvider.kt:50-55, XMLHttpRequest.js (timeout).
- Also: @expo/cli exportApp.js:133 and nodeEnv.js:104-116, @expo/env isEnabled, axios defaults.
