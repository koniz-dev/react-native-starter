# Issue 84: template scripts (main 166e270)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Tests reproduce each defect and pass after | `tests-before-after.txt`: the BEFORE (rerun) section runs the new tests against the old scripts with the new test helper: 4 fail (marker coverage, write failure, slug, restore hint); 108/108 pass after | PASS |
| 2 | A failure keeps the script, says how to restore; edits before deletes, self last | "keeps itself and the demo, and says how to restore, when a write fails" (read-only en.ts: EACCES message, no stack, script and demo still there) | PASS |
| 3 | Windows paths; every editable text file scanned | `windows-paths-simulation.log` (path.win32 harness `winsim-paths.js`): after the fix exit 0, demo gone, 0 files with @demo; before the fix, 11 problems; "removes marked blocks anywhere in the project" (testing/, .github/) | PASS |
| 4 | Script tests run without git | `testing/projectCopy.ts` falls back to a file walk; "lists the files of a project that is not a git repository"; node_modules linked as a junction | PASS |
| 5 | init: root-relative hint, stdin-only prompting, apostrophes | "after a failure on a clean tree, prints a restore command for the project root" (git -C "<root>"); `init-with-piped-output.log` (prompts with stdout piped to tee; before: "--name is required"); slugify tests (moms-recipes, bobs-app) | PASS |
| 6 | Gates, CI, post-init gates | `gates.log` (454 tests); CI green on 166e270; post-init in issue-87 | PASS |
