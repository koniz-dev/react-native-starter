# Issue 45 verification — evidence moved off main to the evidence branch

Verified on 2026-10-10.

## Change

- **`evidence` branch** (orphan, pushed to origin; first commit `2152576`):
  - all 558 evidence files from `main` at `e4d7a94`, at the same paths
    (`docs/evidence/issue-<N>/`);
  - a `README.md` explaining the branch and how to add evidence;
  - `tools/check-links.js`, which checks that every relative link resolves on
    the branch.
- **Links into `main`.** Relative links in the evidence that pointed into
  `main`'s docs (14, all in issue 26's `release.md` and `summary.md`) now use
  GitHub URLs pinned to the verified commit. Issue 26 is pinned to the
  `v1.0.0-mvp` commit `f3f4bd7`. Other folders had no such links. Apart from
  those two files, every file is byte-identical to `main`'s copy.
- **`main`** ([`be8da85`](https://github.com/koniz-dev/react-native-starter/commit/be8da8509a9f728dbef5c8ba6219fb568bbb3fb2),
  [`ad2a8a8`](https://github.com/koniz-dev/react-native-starter/commit/ad2a8a8)):
  - `docs/evidence/` is removed.
  - `CLAUDE.md`, `AGENTS.md`, and `docs/issue-workflow.md` say evidence goes
    to the `evidence` branch. `docs/issue-workflow.md` has a new section,
    "Commit evidence to the evidence branch": a worktree recipe for Git 2.39+,
    how to link files, and the issue link format.
  - `docs/testing.md`, `docs/remove-demo.md`, and
    `scripts/audit-allowlist.json` link evidence on the branch.
  - `eslint.config.js` and `scripts/check-docs.js` drop their
    `docs/evidence` special cases. `.prettierignore` never had one.

## Acceptance criteria

| #   | Criterion                                                      | Evidence                                                                                                                                                                                                                                                                                                                                                        | Result |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Orphan `evidence` branch with all evidence, same paths; README | Branch on origin. Same 558 paths as `main` at `e4d7a94` and identical contents except the two rewritten files (compared with `diff` and `cmp` before the move). [README](https://github.com/koniz-dev/react-native-starter/blob/evidence/README.md)                                                                                                             | PASS   |
| 2   | `main` has no `docs/evidence/`; references updated             | [02](02-clone-after.log): 0 files under `docs/evidence`. `git grep "docs/evidence\|evidence/issue"` on `main` finds only the branch URLs and the `issue-<N>` placeholders in the workflow docs. The ESLint and docs-check special cases are removed.                                                                                                            | PASS   |
| 3   | Relative links rewritten; link check on the branch clean       | [12](12-evidence-branch-links.log): 448 relative links in 44 files, 0 problems (after the move). Pinned and branch URLs exist: [04](04-url-check-api.log), via the GitHub API. Unauthenticated page fetches got 503s from GitHub: [03](03-url-check.log), kept for the record.                                                                                  | PASS   |
| 4   | Workflow docs updated with the recipe and link format          | `CLAUDE.md` "Evidence discipline", `AGENTS.md`, `docs/issue-workflow.md#commit-evidence-to-the-evidence-branch` (on `main`)                                                                                                                                                                                                                                     | PASS   |
| 5   | This issue's evidence committed with the documented recipe     | [13](13-recipe-trial.log): the recipe run from the main checkout (`git fetch`, `git worktree add ../rns-evidence evidence`, copy, `check-links`, `add`, `commit`, `push`)                                                                                                                                                                                       | PASS   |
| 6   | "Use this template" copy has no evidence; before/after         | A shallow clone of the default branch (the files "Use this template" copies; creating a real repository from the template is left to #48): [01 before](01-clone-before.log) 692 files, 558 under `docs/evidence`, 24.3 MB working tree, 42.5 MB on disk; [02 after](02-clone-after.log) 134 files, 0 under `docs/evidence`, 1.3 MB working tree, 1.8 MB on disk | PASS   |
| 7   | Gates pass; CI green                                           | [05 lint](05-lint.log), [06 type-check](06-type-check.log), [07 test:ci](07-test-ci.log), [08 format](08-format-check.log), [09 docs:check](09-docs-check.log) (recipe libraries installed, as CI does), [10 audit:check](10-audit-check.log); CI run 38042047311 on `ad2a8a8`: [log](11-github-actions-ci-38042047311.log)                                     | PASS   |
