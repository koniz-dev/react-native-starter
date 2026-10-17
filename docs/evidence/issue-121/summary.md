# Issue #121: init-project refused ZWJ emoji and Persian ZWNJ names; the check-docs tsc-silent rule was untested

Found in the confirmation audit of v1.1.13..main (2026-10-17) by auditors T and D2.

Fixes:
- a904c1c: init-project.
- 335bd08: the check-docs test and the signal name in its message.
- d091228: run.sh, lint, and the remove-demo and ATS notes.

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | ZWJ emoji, tag-character flags and ZWNJ names are accepted. Bidi controls, U+200B and U+FEFF are still refused. The tests fail before the fix and pass after. | PASS | `names-before.log` has 5 failures: `Dev 👩‍💻`, `🏳️‍🌈 Pride`, a subdivision flag, `یادداشت‌ها`, and the owner `حسن‌زاده`. `names-after.log`: 54/54, and U+202E, U+200E, U+2066, U+200B and U+FEFF are still rejected. |
| 2 | A test makes tsc exit non-zero with no output and asserts the message. With the rule removed, the test fails. A signal is reported by its name. | PASS | Through a `NODE_OPTIONS` preload that acts only in tsc, the test stops it in two ways: `process.exit(2)` and `SIGKILL`. `tsc-before.log`: the kill case said `exit null`. `tsc-with-rule-removed.log`: with the rule deleted, both tests fail. With the rule back, all 5 pass. |
| 3 | Items 3–9 are fixed or recorded. | PASS | See "Items 3–9" below. |
| 4 | Gates and CI are green. | PASS | `gates.log`: 662/662. CI, Audit, and e2e on all three platforms pass on d091228 (`e2e.txt`). |

## Items 3–9

- **Item 3:** the backend-port check in run.sh skips this run's mock URL.
- **Item 4:** run.sh restores Android's own night mode. A stub `adb` that reports
  `Night mode: auto` gets `uimode night auto` back at cleanup. It was not run on an
  emulator.
- **Item 5:** remove-demo's usage line no longer suggests a second `--`.
- **Item 6:** `global.process` is restricted, with a lint fixture.
- **Item 7:** `markdownText` escapes a leading `1.` or `-`.
- **Item 8:** the init-project test for a failing remove-demo now checks that the
  undo command (`checkout -- .`) is printed. That behavior existed before, so this
  test passes on the old code too.
- **Item 9:** the ATS note says to turn local networking off for the preview and
  production variants only.

`low-before.log`: the `global.process` and list-marker tests fail before the fix.
`low-after.log`: everything passes.

## Recorded, not changed

T's L5 is not changed: a heading anchor for a link URL containing `)`, or for an
image in a heading. Both are rare in headings.
