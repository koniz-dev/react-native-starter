# Issue 12 verification

Verified 2026-10-03.

- `hooks/useThemeColor.ts`, `components/ThemedText.tsx`, and
  `components/ThemedView.tsx` now exist for the local imports shown in docs.
- `scripts/README.md` documents only the committed
  `bootstrap-issue-labels.sh`; it explicitly states that no destructive
  `reset-project` command ships.
- `rg -n 'reset-project' hooks components scripts docs --glob '*.md'` returns
  only that explicit non-shipped-command notice.
- `npm run lint`, `npm run type-check`, `npm run test:ci` (6 suites / 40
  tests), and `npm run format:check` pass.
