# Issue #10 verification summary

Verified on 2026-09-30.

1. Fresh default configuration exposes a **Try authentication demo** action on the
   Home tab. The exported web bundle was opened locally; selecting it navigated to
   `/login`, where the username/password fields and the documented `emilys` /
   `emilyspass` credentials are visible. The live DummyJSON login request was verified
   separately without recording its access token. Evidence:
   `05-web-export.log`, `06-demo-auth-endpoint.log`.
2. `authService` normalizes the demo response and persists the token and user data;
   the login-screen test verifies a successful submission routes to `/(tabs)`.
   Evidence: `03-test-ci.log`.
3. The service rejects malformed or failed login responses without persisting a
   session; the login-screen test verifies a visible error and no navigation.
   Evidence: `03-test-ci.log`.
4. Lint, TypeScript, Jest, and format checks pass. Evidence: `01-lint.log`,
   `02-type-check.log`, `03-test-ci.log`, `04-format-check.log`.

The browser check did not submit the public demo credentials. Native-device behavior
is outside this issue's acceptance criteria and was not represented as verified.
