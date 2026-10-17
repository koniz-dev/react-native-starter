# Issue #118: loose APP_BUILD_NUMBER, audit output order and moderates, ATS/icon/recipe notes

Found in the sixth deep audit (2026-10-17) by auditor E. Fixes:

- fa67543: `APP_BUILD_NUMBER`.
- 94db28e: check-audit sort order and Getting Started.
- 6997144: docs.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `APP_BUILD_NUMBER` must be digits only and ≤ 2100000000. The test fails before the fix and passes after. | PASS | `build-before.log`: `1e3`, `0x10`, ` 42 `, `4.0` and `2100000001` were accepted (5 failures). `build-after.log`: 15/15. |
| 2 | check-audit output is sorted by severity (tested), and Getting Started says to read moderates in shipped packages. | PASS | `audit-before.log`: alphabetical order (critical, high, low, moderate). `audit-after.log`: 21/21. The real `npm run audit:check` lists the high first. Getting Started has a "reported (not gated)" paragraph that names `decode-uri-component` through expo-router. |
| 3 | Items 1, 2, 5 and 6 are documented, or left with a reason. | PASS | See the notes below. |
| 4 | Gates and CI are green. | PASS | `gates.log`: 624/624. CI is green on 6997144. |

## Notes

- **Item 1 (ATS):** `docs/connect-your-backend.md` now says iOS keeps Expo's
  `NSAllowsLocalNetworking`, and how to turn it off in `ios.infoPlist`. The default
  is unchanged: changing it would need a device check of every variant.
- **Item 2 (themed icon):** `docs/app-config.md` says how to add
  `android.adaptiveIcon.monochromeImage`, and what the launcher shows without one.
- **Item 5 (demo backends in a local production build):** no change.
  `.env.example` already warns about it, EAS builds don't read `.env`, and
  `remove-demo` deletes the switch.
- **Item 6 (Zustand persist race):** documented as unverified. The recipe now says to
  key persisted data by the user, or to reset again in `onRehydrateStorage`.
- **First gate run:** it failed. The init-project test that checks for leftover
  words caught a sentence I had just added to Getting Started that named "the
  starter". The sentence was removed before committing.
