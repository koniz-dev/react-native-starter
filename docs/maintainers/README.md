# Maintainers

> For maintainers of the starter itself; delete in your project.
> [`scripts/maintainer-files.json`](../../scripts/maintainer-files.json) lists
> every file to delete.

This folder is the process for developing **the starter**, the upstream
repository `koniz-dev/react-native-starter`. It applies only when
`git remote get-url origin` points at that repository. In any other
repository (a project made from the template, or a fork that builds an app),
ignore this folder and follow [`AGENTS.md`](../../AGENTS.md) alone.

Agents working on the starter itself follow `AGENTS.md` (how the code is
built) **and** this page (how work is tracked, verified, and released).

- [Issue Workflow](issue-workflow.md): labels, lifecycle, invariants, the
  agent loop, `gh` recipes, and the evidence branch.
- [Release Gate](release-gate.md): MVP readiness, maintenance mode, and what
  verification covers.
- [Dependency Review](dependency-review.md): the starter's review of the
  advisories in `scripts/audit-allowlist.json`.
- [`scripts/maintainers/bootstrap-issue-labels.sh`](../../scripts/maintainers/bootstrap-issue-labels.sh):
  creates the label taxonomy; the canonical `epic:*` list.

## Project goal

The product is a **trustworthy, documented React Native starter**, not a
finished app. The target is the MVP release gate, then maintenance mode, both
defined in [Release Gate](release-gate.md). Judge every issue, UAT finding,
and "can we accept this?" question against that gate:

- Baseline flows must work end to end on every advertised platform: initial
  navigation, light/dark theming, API loading/error/retry, and the auth
  example including logout and session persistence. A missing piece of these
  is a defect, not an acceptable limitation.
- Positioning: production-ready by configuration, not by installation;
  vendor-neutral seams with no-op/console defaults; the starter ships no
  credentialed third-party services, so UAT verifies seams and defaults only
  (see [Verification scope](release-gate.md#verification-scope)).
- MVP readiness is declared only through a dedicated release-readiness issue
  with PASS evidence; closed issues and green tests alone never establish it.
- What ships on `main` is for adopters. Maintainer-only material lives in this
  folder (or `scripts/maintainers/`) and is listed in
  `scripts/maintainer-files.json`; add any new maintainer-only file there.
- Before citing another issue's state (e.g. "tracked in #N"), re-check it
  with `gh`; comments go stale.

## Workflow

GitHub issues are the single source of truth for all work. Full spec,
invariants, and `gh` recipes: [Issue Workflow](issue-workflow.md).

- Work ships directly to `main` in small, reversible, single-issue commits.
- Pick the highest-priority open `status:todo` issue (P0 first, then lowest
  number). If the queue is empty, triage exactly one Backlog issue (open, no
  `status:*` label) in, only after it has a type, epic, priority, and an
  exact `## Acceptance criteria` heading in its body.
- Claim: self-assign, swap `status:todo` for `status:in-progress`, then
  re-read the issue to confirm you won any race with a concurrent session;
  release and take the next one if not.
- Commit messages carry `Refs koniz-dev/react-native-starter#N`. Never use
  `Fixes`/`Closes`/`Resolves`: auto-close would bypass the verification gate.
- Close only after running the acceptance criteria and committing evidence
  (see below). Criteria an agent cannot drive go to `status:needs-uat` with a
  comment telling the human exactly what to check. Stuck or needs a decision:
  `status:blocked` with a comment, unassign.
- Every triaged open issue carries exactly one `status:*` label at all times.
  Labels are the source of truth; any board is a read-only mirror.
- One issue at a time.

The canonical epic list lives in `scripts/maintainers/bootstrap-issue-labels.sh`
(the `epic:*` labels). Change it there first, run the script, then update the
table in [Issue Workflow](issue-workflow.md#label-taxonomy). GitHub native
issue types are a repository setting, not labels; use the documented type
labels where native types are unavailable.

## Acceptance verification

How to drive acceptance criteria, in order of preference:

1. **Toolchain criteria** (scripts, config, lint/type/test behavior): run the
   command the criterion names and capture the output. Gate for every change:
   `npm run lint && npm run type-check && npm run test:ci`, plus
   `npm run format:check` and `npm run docs:check` when docs change.
2. **Behavioral criteria** (component renders X, hook returns Y, service
   handles Z): write or run a Jest + React Native Testing Library test in
   `__tests__/` that performs the criterion's steps, and capture the run
   output.
3. **App-level smoke criteria** (route exists, app builds and serves for
   web): `npx expo export --platform web` produces `dist/`; serve it and fetch
   the route. A browser agent, when one is available in the session, can drive
   the served web build for on-screen assertions and screenshots.
4. **Native flows**: the Maestro flows in `.maestro/` (`npm run test:e2e:ios`,
   `npm run test:e2e:android`, or the manual `e2e-android` workflow); see
   [Testing](../testing.md#end-to-end-flows-maestro).

What this tooling **cannot** verify; route these criteria to
`status:needs-uat` unless the session has a working simulator or emulator
harness:

- Anything on a real device or simulator that the e2e flows don't cover:
  native gestures, hover/long-press feel, keyboard behavior, safe areas on
  notched hardware, storage on device.
- Platform-specific rendering differences (iOS vs Android vs web); the web
  build is not proof of native rendering.
- Visual polish judgments (spacing "looks right", animations feel smooth,
  dark-mode aesthetics beyond token correctness).
- Push notifications, deep links from cold start, app-store/EAS build and
  submit flows, and anything requiring secrets not present in `.env`. Criteria
  that need credentials the repository doesn't have are out of scope rather
  than `status:needs-uat`; verify the seam and its default instead.

## Evidence discipline

- Persist artifacts as committed files under `docs/evidence/issue-<N>/` on the
  **`evidence` branch** (an orphan branch with evidence only), never on
  `main`: "Use this template" copies `main`, and adopters must not inherit
  this repository's evidence. Recipe:
  [Commit evidence](issue-workflow.md#commit-evidence-to-the-evidence-branch).
  A link to a CI run or a claim in a comment is not evidence; the file must be
  retrievable from the repository (on the `evidence` branch).
- Before writing PASS, actually open each artifact (read the log, view the
  screenshot) and confirm it shows the asserted behavior. A screenshot of the
  wrong screen or a log with a swallowed error is a FAIL you have not noticed
  yet.
- Never relay a subagent's PASS you have not inspected yourself. Subagents
  report optimistically; the closing session owns the verdict.
