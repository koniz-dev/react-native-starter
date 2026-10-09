# Issue 40 verification — state-management recipes instead of stale branches

Verified on 2026-10-09. Criterion 3 (removing the branches from the remote)
is **not done**; see below.

## Change

- **`docs/recipes/state-management.md`**: Zustand, Redux Toolkit, Jotai, and
  React Context on top of the current `main`.
  - Every recipe builds the same example: a set of favorite IDs, reset when
    the session becomes `signedOut` (sign-out or an expired session).
  - The rules are the same for all four: the session stays in
    `SessionProvider` and is read with `useSession()`; the token never leaves
    the token store; only non-secret data is persisted.
  - Install commands, where each piece goes in `app/_layout.tsx`, testing
    notes (including the Jest `transformIgnorePatterns` entries that Jotai 3
    and Redux Toolkit need), and a note that the old branches are
    unmaintained.
- **`npm run docs:check`**:
  - covers `docs/` subfolders;
  - supports `<!-- docs-check: requires pkg -->` before a block. Such blocks
    compile when the packages are installed and are skipped with a note
    otherwise.
  - CI's docs step, now last, runs `npm install --no-save zustand@5
@reduxjs/toolkit@2 react-redux@9 jotai@3` first, so every run compiles
    all four recipes against the libraries' current releases.
- **README**: the state-management section (branch descriptions, links to the
  closed PRs #2–#5, and checkout instructions) was already cut to a short note
  in #39; it now points to the recipe. `docs/README.md` lists it.
- **AGENTS.md and the issue workflow**: they no longer cite the branches as an
  example. The `epic:state` label description is now "State management:
  session provider and recipes" (bootstrap script run).

## Acceptance criteria

| #   | Criterion                                                                                                                                            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Result      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| 1   | Recipes for Zustand, Redux Toolkit, Jotai, React Context on current `main` (session provider, secure token), verified by compiling in a scratch copy | [01-recipes-compile.log](01-recipes-compile.log): scratch copy with the four libraries installed, all 35 doc snippets incl. the 4 recipes compile (`tsc` exit 0); [02](02-recipes-runtime.log): the extracted recipe code runs against the real `SessionProvider`, and each store toggles and resets on sign-out (test file: [02-recipes-runtime.test.tsx.txt](02-recipes-runtime.test.tsx.txt)); [03](03-recipes-type-probe.log): planted type errors in the Redux and Jotai recipes fail the check; [04](04-recipes-reset-mutation.log): without the reset, the Zustand test fails | PASS        |
| 2   | README section replaced by a short pointer; no links to closed PRs or stale branches                                                                 | `README.md` "State management"; `docs:check` passes ([05](05-docs-check-repo.log)); the only remaining mention of the branches is the "not maintained" note in the recipe                                                                                                                                                                                                                                                                                                                                                                                                            | PASS        |
| 3   | Branches deleted from the remote or archived as tags `archive/state-management-*`, after the owner confirms                                          | The owner approved in the session, but the agent's command to tag and delete was refused by the environment's safety policy (destructive git operation). The branches are still on `origin` ([10](10-remote-state.log)); the commands for the owner are in the issue                                                                                                                                                                                                                                                                                                                 | **Pending** |
| 4   | Gates pass locally and in CI                                                                                                                         | [06 lint](06-lint.log), [07 tsc](07-type-check.log), [08 tests](08-test-ci.log) (199, coverage threshold met), [09 format](09-format-check.log); CI run in the issue comment                                                                                                                                                                                                                                                                                                                                                                                                         | PASS        |
