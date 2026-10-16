# Issue #109: logger URL keys, a repeated Showcase announcement, the iOS simulator picker, the testing tree

The fix is in three commits:
- 2f5aa37: the logger.
- 5a712d0: Showcase.
- cb74c16: `e2e-ios.yml` and `docs/testing.md`.

## Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Tests for items 1 and 2 fail before and pass after. | PASS | `logger-before.log`: `linkText` comes out as `"Why"` and `locationName` as `"Room 5"`. `logger-after.log`: 72/72. `showcase-before.log`: "Expected number of calls: 2, Received: 1". `showcase-after.log`: 9/9. |
| 2 | Item 3: run locally on a device list with no iPhone, the picker prints a message and exits non-zero. | PASS | `picker-before.log`: the old script fails with `TypeError: Cannot read properties of undefined (reading 'udid')`. `picker-after.log`: with no iPhone, it prints "No available iPhone simulator on …iOS-26-0" and exits 1. With no runtime it exits 1. A normal list picks the iPhone 17, and so does this Mac's real `simctl` list. The E2E iOS runs since cb74c16 use the new script and picked "iPhone 17 - iOS 26.5". |
| 3 | Item 4: the tree in the docs matches `ls testing __tests__`. | PASS | `tree.txt`. The tree now shows `testing/index.ts` (what `@/testing` exports), `__tests__/testing/`, and the separate import path for `projectCopy`. |
| 4 | Gates, docs:check and CI are green. | PASS | `gates.log`: 582/582. CI on cb74c16. Showcase isn't in the E2E flows, and the iOS runs on cb566e4 pass 7/7. |

## Notes

- `URL_KEY` now matches only at the end of the key: `/(ur[il]|href|link|endpoint|location)$/i`.
  Whether a value looks like a URL is not checked. An axios `url` such as
  `users?token=…` has no scheme, and checking the value would let that token into
  logs.
- Showcase handles a repeated message the way Login does: it clears the message for
  100 ms and then sets it again. The timer is cleared when the screen unmounts.
