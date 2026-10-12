# Issue 74 verification: tests

Fixes: [`bd600b4`](https://github.com/koniz-dev/react-native-starter/commit/bd600b4),
[`e0e4da9`](https://github.com/koniz-dev/react-native-starter/commit/e0e4da9).

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | Each surviving mutant is killed | [mutations.log](mutations.log): 13 mutants, all killed (useFetch ×2, readRawEnv ×3, logout order, splash ×3, refreshUser, setUser, request timeout, array redaction) plus Profile's 401 branch; [tests.log](tests.log) | PASS |
| 2   | No act() warnings | Login's synchronous tests wait for the session restore; `npx jest` output has no "not wrapped in act" | PASS |
| 3   | Per-path coverage that a new untested module fails | coverageThreshold per folder (app/, features/, shared/) and per file (70/50/70). An untested features/notes/api/notesApi.ts failed test:ci (0%); a global key matched no file once the glob covered all, so it was replaced (checked: global 99.9% passed) | PASS |
| 4   | Maestro: protected Profile; dark asserts or says what it does; flow 05 restores the mock; gap after remove-demo documented | 07-profile.yaml (sign in, View profile, GET /auth/me, back, log out): iOS, Expo Go, native all pass; dark-mode header says the colors are checked by the theme tests; 05 has onFlowComplete → mode ok; remove-demo.md lists what is deleted and asks for your own sign-in flows | PASS |
| 5   | Gates before and after init; e2e passes | CI 38292179524 (376 tests); after init [init-gates.log](verification/init-gates.log) (309 tests, all gates); e2e [iOS](verification/ios-expo-go/test-e2e-ios.log) 6/6, [Android Expo Go](verification/android-expo-go/report.xml) 7/7, [native](verification/android-native-debug/report.xml) 7/7, each plus dark | PASS |
