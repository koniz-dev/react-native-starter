# Issue 148: minimatch GHSA-g3hv-75wg-m249 (moderate) through new SDK 58 paths

Dependabot alert #11 opened on 2026-11-06 at 19:49Z, after the SDK 58 merge (#135, 28fac1a).
The advisory is a denial of service through a crafted glob pattern ("globparts
amplification"); affected `>= 7.0.0, < 11.0.1`, patched 11.0.1. Alert #10, the same
advisory on the SDK 57 tree, was dismissed in #146 and is now reported as withdrawn.

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Where each copy runs; whether the vulnerable code is reached | `npm-ls-minimatch.txt` (clean clone of 28fac1a, Node 24.21.0, `npm ci`) and `exposure.txt`. See below. | PASS |
| 2 | Fix within the parents' ranges | 11.0.1 is outside every parent's range: `^10.2.2` (`@expo/fingerprint`, `glob` 13, `test-exclude` 7, `@typescript-eslint/typescript-estree`) and `^9.0.4` (`glob` 10). `npm audit` offers only downgrades (`expo@52`, `jest@25`). | PASS (no fix) |
| 3 | Alert dismissed with a reason and a linked comment; 0 open Dependabot alerts | `dependabot-dismissal.txt` | see that file |

Where the affected copies run (all on the developer's or CI machine, with patterns the
project writes):

- **minimatch 10.2.6**
  - `@expo/fingerprint` (`utils/Path.js`): matches the project's files against
    Expo's built-in ignore list and the project's `.fingerprintignore`, when a native
    build or an update computes the project's fingerprint.
  - `@expo/cli` > `glob` 13: the CLI's own patterns over the project's files.
  - Jest 30's `babel-plugin-istanbul` 8 > `test-exclude` 7: coverage include and exclude
    patterns from the Jest config.
  - `@typescript-eslint/typescript-estree` (`useProgramFromProjectService.js:244`): the
    ESLint config's `allowDefaultProject` patterns.
- **minimatch 9.0.9:** Jest 30 and jest-expo 58, through `test-exclude` 7 > `glob` 10
  (coverage).

None of them takes a pattern from outside the project. Neither copy is in the app: a search
of the web export and the iOS and Android production bundles for `minimatch`, `globParts`
and `braceExpand` finds nothing (`exposure.txt`). The 3.1.5 copies (ESLint, Jest 29 under
`@react-native/jest-preset`) are outside the affected range.

Decision: tolerable risk, as for #10 in #146.
