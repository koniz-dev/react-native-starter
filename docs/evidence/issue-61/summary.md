# Issue 61 verification — the maintainer process moves off `main`

Verified on 2026-10-11 on `main` at
[`1431842`](https://github.com/koniz-dev/react-native-starter/commit/1431842).
The branch `maintainers` is at `3e68d6d`.

## Change

- **`maintainers` (a new orphan branch)** has the process pages at its root:
  `README.md`, `issue-workflow.md`, `release-gate.md`,
  `dependency-review.md`, `support-policy.md`, and
  `scripts/bootstrap-issue-labels.sh`. Links to `main` are absolute URLs.
  - Its README explains how to use the branch: a worktree, and an untracked
    `CLAUDE.local.md` pointer for agents.
  - The monthly review is now opened on request, with the checklist in
    `dependency-review.md`. Each allowlist entry's `reviewBy` stays the hard
    deadline.
- **`koniz-dev/.github` (a new public repository)** holds `SECURITY.md`,
  which GitHub applies to the account's repositories.
- **`main` loses:**
  - `docs/maintainers/`, `scripts/maintainers/`,
    `scripts/maintainer-files.json`, `.github/SECURITY.md`,
    `.github/workflows/dependency-review.yml`, and the `@maintainer` block in
    `AGENTS.md`;
  - the maintainer-file handling in `scripts/init-project.js` and
    `scripts/check-docs.js`, and in their tests;
  - the doc lines about deleting maintainer files.

## Acceptance criteria

| #   | Criterion                                                                                                 | Evidence                                                                                                                                                                                                                                                                                                                                                        | Result |
| --- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `main` has no maintainer-only file or block                                                               | [main-tree.log](main-tree.log): `git ls-tree -r origin/main` has none of the names (exit 1), and `git grep -i maintainer origin/main` matches nothing (exit 1)                                                                                                                                                                                                  | PASS   |
| 2   | The process is preserved on `maintainers` and updated; its README explains its use                        | [maintainers-branch-files.txt](maintainers-branch-files.txt) lists the files. See the [branch README](https://github.com/koniz-dev/react-native-starter/blob/maintainers/README.md) ("Using this branch") and the [dependency review](https://github.com/koniz-dev/react-native-starter/blob/maintainers/dependency-review.md) (on request, with the checklist) | PASS   |
| 3   | No maintainer-file code left in `init-project`, `check-docs`, or the tests; init still leaves no identity | The diff of `1431842`. [gate-test-ci.log](gate-test-ci.log): 277 tests, including the init-project test with its leftover-identity grep                                                                                                                                                                                                                         | PASS   |
| 4   | The security policy still works; private reporting stays enabled                                          | [security-policy.log](security-policy.log): `isSecurityPolicyEnabled: true` for react-native-starter; its own `.github/SECURITY.md` returns 404, so the policy comes from `koniz-dev/.github/SECURITY.md`; private vulnerability reporting is `enabled: true`                                                                                                   | PASS   |
| 5   | A fresh "Use this template" copy has none of these files                                                  | "Use this template" copies the tree of the default branch (`main`), and other branches only if "Include all branches" is ticked. [main-tree.log](main-tree.log) lists that top-level tree, and criterion 1 shows the full tree has no maintainer file. No temporary repository was created                                                                      | PASS   |
| 6   | Gates pass; CI green                                                                                      | [lint](gate-lint.log), [type-check](gate-type-check.log), [format:check](gate-format-check.log), [docs:check](gate-docs-check.log), [test:ci](gate-test-ci.log). CI run 38151672664 on `1431842`: success ([log](github-actions-ci-38151672664.log))                                                                                                            | PASS   |
