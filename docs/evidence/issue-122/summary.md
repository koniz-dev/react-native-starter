# Issue #122: the invisible-character denylist let format characters through; run.sh restore and mock-URL follow-ups

Found in the second confirmation audit (c03d8df..main, 2026-10-17) by auditor Y.
These are regressions from #121.

Fixes:
- a48bfd9: init-project.
- 59b1965: run.sh.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | All `\p{Cf}` characters are refused except U+200C, U+200D and U+E0020–U+E007F. The legitimate names from #121 are still accepted. U+2060, U+00AD, U+180E and U+FFF9 are refused. The tests fail before the fix. | PASS | `names-before.log`: 5 failures (U+2060 in a name and in an owner, U+00AD, U+180E, U+FFF9). `names-after.log`: 59/59, with the ZWJ emoji, the flag and the Persian names still accepted. ESLint's no-misleading-character-class rejected a joiner inside a character class, so the exceptions are written as a lookahead alternation. |
| 2 | An empty or failing read falls back to light mode. | PASS | run.sh sets `WAS_MODE="${WAS_MODE:-no}"`. Auditor Z ran this under bash 3.2 with `set -euo pipefail`: with no device, the read is empty, falls back to `no`, and the script doesn't exit. |
| 3 | The mock skip compares host and port, and ignores a trailing slash. | PASS | `is_mock_url` matches `http://127.0.0.1:9999`, `http://localhost:9999/` and `http://localhost:9999/v1`, and not other hosts or ports. Checked by extracting the function from run.sh, and again by auditor Z. |
| 4 | Gates and CI are green. | PASS | `gates.log`: 667/667 at 59b1965. CI is green, and e2e passes on all three platforms on 36ef2d9 (see #123). |

## Recorded, not changed

Auditor Z's L3, from the third confirmation audit, is recorded and left unchanged.

- **What it is:** joiners and tag characters are accepted anywhere in a name, not only inside emoji. So `Acme` plus a tag space plus `Notes` passes. It displays as "AcmeNotes" and slugifies to `acme-notes`. A run of tag characters can also hide ASCII text in the README or the LICENSE owner.
- **Why it stays:** the value is the adopter's own CLI input, so the only way in is pasted text. Allowing tag characters only inside flag sequences would bring back a structural check of the kind that has caused regressions twice in this series.
- **Another niche case:** U+180E (the Mongolian vowel separator) is now refused.
