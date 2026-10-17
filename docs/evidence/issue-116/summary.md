# Issue #116: the analytics recipe resets PostHog's anonymous id on every signed-out launch; logger over-redaction; Login keyboard offset

Found in the sixth deep audit (2026-10-17) by auditor B. Fixes:

- 98cb0e7: the recipe in `docs/plug-in-a-provider.md`, plus a test that runs the page's own snippets.
- f6bfff1: the logger, its docs, and the analytics seam wording.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The recipe calls `identify(null)` only when a known user signs out. Test: no reset on a signed-out launch, one reset on sign-out, and identify on a restored user. It fails before the fix and passes after. | PASS | `analytics-before.log`: one `reset()` on a signed-out launch. `analytics-after.log`: 2/2. The test (`__tests__/shared/integrations/analyticsRecipe.test.tsx`) loads `useAnalyticsIdentity` and `createPostHogAnalytics` from the doc, so it fails if the doc changes back. |
| 2 | Item 2, the Login keyboard offset, is fixed or left with a reason. | PASS (left) | See the notes below. |
| 3 | The logger still redacts every secret key it did, plus `otp`-style keys. It keeps `rootPath`, `screenshotPath`, `footprint`, `notPresent`, `author`, `authorName`, `refreshing` and `refreshedAt`. The wording is corrected. | PASS | `logger-before.log`: 8 failures, one per kept key. `logger-after.log`: 88/88. That includes the earlier redaction tables and the new `otpCode`, `otp_code`, `userOtp`, `otpcode`, `hotp`, `authCode`, `authcode` and `basic_auth`. The default is now worded "shown in development" in the docs table and the seam comment. |
| 4 | Gates and CI are green. | PASS | `gates.log`: 618/618 at f6bfff1. CI is green on that commit and later. |

## Notes

### Item 2 was not changed

The auditor's finding comes from reading React Native 0.86's `KeyboardAvoidingView`
code: the padding falls short by the header height. It was not seen on a device.

The e2e Login flows type with the keyboard up and submit successfully on an iPhone 17
(iOS 26.5, native) and an iPhone 16 Plus (iOS 18.6, Expo Go). The iOS native
`04-password-focused` screenshots also show the form and the Sign In button clear of
the keyboard.

Changing the offset without a small device to check it against risks moving the
layout the wrong way, so it is left for a device check.

### The logger fix

The short secret words (`auth`, `otp`, `totp`, `hotp`, `refresh`) are now matched
against the key's words, split on case changes and on `-` or `_`. Everything else
still matches anywhere in the key.
