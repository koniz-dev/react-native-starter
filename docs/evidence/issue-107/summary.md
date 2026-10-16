# Issue #107: docs:check false reports for footnotes, setext headings, and parentheses

Fix: 53f6816 (`scripts/check-docs.js`, `__tests__/scripts/checkDocs.test.ts`).

## Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The test covers all three (no false report; a broken target with parentheses is still reported under its full name). Fails before, passes after. | PASS | `test-before.log`: the old parser reports `no heading for #setext-title`, `broken link forms-(draft`, and `broken link Footnote`. `test-after.log`: 2/2 pass. |
| 2 | `docs:check` on the repo still passes; gates and CI are green. | PASS | `gates.log`: 19 files, 41 snippets, "No problems.", 582/582 tests pass. CI on cb74c16. |

## The fix

- A `[^…]:` footnote definition is no longer read as a `[ref]: target` definition.
- `anchorsOf` gives an anchor to a heading underlined with `===` or `---`. The line
  above must be a paragraph line: not blank, not a list item, quote, or table row,
  and not inside a fence. GitHub treats such headings the same way.
- An inline link target may contain one level of balanced parentheses.
