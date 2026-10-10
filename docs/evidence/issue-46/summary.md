# Issue 46 verification — adopter-facing agent instructions and docs

Verified on 2026-10-10 on `main` at
[`07db8e3`](https://github.com/koniz-dev/react-native-starter/commit/07db8e3dc1f95d2671edcd4d1d8d34cc0cfb0223).

## Change

- **`AGENTS.md`** is rewritten for whoever builds an app from the starter. It
  covers project structure, conventions, how to add a feature, route,
  endpoint, sign-in adapter, or provider, config and env rules, the gates,
  design principles, and a docs map.
- **`CLAUDE.md`** imports `AGENTS.md` (`@AGENTS.md`), so Claude Code and other
  agents read the same instructions.
- **The maintainer process** lives in one place:
  - `docs/maintainers/` holds `README.md` (the guard, project goal, workflow,
    acceptance verification, evidence discipline), `issue-workflow.md` (moved
    from `docs/`), `release-gate.md` (verification scope, MVP and maintenance
    readiness, from the old `AGENTS.md`), and `dependency-review.md` (the
    starter's audit review and #43).
  - `scripts/maintainers/bootstrap-issue-labels.sh` is moved from `scripts/`.
  - Every page carries "For maintainers of the starter itself; delete in your
    project."
- **`scripts/maintainer-files.json`** lists the maintainer files and the
  marked block in `AGENTS.md`, for the init script in #47.
- **`scripts/audit-allowlist.json`** keeps its two entries, which are about
  the starter's own dependency tree and which adopters inherit. The
  repository's owner and #43 links are replaced: `owner` is "starter template
  (re-review in your project)" and `tracking` is the GitHub advisory URL.
  Getting Started has a new section, "Dependency advisories", on how an
  adopter makes the review theirs. An empty allowlist would have failed the
  adopter's CI on the same two advisories from day one.
- **User-facing docs:**
  - `docs/conventions.md` drops the `Refs koniz-dev/...` commit convention.
  - `docs/README.md` drops the Issue Workflow entry.
  - `scripts/README.md` drops the label script.
  - `docs/testing.md` and `docs/remove-demo.md` drop their evidence links.
- **`docs:check`** now also checks `AGENTS.md` and `CLAUDE.md`. Like the demo
  removal, it skips references to the maintainer files once they are deleted.

## The maintainer pointer: wording and why

In `AGENTS.md`, between `<!-- @maintainer remove-block-start -->` and
`<!-- @maintainer remove-block-end -->`:

> **Maintaining the starter itself?** Only if `docs/maintainers/` exists and
> `git remote get-url origin` is the upstream repository named in
> `docs/maintainers/README.md`, also follow that file. Otherwise ignore
> `docs/maintainers/` and `scripts/maintainers/`: they are the starter's own
> process, not this project's (`scripts/maintainer-files.json` lists the
> files, which can be deleted).

`docs/maintainers/README.md` names the upstream repository and repeats the
guard: it applies only when `origin` is `koniz-dev/react-native-starter`.

Why:

- **No slug in `AGENTS.md`.** Criterion 1 asks for no `koniz-dev` there, so
  the slug lives in the maintainer folder.
- **A check an agent can run.** The condition is a command
  (`git remote get-url origin`), not a judgement. In a project made with "Use
  this template", `origin` is the adopter's repository, so the agent ignores
  the folder even if nobody deleted it.
- **The guard is stated twice,** in the pointer and at the top of the
  maintainer README, so an agent that opens the folder anyway meets it again.
- **Markers instead of a line match.** The init script (#47) deletes the
  block by markers, the same convention as `@demo`.
- **Not imported into `CLAUDE.md`.** An `@docs/maintainers/README.md` import
  would load the maintainer process into every adopter session, which is the
  problem this issue fixes.

## Acceptance criteria

| #   | Criterion                                                                   | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Result |
| --- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `AGENTS.md` / `CLAUDE.md` adopter-facing; no slug, issue numbers, MVP gate, or `status:*` | [AGENTS.md at 07db8e3](https://github.com/koniz-dev/react-native-starter/blob/07db8e3dc1f95d2671edcd4d1d8d34cc0cfb0223/AGENTS.md): structure, conventions, adding things, config/env, gates (including e2e), docs map. [07](07-grep-checks.log): the only hits are two heading anchors (`#3-add-endpoints…`, `#2-sign-in…`)                                                                                                                                                                           | PASS   |
| 2   | Maintainer process in one named place, with a self-ignoring pointer; wording recorded | `docs/maintainers/` (+ `scripts/maintainers/`), listed in [07](07-grep-checks.log); the wording and why are above                                                                                                                                                                                                                                                                                                                                                                                             | PASS   |
| 3   | Manifest; allowlist without this repository's entries, or an adopter review path | `scripts/maintainer-files.json` ([07](07-grep-checks.log)). Allowlist: no `koniz` and no issue links ([07](07-grep-checks.log)); "Dependency advisories" in `docs/getting-started.md`; the starter's review moved to `docs/maintainers/dependency-review.md`. `audit:check` still passes: [05](05-audit-check.log)                                                                                                                                                                                         | PASS   |
| 4   | User-facing docs have no maintainer process                                 | [07](07-grep-checks.log): no `koniz`, `evidence`, `Refs`, `issue-workflow`, `status:*`, or "maintainer" in `README.md`, `docs/*.md`, `docs/recipes/`, or `scripts/README.md`                                                                                                                                                                                                                                                                                                                                    | PASS   |
| 5   | A fresh agent in a stripped scratch copy builds "Settings screen with a dark-mode toggle" the adopter way | Scratch clone, `origin` set to `acme/my-app`, maintainer files removed with [strip-maintainer.js](strip-maintainer.js) (applies the manifest). New `claude -p "add a Settings screen with a dark-mode toggle"` session: [transcript](adopter-session-transcript.jsonl) (startup inventory event removed), [summary](adopter-session-summary.txt), [diff](adopter-session.diff). See below.                                                                                                                         | PASS   |
| 6   | `docs:check`, lint, type-check, `test:ci`, format pass; CI green            | [01 lint](01-lint.log), [02 type-check](02-type-check.log), [03 test:ci](03-test-ci.log) (205 tests), [04 format](04-format-check.log), [06 docs:check](06-docs-check.log); CI run 38047074234 on `07db8e3`: success, [log](08-github-actions-ci-38047074234.log)                                                                                                                                                                                                                                                      | PASS   |

### Criterion 5 in detail

What the session did (read from the diff and the transcript):

- **Feature folder:** `features/settings/screens/SettingsScreen.tsx`, a
  named export.
- **Thin route:** `app/(tabs)/settings.tsx` is one line that re-exports the
  screen. The tab is registered in `app/(tabs)/_layout.tsx`.
- **i18n:** `tabs.settings`, `settings.title`, and `settings.darkMode` are in
  `shared/i18n/en.ts`; the screen reads them with `t()`.
- **Theme and colors:** colors come from `useTheme()` and styles from
  `StyleSheet.create` at the bottom of the file.
- **Shared code:** the preference lives in `shared/ui/ThemePreference.tsx`,
  persisted through the existing `shared/storage` wrapper. A storage error
  goes to `logger`.
- **Tests:** `__tests__/features/settings/SettingsScreen.test.tsx` runs the
  full app (follows the system scheme, toggles it, persists the choice,
  restores it, ignores a bad stored value, survives a save failure). The
  tab-bar theme test was extended.
- **e2e and docs:** a new Maestro flow
  (`.maestro/07-settings-dark-mode.yaml`). `docs/ui-and-theming.md`,
  `docs/conventions.md`, and `docs/testing.md` were updated.
- **Gates:** the session ran lint, type-check, `test:ci`, format, and
  `docs:check`. Rerun independently: [adopter-gates.log](adopter-gates.log),
  all pass, 212 tests.
- **No GitHub issues:** the session never mentioned an issue, a `status:*`
  label, `Refs`, evidence, or the maintainer folder. A search of the
  transcript for "issue", "github", "koniz", and "maintainer" finds only doc
  URLs it read (Paper, Material theme builder, Maestro releases) and a
  `configResult.issues` prop in `app/_layout.tsx`.
- **Not run:** the new Maestro flow. The session said so; there was no
  simulator in that session.
