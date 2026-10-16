# Issue #112: CodeQL high, cache poisoning in the iOS e2e workflow

**Fix:** 16cc770, with the process change in maintainers 7a3222e. An earlier attempt,
ee703e3, was not enough.

## Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `e2e-ios.yml` doesn't run untrusted code with the default branch's cache, and no other workflow checks out an input ref. | PASS | `fix.txt`: the `ref` input and `ref: ${{ inputs.ref }}` are removed, so the job runs only the ref it was dispatched on, and that ref has its own cache scope. `grep inputs.ref .github/workflows` finds nothing. |
| 2 | CodeQL closes alerts #2–#4 as fixed, and no code-scanning alert is open. | PASS | `alerts.txt`: the actions analysis gave `results=3` on cb566e4 and ee703e3, and `results=0` on 16cc770. #2–#4 are `fixed` at 19:18:24Z, the time of that analysis. The open counts are code-scanning 0, Dependabot 0, and secret-scanning 0. |
| 3 | E2E (iOS, manual) still passes 7/7 plus dark mode, and gates and CI are green. | PASS | `runs.txt`: run 38953873433 on 16cc770 passed 7/7 plus dark mode, and CI and Audit succeeded. Locally, format, docs:check, and the script tests (126) passed. |
| 4 | The release gate checks open security alerts before tagging. | PASS | In the maintainers branch README (Security section, commit 7a3222e), the three alert counts must be checked before a release and after any push that changes a workflow. |

## Notes

### Why criterion 1 changed

The issue first said the job should "no longer restore or save a cache". ee703e3 did
exactly that: it set `package-manager-cache: false`, which is needed because
setup-node turns on caching by itself when `package.json` names npm. CodeQL still
reported all three alerts on ee703e3. The rule's own help says why: any code the job
runs can use the job's cache token, so a run on `main` that checks out another ref can
poison `main`'s cache even when no cache step exists. The real fix is to never run
another ref's code in the default branch's context. So the input is gone, and
`cache: npm` is back, since the job now runs only trusted code from its own ref.

### What we lose

The `ref` input let us reproduce a bug on a commit from before the fix, as #101 did.
That now needs a branch at that commit which also has the workflow file:
`gh workflow run e2e-ios.yml --ref <branch>`. This is documented in
`docs/testing.md`.

### v1.1.12 shipped with these alerts

The alerts had been open since 2026-10-15, and the release check didn't include
security alerts. That check is the process change in criterion 4. The fix reaches
adopters only in a new release.

### Failed E2E iOS run on ee703e3

Run 38950010246 failed in flow 01 without any debug output, and Maestro reported
"number of flows (0)". The dark-mode flow in the same run passed, and the last
screenshot shows Home. This was the e2e harness failing, not the app.
