# Agent Instructions

## Issue workflow

GitHub issues are the single source of truth for work in this repository. Read
[docs/issue-workflow.md](docs/issue-workflow.md) before selecting or changing an
issue; it is the authoritative lifecycle and command reference.

- Work ships directly to `main` in small, reversible, single-issue commits.
- Choose the highest-priority open `status:todo` issue. If none exists, triage one
  Backlog issue only after it has a type, epic, priority, and an exact
  `## Acceptance criteria` heading in its body.
- Claim by self-assigning and changing `status:todo` to `status:in-progress`, then
  re-read the issue. If another agent won the claim, unassign yourself and select the
  next issue.
- An open triaged issue must have exactly one `status:*` label. Move between states;
  never leave an open issue without a state label.
- Use `Refs koniz-dev/react-native-starter#N` in every related commit. Never use
  `Fixes`, `Closes`, or `Resolves`, because closing occurs only after verification.
- If blocked, add a comment stating exactly what is needed, move it to
  `status:blocked`, and unassign. Use `status:needs-uat` only for acceptance steps an
  agent genuinely cannot drive; give the human exact verification steps.
- Labels are authoritative. A GitHub Project or board, if present, is a read-only
  mirror and must not drive issue state.

## Verification and closure

Run `npm run lint`, `npm run type-check`, and `npm run test:ci` for every change.
Jest + React Native Testing Library is this repo's closest automated acceptance
harness; there is no committed browser or native-device e2e harness. Use a web export
and browser automation only when available, and send native interactions, device
rendering, visual-polish judgement, secrets-dependent flows, and store/EAS work to
human UAT.

Before a PASS, run every acceptance criterion and save retrievable evidence under
`docs/evidence/issue-<N>/`. Commit the evidence, open and inspect every log or
screenshot yourself, post a PASS summary linking it, and only then close the issue.
Never repeat a subagent's PASS without inspecting the artifacts yourself.

## Taxonomy source

`scripts/bootstrap-issue-labels.sh` is the canonical source of the `epic:*` list.
Change it first when the taxonomy changes, rerun it, and then synchronize
`docs/issue-workflow.md`. GitHub native issue types are a repository setting, not
labels; use the documented type labels where native types are unavailable.
