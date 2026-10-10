# Issue 21 verification — login form with the software keyboard open

Verified on 2026-10-04.

## Change (`app/(auth)/login.tsx`)

- The form's `ScrollView` is wrapped in a `KeyboardAvoidingView`
  (`behavior`: `padding` on iOS, `height` on Android), so the form moves
  above the keyboard.
- Username: `returnKeyType="next"`, `submitBehavior="submit"`, and
  `onSubmitEditing` focuses the password field through a ref (the keyboard
  stays open).
- Password: `returnKeyType="go"` and `onSubmitEditing={handleLogin}`.

## Acceptance criteria

| #   | Criterion                                                                                                                  | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Result |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Sign In visible or reachable with the software keyboard open on either field                                               | Android: [username focused, keyboard open](uat/android-01-username-keyboard-sign-in-visible.png), [password focused](uat/android-02-next-moves-to-password.png), with Sign In above the keyboard in both. iOS: [username focused](uat/ios-01-username-keyboard-sign-in-visible.png); XCUITest asserts `Sign In.frame.maxY <= keyboard.frame.minY` with each field focused ([runs](uat/xcuitest-runs.log)).                                                                            | PASS   |
| 2   | Username Return moves focus to password; password Return submits                                                           | Android: tapping the IME next key moves focus with the keyboard still open ([02](uat/android-02-next-moves-to-password.png)); the IME go key signs in ([03](uat/android-03-go-signed-in-home.png)). iOS: XCUITest taps the keyboard's `next` and `go` keys, asserting password focus and then Home ([test](uat/xcuitest-LoginKeyboard.swift), [runs](uat/xcuitest-runs.log): 3/3 passed; [Home with iOS "Save Password?" sheet](uat/ios-02-signed-in-home-save-password-prompt.png)). | PASS   |
| 3   | Jest + RNTL: username submit focuses password; password submit calls `authService.login` with the entered credentials      | [05-login-screen-tests.log](05-login-screen-tests.log): new tests "moves from username to password with the next key", "submits the form from the password return key", "wraps the form in a keyboard-avoiding container". All three fail against the previous screen (checked locally).                                                                                                                                                                                              | PASS   |
| 4   | iOS simulator and Android emulator with the software keyboard: Sign In reachable, Return on password signs in (human-only) | iOS 18.6 (iPhone 16 Pro) and Android 17 / API 37, both via Expo Go: rows 1–2 above.                                                                                                                                                                                                                                                                                                                                                                                                   | PASS   |
| 5   | lint, type-check, test:ci, format:check                                                                                    | [01](01-lint.log) (0 errors; the 6 warnings are the existing ones in `components/ThemedText.tsx`), [02](02-type-check.log), [03](03-test-ci.log) (11 suites / 57 tests), [04](04-format-check.log)                                                                                                                                                                                                                                                                                    | PASS   |

## Note on simulator typing

XCUITest's bulk `typeText` intermittently dropped characters from the
username field (for example `e` or `es` instead of `emilys`), on both the
fixed screen (2 of 4 runs) and the **pre-fix** screen (2 of 3 runs, see the
control section of [xcuitest-runs.log](uat/xcuitest-runs.log)). That is a
pre-existing interaction between very fast synthetic input and the controlled
input in a development build, not a regression from this change. The
verifying test types key by key on the software keyboard, like a user, and
passed 3 of 3 runs. The control runs also show that the pre-fix keyboard has
no `next` key.

After the UAT runs, only the unused `testID` on the `KeyboardAvoidingView` was
removed; behavior is unchanged.
