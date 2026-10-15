# Issue 104: docs:check coverage, doc corrections, same-feature imports (fix b3b1101)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Every form in the issue is reported | `checkDocs.test.ts` "checks every link form…": titled, `<angle>`, reference and HTML links, `.md#anchor` in inline code, `./` paths, `npm run-script`, `typescript` and `~~~` fences, an open fence, `.json` sources, a feature README; fails on the old script at the first form (`checkdocs-before.txt`) | PASS |
| 1b | False positives | `%20` targets are decoded (no report for `forms%20ok.md`); a ``` block inside a ```` fence is content. Anchors stay case-sensitive, as GitHub generates them lowercase; docs/README.md says to write them lowercase | PASS |
| 1c | Docs say what is checked | docs/README.md, scripts/README.md, check-docs.js header | PASS |
| 2 | Lint rejects `@/` within the same feature; SessionProvider fixed | `lintRules.test.ts` "its own feature through @/"; conventions.md. Scoped to features: shared/ snippets in the docs are compiled outside the tree and must use `@/` | PASS |
| 3 | Doc fixes | normalizeUser comment; `login.error.usernameRequired`; test env log level (Testing, Environment Variables); `testing/` tree; audit:check scope and rules (Getting Started, scripts/README.md) | PASS |
| 4 | Gates and CI | 564 tests, docs:check 45 snippets; CI green on b3b1101 | PASS |
