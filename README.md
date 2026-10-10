# Verification evidence

This branch holds the verification evidence for
[koniz-dev/react-native-starter](https://github.com/koniz-dev/react-native-starter)
issues: logs, screenshots, test output, and each issue's `summary.md`. It is
an orphan branch with no code, kept apart from `main` so that projects made
with "Use this template" (which copies the default branch) don't inherit it.

- `docs/evidence/issue-<N>/`: the evidence for issue N. Start with its
  `summary.md`.
- Links to code or docs use GitHub URLs pinned to the commit that was
  verified, because `main`'s files are not on this branch.
- `tools/check-links.js`: checks that every relative link resolves on this
  branch (`node tools/check-links.js`).

## Adding evidence

The maintainer process on `main`
([`docs/maintainers/`](https://github.com/koniz-dev/react-native-starter/tree/main/docs/maintainers))
describes when evidence is needed. To add
it, from a clone of the repository:

```bash
git fetch origin evidence
git worktree add ../rns-evidence evidence    # once; reuse it afterwards
cd ../rns-evidence && git pull --ff-only
mkdir -p docs/evidence/issue-<N>
# copy logs and screenshots in, write summary.md
node tools/check-links.js
git add docs/evidence/issue-<N>
git commit -m "docs: record the evidence for issue <N>" -m "Refs koniz-dev/react-native-starter#<N>"
git push origin evidence
```

Link it from the issue as
`https://github.com/koniz-dev/react-native-starter/tree/evidence/docs/evidence/issue-<N>`.

Evidence moved here from `main` on 2026-10-10 (issue #45); its history on
`main` (up to `e4d7a94`) is unchanged.
