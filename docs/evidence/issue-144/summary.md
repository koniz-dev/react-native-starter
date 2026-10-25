# Issue 144: rewrite the README as a landing page with screenshots

Commits on `main`: da948c1 (the rewrite), then 1a3015a (the maintainer spotted repetition:
the Quick start note repeated the "Yours in one command" point and linked Getting Started
twice, and the first two "Why this starter" points repeated the What you get table).
Screenshots: orphan branch `readme-assets` at 7447c95.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Value statement, badges, screenshots, then features, stack, quick start, structure, quality gates, docs, support, license. | `github/github-readme-light.png`, `github/github-readme-dark.png` (the README as GitHub renders it at 1a3015a). | PASS |
| 2 | Screenshots from current `main` with the demo backends: iOS in light and dark mode, on the orphan branch `readme-assets`, not on `main`. (Amended with the maintainer's approval on 2026-10-25: Android and web dropped, see Notes.) | `readme-assets` 7447c95: four iOS screens and a README saying how they were taken (iPhone 16 Plus, iOS 18.6, Expo Go 57.0.9, `main` 1ecec29, JSONPlaceholder data, not e2e stubs). `actions-and-images.txt`: the four raw URLs return 200 `image/png`. `main` has no new files. | PASS |
| 3 | Claims match the code and the Support Policy; `format:check` and `docs:check` pass; CI green. | Checked before committing: CI and Audit triggers, coverage thresholds (`package.json`), CI steps (`.github/workflows/ci.yml`), versions; "typed routes" was dropped (not enabled), and "every push" became "every push to `main` and every pull request". Maestro is described as covering iOS and Android, not as running on every push (it's a manual workflow). Support: no upgrade dates (maintainers b944f26). Local gates at da948c1: lint, type-check, format, docs:check, 708 tests; at 1a3015a: lint, type-check, format, docs:check, the 167 script tests. `actions-and-images.txt`: CI, Audit and CodeQL green on both commits. | PASS |
| 4 | `init-project --remove-demo --remove-recipes` still replaces the README and passes every gate with no leftovers. | `init-project-clone.txt`: clean clone of da948c1; the README becomes "# Acme Notes" with no badge or `readme-assets` link; lint, type-check, format, docs:check exit 0; 579 tests; leftover `git grep` (now also for `readme-assets`) exit 1. 1a3015a changed only template README text that init-project replaces; the script tests (which run init-project and remove-demo on copies) pass on it. The screenshots sit in a `@demo` block, so `remove-demo` removes them too. | PASS |
| 5 | Rendered README checked on GitHub in light and dark mode. | `github/github-top-light.png`, `github/github-top-dark.png`: badges and the four framed screenshots load (`naturalWidth` 600) in both schemes. In the full-length shots, GitHub's sticky "README / MIT license" tab bar covers the What you get heading; that is the element screenshot stitching under a sticky header, not the README. | PASS |
| 6 | The maintainer approves the draft before it is pushed. | Approved on 2026-10-25 after reviewing local previews rendered with GitHub's Markdown API. The follow-up 1a3015a answers the maintainer's comment on the published page. | PASS |

## Notes

- **Android dropped.** In Expo Go on the Android emulator (`Medium_Phone_API_37.0`, Expo Go
  57.0.9) the developer-tools button stays over the content and the status bar is hidden;
  the button couldn't be turned off over adb (`unused-shots/android-expogo-home.png`). The
  e2e native-debug screenshots are 320×640, too small.
- **Web dropped.** The production web export was captured, signed in with the demo backend
  (`unused-shots/`, `tools/web-shots.js`), but at desktop width the screens are mostly
  empty space. The README says the same code runs on Android and the web.
- **iOS signed-in screens** weren't captured: the Simulator window wasn't reachable for
  input in this session, so the screens were opened by deep link only.
- **Images** are 600 px wide with rounded corners and a thin border
  (`readme-assets/tools/frame.swift`), so the white and the dark screens stand out on both
  GitHub themes.
- **On the SDK 58 merge** (`sdk-58`, #134), the README's Expo SDK badge and Tech stack row
  need SDK 58 and React Native 0.88, and the screenshots can be retaken the same way.

Verdict: PASS.
