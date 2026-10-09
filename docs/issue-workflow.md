# Issue-Driven Workflow

GitHub issues are the single source of truth for all work in this repository. This
document defines the label taxonomy, the issue lifecycle, the invariants that keep the
system consistent without supervision, and the loop an autonomous session follows to
pull work, ship it, verify it, and close it.

Repository: `koniz-dev/react-native-starter` (single repo, no `repo:*`/`area:*` family
needed). Work ships directly to `main` in small, single-issue commits — this matches the
repo's existing history. Feature branches and PRs are reserved for large opt-in variants, not for
routine issue work.

## Label taxonomy

Native issue types (Bug / Feature / Task) are an organization-level GitHub feature and
this repository is user-owned, so a label family stands in for them, reusing the two
default labels that already existed.

| Family   | Labels                                                                                                   | Meaning                                           |
| -------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Type     | `bug`, `enhancement`, `task`                                                                             | What kind of work this is (exactly one per issue) |
| Epic     | `epic:navigation`, `epic:ui`, `epic:services`, `epic:state`, `epic:testing`, `epic:docs`, `epic:tooling` | Which functional area it belongs to               |
| Priority | `priority:P0`, `priority:P1`, `priority:P2`, `priority:P3`                                               | P0 = drop everything, P3 = nice to have           |
| Status   | `status:todo`, `status:in-progress`, `status:needs-uat`, `status:blocked`                                | Where the issue is in its lifecycle               |

Epic areas map to the codebase:

| Epic              | Covers                                                                  |
| ----------------- | ----------------------------------------------------------------------- |
| `epic:navigation` | `app/` routes, layouts, Expo Router configuration                       |
| `epic:ui`         | `shared/ui/` (theme, shared components), Paper theming                  |
| `epic:services`   | `shared/` config, http, session, storage, lib; feature `api/`           |
| `epic:state`      | State management: the session provider and the state-management recipes |
| `epic:testing`    | `__tests__/`, Jest/RNTL configuration                                   |
| `epic:docs`       | `README.md`, `docs/`, per-directory READMEs                             |
| `epic:tooling`    | ESLint, Prettier, TypeScript config, `scripts/`, CI, `.env`             |

The canonical source for the epic list is `scripts/bootstrap-issue-labels.sh`. If an
epic is added, renamed, or removed, change it there first, run the script, then update
the table above. Humans, agents, and any issue-filing integration read the script, so
they cannot drift apart.

## Lifecycle

```
Backlog (open, no status label)
   |  triage
   v
status:todo --claim: assign + relabel--> status:in-progress
                                              | ship
                                              v
                                        run acceptance criteria
                                          |- PASS + evidence --> closed
                                          |- can't verify -----> status:needs-uat (human)
                                                                  |- PASS --> closed
                                                                  |- FAIL --> status:todo
   any state -- stuck / needs a decision --> status:blocked (+ comment, unassign)
```

## The six invariants

These are rules, not suggestions. They are what allows the loop to run unattended.

1. **Exactly one state per open issue.** A `status:*` label comes off only by closing
   the issue or moving it to another state — never stripped on its own. An open issue
   with no status label is Backlog (pre-triage) by definition; an issue that has ever
   been triaged must always carry exactly one status label until it is closed. This rule
   prevents issues from falling into invisible limbo.

2. **Acceptance criteria live in the issue body**, under an exact `## Acceptance
criteria` heading: concrete, observable steps that someone (or a browser agent) can
   run — not developer notes. Steps only a human can perform are marked
   `(human-only)`. An issue without acceptance criteria is not startable: triage must
   add them before applying `status:todo`.

3. **Commits link, never close.** Commit messages carry
   `Refs koniz-dev/react-native-starter#N`. The keywords `Fixes`, `Closes`, and
   `Resolves` are banned in commits and PR descriptions — auto-closing on push destroys
   the verification gate, which is the whole point of this workflow.

4. **Definition of Done = closed AND evidence-backed.** A session closes an issue only
   after running its acceptance criteria against the running app (or its build/test
   toolchain, where the criteria are toolchain-level) and attaching retrievable
   evidence: committed logs or screenshots under `docs/evidence/issue-<N>/` plus a PASS
   summary comment on the issue. "Tests are green" or "it deployed" is not done.

5. **`status:needs-uat` means a human must verify this.** It is reserved for criteria an
   agent genuinely cannot drive in this repo: native-device behavior (gestures, safe
   areas on a notched device, AsyncStorage on hardware, Expo Go), visual polish
   judgments, and anything env-blocked. It is not a "someone test it later" dumping
   ground. A human's rejection sends the issue back to `status:todo` with feedback in a
   comment.

6. **Labels are the source of truth.** Any GitHub Project or board view is a read-only
   mirror of label state, never the reverse. Nothing may drive workflow state from a
   board column.

## The agent loop

One issue at a time, so each change stays small and revertible.

1. **Select.** Pick the open `status:todo` issue with the highest priority
   (`priority:P0` first; break ties by lowest issue number). If the queue is empty,
   triage exactly one Backlog issue (open, no status label): confirm it has a type
   label, an epic label, a priority, and a `## Acceptance criteria` section (add any
   that are missing, writing criteria from the issue description), then label it
   `status:todo` and select it.

