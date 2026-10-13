# Issue 89: review of the moderate Dependabot alerts (main e4742f2, 2026-10-14)

Measurements and code references: `review-measurements.txt`.

| Alert | Path | Reach | Decision |
|-------|------|-------|----------|
| #2 decode-uri-component 0.2.2, GHSA-vcc3-ghjq-m6fr (DoS on malformed percent-encoding) | expo-router 57 → query-string 7 (in the app bundle) | The advisory holds: `query-string.parse` with 400 `%ff` tokens takes ~5 s in Node. The app never calls it on a URL: Expo Router passes its own `getStateFromPath` (getLinkingConfig.js), which reads the query with `URL.searchParams`; query-string is only used to `stringify`, and its `parse` sits in the default parser that Expo Router replaces. Measured: the router opens `/?q=` + 300 `%ff` in 50 ms (Jest), and Chrome on the production export renders Home with 800 tokens in 140 ms. | Dismissed, "vulnerable code not used". The fix (0.5.0) is ESM-only while query-string 7 `require`s it, and an npm `overrides` would be copied into every project made from the template. Revisit when expo-router moves off query-string 7. |
| #1 uuid 7.0.3, GHSA-w5hq-g745-h8pq (no bounds check in v3/v5/v6 with `buf`) | @expo/config-plugins → xcode (prebuild time only, not in the app) | xcode calls only `uuid.v4()`; the vulnerable functions aren't called. | Dismissed, "vulnerable code not used". |
| #5 sprintf-js 1.0.3, GHSA-hp3w-g68c-fv3c (DoS via precision specifiers) | Jest coverage: babel-plugin-istanbul → js-yaml 3 → argparse (development only) | Formats the project's own nyc config while tests run; no untrusted input, not in the app; no patched version exists. | Dismissed, "tolerable risk". |

If a project calls `query-string`'s `parse` (or `decode-uri-component`) itself on input from outside, it is exposed; the template doesn't.
