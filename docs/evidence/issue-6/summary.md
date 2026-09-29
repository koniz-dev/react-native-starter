# Evidence: issue #6 — fresh npm install fails (react-test-renderer peer conflict)

Fix: pinned `react-test-renderer` to exact `19.2.1` in `package.json`, matching the
pinned `react` version. Verified on a clean install (`rm -rf node_modules`).

| Criterion | Result | Artifact |
| --------- | ------ | -------- |
| 1. Clean `npm install` exits 0, no ERESOLVE, no `--force`/`--legacy-peer-deps` | PASS | `01-npm-install.log` (warnings only, no ERESOLVE) |
| 2. `npm ls react react-test-renderer` shows a satisfied peer tree, no invalid/UNMET | PASS | `02-npm-ls-peers.log` (`react-test-renderer@19.2.1`, `react@19.2.1`, all deduped) |
| 3. lint, `tsc --noEmit`, and `test:ci` all exit 0 | PASS | `03-lint.log`, `04-tsc.log`, `05-test-ci.log` (33/33 tests) |

Environment: macOS, npm on Node 18+, 2026-09-29.
