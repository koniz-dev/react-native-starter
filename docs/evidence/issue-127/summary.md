# Issue 127: iOS native e2e fails now and then on a slow runner

Found while verifying #126. Fixes:
- 99b5974: `tap-after-launch.yaml` taps again when the first tap after a launch is lost.
- 521a853: on iOS, `run.sh` runs the flows once more after a failure.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Find out why a tap is lost on a slow runner, from the artifacts or a local reproduction. | PASS, with one case left open | See "What the artifacts show". Three failures had three causes, all in the simulator or its XCTest driver. Case B is explained only as far as "the touch reached the window and no press followed". |
| 2 | Make the flows wait or retry an action whose effect doesn't appear, without hiding a real failure. | PASS | See "The fix". In both layers a control that doesn't work still fails, and every retry is printed. |
| 3 | iOS native e2e passes on 3 runs in a row; Android stays green. | PASS | iOS on 521a853: runs 39110184482, 39112296433 and 39115304694, each 7/7 plus dark mode. Run 39112296433 needed the retry: its first attempt hit `DeviceUnreachableException` in Cold start (`521a853-run2-report*.xml`). Android: see "CI and e2e". |

## What the artifacts show

`log-analysis.txt` compares Maestro's taps with the touch events that UIKit logs in the
app, in the failed runs and in the green v1.1.14 run 39043256528.

- **A. The tap never reaches the app** (34fccc5, attempt 1, flow 05).
  - Every successful tap logs a touch down and a touch up in the app, 1–3 s after
    Maestro's command.
  - The Explore tap at 17:59:39 logs none.
  - Metro logs no `screen /explore`, and the mock got no request.
  - Maestro still reported COMPLETED, because it decides from a hierarchy diff.
- **B. The touch reaches the app, but no press follows** (34fccc5, attempt 2, flow 03).
  - Touch down and touch up for Log out reached the window, 13 s after the bundle had
    loaded.
  - No spinner appeared, and nothing was logged.
  - After the next relaunch the app was still signed in, so `signOut()` never ran.
  - Why React Native didn't turn this touch into a press is not known.
    `systemGestureStateChange: 1` appears on almost every tap in green runs too, so
    it doesn't explain it.
- **C. The XCTest driver dies.**
  - 99b5974, attempt 1, flow 05, while waiting for Home: one Safari WebView hierarchy
    fetch took 92.4 s, where green runs take at most 0.6 s. Then
    `DeviceUnreachableException` (`99b5974-attempt1-report.xml`).
  - The same exception hit Cold start in 521a853's second run, during a screenshot.

Correction to the issue text: the bundle after each relaunch also takes 4–6 s in green
runs, so it doesn't separate red from green. Only the full bundles and the cold start
do: 79 s and 160 s against 25 s.

## The fix

1. **`tap-after-launch.yaml` (99b5974).** It taps once more when the expected text
   hasn't appeared in 5 s. It is used for the first tap after a launch in flows 02, 03,
   05 and dark mode, and it replaces the same steps that `open-login.yaml` already had.
   The flow still waits for the text afterwards, so it covers A and B. The next run on
   99b5974 still failed, on C, which happens before any tap.
2. **The retry in `run.sh` (521a853), iOS only.**
   - **What it does:** when a flow fails, it runs all the flows and the dark-mode flow
     once more. It prints `E2E RETRY` and keeps both attempts' output (`maestro*`,
     `report.xml` and `report-retry.xml`).
   - **Why everything reruns:** the flows stop at the first failure, so the later ones
     haven't run.
   - **Real failures still fail:** a flow that fails in both attempts fails the job.
   - **Checks:** `run-sh-retry-fake-maestro.txt` is `run.sh ios` run locally with a fake
     Maestro:
     - always passing: 2 calls, exit 0;
     - failing once: retry, 4 calls, exit 0;
     - always failing: retry, 4 calls, exit 1.

     The run on CI (39112296433) shows the retry working.
   - **Docs:** `docs/testing.md` describes the retry and `tap-after-launch.yaml`, and
     says to look at the first attempt's output: a flow that keeps needing the retry is
     worth fixing.

## CI and e2e

| Platform | Run (521a853) | Result |
|----------|---------------|--------|
| iOS native | 39110184482 | 7/7 plus dark mode, first attempt |
| iOS native | 39112296433 | 7/7 plus dark mode, after one retry (C in Cold start) |
| iOS native | 39115304694 | 7/7 plus dark mode, first attempt |
| Android Expo Go | 39118334993 | 7/7 plus dark mode, no retry (Android has none) |
| Android native debug | 39118337273 | 7/7 plus dark mode |

Earlier, on 99b5974, iOS ran 39102492110 (failed with C), 39104764034 and
39107000102 (both 7/7). Android ran 39102497732 and 39102500758 (both 7/7).

Gates: 684/684 tests, plus lint, type-check, format and docs:check. CI, Audit and
CodeQL passed on 521a853.

Verdict: PASS.
