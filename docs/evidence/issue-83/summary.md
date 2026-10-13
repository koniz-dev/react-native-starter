# Issue 83: lint, TypeScript, and build config (main 4adf01c)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Lint rejects boundary-crossing imports (@/ and relative), relative paths leaving the module, color literals in any form under *Color props in app/, features/, shared/ | `tests-before-after.txt`: __tests__/scripts/lintRules.test.ts (24 cases: 8 rejected imports, 5 allowed, 10 color forms in features/ and app/, theme color allowed, default export still rejected), 13+ fail on the old config | PASS |
| 2 | App code has no Node/Jest types; tests and scripts do; type-check runs both | `node-types-and-subdir-eslint.txt`: fs, Buffer, __dirname in features/ fail type-check; `tsconfig.tools.json`; `npm run type-check` = both projects | PASS |
| 3 | ESLint works from any directory | `node-types-and-subdir-eslint.txt`: `cd shared/config && npx eslint env.ts` exit 0 (tsconfigRootDir) | PASS |
| 4 | .gitignore, Jest config, app.config.ts | .gitignore: credentials.json, *.apk, *.aab, *.ipa; `usesNonExemptEncryption: false` with a test; transformIgnorePatterns kept on purpose: it is jest-expo's documented default, and removing the entries would break adopters who add those libraries | PASS |
| 5 | Docs gaps | App Config: EAS Build, the first time; development profile; encryption. Getting Started: tablets rotate; hosting the web export; scheduled workflows pausing after 60 days. Conventions: imports, types, colors | PASS |
| 6 | Gates, CI, e2e | `gates.log` (450 tests); CI green on 4adf01c; e2e in issue-85 | PASS |

Repository settings are left to the owner (listed in the closing comment): a ruleset requiring the Verify and Audit checks on main, Dependabot alerts, CodeQL default setup, and requiring SHA-pinned actions.
