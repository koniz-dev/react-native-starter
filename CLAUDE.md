# CLAUDE.md

Expo / React Native starter (Expo Router, TypeScript strict, React Native Paper,
Jest + React Native Testing Library). Single repo; work ships directly to `main` in
small, single-issue commits.

## Project goal

The product is a **trustworthy, documented React Native starter**, not a finished app.
The target is the MVP release gate, then maintenance mode, both defined in
[AGENTS.md](AGENTS.md#mvp-and-maintenance-readiness). Judge every issue, UAT finding,
and "can we accept this?" question against that gate:

- Baseline flows must work end to end on every advertised platform: initial
  navigation, light/dark theming, API loading/error/retry, and the auth example
  including logout and session persistence. A missing piece of these is a defect,
  not an acceptable limitation.
- MVP readiness is declared only through a dedicated release-readiness issue with
  PASS evidence; closed issues and green tests alone never establish it.
- Before citing another issue's state (e.g. "tracked in #N"), re-check it with `gh`;
  comments go stale.

## Workflow

GitHub issues are the single source of truth for all work. Full spec, invariants, and
`gh` recipes: [docs/issue-workflow.md](docs/issue-workflow.md).

- Pick the highest-priority open `status:todo` issue (P0 first, then lowest number). If
  the queue is empty, triage exactly one Backlog issue (open, no `status:*` label) in.
- Claim: self-assign, swap `status:todo` for `status:in-progress`, then re-read the
  issue to confirm you won any race with a concurrent session; release and take the
  next one if not.
- An issue is startable only if its body has a `## Acceptance criteria` section.
- Commit messages carry `Refs koniz-dev/react-native-starter#N`. Never use
  `Fixes`/`Closes`/`Resolves` — auto-close would bypass the verification gate.
- Close only after running the acceptance criteria and committing evidence
  (see below). Criteria an agent cannot drive go to `status:needs-uat` with a comment
  telling the human exactly what to check. Stuck or needs a decision: `status:blocked`
  with a comment, unassign.
- Every triaged open issue carries exactly one `status:*` label at all times. Labels are
  the source of truth; any board is a read-only mirror.
- One issue at a time. Small, revertible commits.

The canonical epic list lives in `scripts/bootstrap-issue-labels.sh` (the `epic:*`
labels). Change it there first, run the script, then update the table in
docs/issue-workflow.md.

## Acceptance verification

How to drive acceptance criteria in this repo, in order of preference:

1. **Toolchain criteria** (scripts, config, lint/type/test behavior): run the command
   the criterion names and capture the output.
   Gate for every change: `npm run lint && npx tsc --noEmit && npm run test:ci`.
2. **Behavioral criteria** (component renders X, hook returns Y, service handles Z):
   write or run a Jest + React Native Testing Library test in `__tests__/` that performs
   the criterion's steps, and capture the run output. This is the closest thing this
   repo has to an e2e harness.
3. **App-level smoke criteria** (route exists, app builds and serves for web):
   `npx expo export --platform web` produces `dist/`; serve it
   (`npx serve dist`) and fetch the route. A browser agent, when one is available in
   the session, can drive the served web build for on-screen assertions and
   screenshots.

What this tooling **cannot** verify — route these criteria to `status:needs-uat`:

- Anything on a real device or simulator: native gestures, hover/long-press feel,
  keyboard behavior, safe areas on notched hardware, AsyncStorage on device, Expo Go.
- Platform-specific rendering differences (iOS vs Android vs web); the web build is not
  proof of native rendering.
- Visual polish judgments (spacing "looks right", animations feel smooth, dark-mode
  aesthetics beyond token correctness).
- Push notifications, deep links from cold start, app-store/EAS build and submit flows,
  and anything requiring secrets not present in `.env`.

Evidence discipline:

- Persist artifacts as committed files under `docs/evidence/issue-<N>/` (logs,
  screenshots, test output). A link to a CI run or a claim in a comment is not
  evidence; the file must be retrievable from the repo.
- Before writing PASS, actually open each artifact — read the log, view the
  screenshot — and confirm it shows the asserted behavior. A screenshot of the wrong
  screen or a log with a swallowed error is a FAIL you have not noticed yet.
- Never relay a subagent's PASS you have not inspected yourself. Subagents report
  optimistically; the closing session owns the verdict.