2. **Claim.** Self-assign and swap the label:
   `status:todo` -> `status:in-progress`. **Then re-read the issue** to confirm you won
   the race against any concurrent session: if the assignee is not you or the labels are
   not what you just set, release your claim (unassign yourself, do not touch labels
   someone else set) and take the next issue.

3. **Scope.** Re-read the body and acceptance criteria. Decide the smallest change that
   satisfies them. If the issue is ambiguous or requires a decision you cannot make,
   move it to `status:blocked` with a comment saying exactly what decision or input is
   needed, unassign yourself, and go back to step 1.

4. **Implement.** Make the change. Run the full local gate:
   `npm run lint && npx tsc --noEmit && npm run test:ci`. Fix what breaks. Commit to
   `main` with a message that carries `Refs koniz-dev/react-native-starter#N` (never
   `Fixes`/`Closes`/`Resolves`) and push.

5. **Verify and close.** Execute every acceptance criterion against the running app or
   toolchain (see `CLAUDE.md` > Acceptance verification for how, in this repo). Save
   evidence to `docs/evidence/issue-<N>/`, commit it (`Refs ...#N`), and inspect each
   artifact yourself before calling it a PASS. Then:
   - **All criteria pass:** comment a PASS summary linking the evidence files and the
     commits, then close the issue.
   - **Some criteria are `(human-only)` or genuinely unverifiable here:** comment which
     criteria passed with evidence, which remain and exactly how a human should verify
     them, then relabel `status:in-progress` -> `status:needs-uat` and unassign.
   - **A criterion fails and you cannot fix it now:** relabel to `status:blocked` with a
     comment stating the failure and what is needed, unassign.

6. Return to step 1.

## gh recipes

All commands assume the current repo; add `-R koniz-dev/react-native-starter` when
running from elsewhere.

### Create an issue (lands in Backlog)

```bash
gh issue create \
  --title "Short imperative summary" \
  --label "task,epic:tooling,priority:P2" \
  --body "$(cat <<'EOF'
Context and problem statement.

## Acceptance criteria

1. Concrete observable step an agent can run.
2. Another one. Expected result stated explicitly.
3. (human-only) A step only a human can perform, if any.
EOF
)"
```

### Triage (Backlog -> todo)

```bash
# Ensure type/epic/priority labels and acceptance criteria exist first, then:
gh issue edit <N> --add-label "status:todo"
```

### Claim (todo -> in-progress), then confirm the claim

```bash
gh issue edit <N> --add-assignee "@me" \
  --remove-label "status:todo" --add-label "status:in-progress"

# Re-read to confirm you won any race with a concurrent session:
gh issue view <N> --json assignees,labels
# If assignee/labels are not what you just set: release and pick another issue.
gh issue edit <N> --remove-assignee "@me"
```

### Ship (commit convention)

```bash
git commit -m "fix: description of the change

Refs koniz-dev/react-native-starter#<N>"
git push origin main
```

### Close with evidence (in-progress -> closed)

```bash
gh issue comment <N> --body "$(cat <<'EOF'
PASS - all acceptance criteria verified.

1. <criterion> - PASS. Evidence: docs/evidence/issue-<N>/<file>
2. <criterion> - PASS. Evidence: docs/evidence/issue-<N>/<file>

Commits: <sha1>, <sha2>
EOF
)"
gh issue close <N>
```

Closing removes the issue from the open set, which is what retires its status label;
do not strip `status:in-progress` separately.

### Hand off to a human (in-progress -> needs-uat)

```bash
gh issue comment <N> --body "Automated criteria 1-2 PASS (evidence: docs/evidence/issue-<N>/). Criterion 3 is human-only: <exact steps for the human>."
gh issue edit <N> --remove-label "status:in-progress" --add-label "status:needs-uat" \
  --remove-assignee "@me"
```

Human verdict:

```bash
# PASS:
gh issue close <N> --comment "UAT pass: <what was checked>"
# FAIL:
gh issue comment <N> --body "UAT fail: <what went wrong, expected vs actual>"
gh issue edit <N> --remove-label "status:needs-uat" --add-label "status:todo"
```

### Block (any state -> blocked)

```bash
gh issue comment <N> --body "Blocked: <exactly what decision or input is needed, from whom>"
gh issue edit <N> --remove-label "status:in-progress" --add-label "status:blocked" \
  --remove-assignee "@me"
```

### Queue queries

```bash
# Work queue, highest priority first (P0..P3):
gh issue list --label "status:todo" --json number,title,labels
# Backlog needing triage:
gh issue list --state open --json number,title,labels \
  --jq '[.[] | select([.labels[].name | startswith("status:")] | any | not)]'
# Waiting on a human:
gh issue list --label "status:needs-uat"
```

## Label bootstrap

`scripts/bootstrap-issue-labels.sh` creates or updates every label above. It is
idempotent (`gh label create --force`) and targets another repo via
`REPO=owner/name ./scripts/bootstrap-issue-labels.sh`.
