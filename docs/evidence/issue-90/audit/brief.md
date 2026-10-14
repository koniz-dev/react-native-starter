# Deep audit brief (round 4)

Repo: /Users/nguyenanhkiet/Playground/react-native-starter (koniz-dev/react-native-starter, main @ e4742f2).
An Expo SDK 57 / React Native 0.86 starter TEMPLATE: people clone it, run `npm run init` (scripts/init-project.js)
and optionally `npm run remove-demo`, then build their app on it. Read AGENTS.md first: it is the contract.
Three earlier audits already fixed a lot; look for what they missed. Quality bar: a production template
that must have no risk and no gaps.

## Rules (hard)
- READ-ONLY on the repo: never edit, stage, commit, checkout, stash, or reset in
  /Users/nguyenanhkiet/Playground/react-native-starter. For experiments, copy what you need into YOUR folder
  (`git -C <repo> archive HEAD | tar -x -C <yourdir>/repo` then symlink node_modules:
  `ln -s /Users/nguyenanhkiet/Playground/react-native-starter/node_modules <yourdir>/repo/node_modules`).
- Write only inside YOUR folder (given below). Never delete anything outside it. Never `rm -rf $VAR/...`; use literal paths.
- Node 24: export PATH=/private/tmp/claude-501/-Users-nguyenanhkiet-Playground-react-native-starter/af240f43-5faf-4dd2-b463-4799602502e7/scratchpad/node-v24.21.0-darwin-x64/bin:$PATH
- No network installs, no `curl|bash`, no pushing, no gh writes. Read-only `gh` is fine.
- Don't start simulators/emulators.

## What to do
1. Read EVERY file in your files.txt completely (all lines; for package-lock.json use targeted queries/npm ls).
   After each, append a line to <yourdir>/coverage.txt: `<path>\t<lines read>\t<one-line verdict>`.
   Coverage must list every path in files.txt.
2. Look for: real bugs, races, security/privacy risks, wrong error handling, a11y, platform (iOS/Android/web)
   differences, behavior that contradicts AGENTS.md or the docs, dead code/exports, tests that don't
   test what their name says (would they fail if the code broke?), missing tests for real behavior,
   template-user pitfalls (after init / remove-demo), stale versions/config, inconsistencies across files.
   Cross-reference files outside your scope when needed (read them), but report findings on your scope.
3. VERIFY each finding with evidence: a failing test/script you ran in your copy, a command output, or
   exact quoted lines. Drop anything you can't substantiate. Do not report style nits or matters of taste
   unless they break a stated convention. Say explicitly if something was considered and is fine.
4. Write <yourdir>/findings.md: for each finding: id, severity (high/medium/low), file:line, the defect,
   concrete failure scenario, evidence (commands + output, repro file paths in your folder), suggested fix.
   End with a "Checked and fine" list of the risky areas you examined that hold up.
5. Final reply to me: the findings list (short), and confirm coverage.txt line count == files.txt line count.
