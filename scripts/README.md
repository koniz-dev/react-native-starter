# Scripts

This directory contains repository-maintenance scripts that are committed and
safe to run from the project root.

## `bootstrap-issue-labels.sh`

Creates or synchronizes the GitHub issue-label taxonomy used by this starter.
It does not modify source code.

```bash
REPO=koniz-dev/react-native-starter ./scripts/bootstrap-issue-labels.sh
```

The canonical epic-label list is maintained in this script. See
[`docs/issue-workflow.md`](../docs/issue-workflow.md) for the issue lifecycle.

## `remove-demo.js`

Removes the demo features and `@demo`-marked code, leaving the foundation
(`npm run remove-demo`, `-- --dry-run` to preview). See
[`docs/remove-demo.md`](../docs/remove-demo.md).

## No reset-project command

This starter intentionally does not ship a destructive `reset-project` script.
Create a branch or copy the files you want to adapt instead of moving the
committed `app/` directory from an automated script.
