# Release Gate

> For maintainers of the starter itself; delete in your project. See
> [Maintainers](README.md).

## Verification scope

The starter is production-ready by configuration, not by installation (see
the positioning in [`AGENTS.md`](../../AGENTS.md#design-principles)): every
external integration sits behind a seam with a no-op or console default, and
the starter installs no credentialed service. Acceptance criteria and UAT verify the
seams and their default implementations (for example: the reporting seam receives
the error and the default logs it; the 401 path clears the session), never a real
third-party service, store submission, or anything that needs credentials. A
criterion that requires credentials the repository does not have is out of scope,
not `status:needs-uat`.

## MVP and maintenance readiness

This repository's product is a **React Native starter**, not a finished consumer
application. Its MVP is a trustworthy, documented starting point from which a team
can build an app. Closing a collection of implementation issues is not, by itself,
evidence that the starter has reached MVP or may enter maintenance.

An agent may describe the starter as **MVP-ready** only when a dedicated open
release-readiness issue has explicit acceptance criteria, all criteria have PASS
evidence, and the following conditions are true:

- The release issue defines the supported Expo SDK, Node version, and platform scope
  (iOS, Android, and/or web), as well as explicit non-goals. It must not imply a
  production backend, store submission, analytics, push notifications, or a chosen
  state-management library unless those are deliberately in scope.
- A clean checkout can follow the committed instructions using `npm ci`, create the
  documented environment configuration, and start the app. Every command, import,
  route, sample credential, and endpoint referenced by the in-scope documentation
  either works or is expressly marked as an optional example to be implemented by
  the adopter.
- The shipped baseline flows work end to end within their stated scope: initial
  navigation, light/dark theming, API loading/error/retry behavior, and the chosen
  authentication example (including logout and session persistence, if auth remains
  part of the starter). Tokens on native platforms use protected storage; a web
  limitation or fallback is documented.
- Automated gates pass from the clean dependency tree: lint, formatting, type check,
  and tests. Tests cover the baseline services and failure paths, not merely static
  rendering. Dependency audit results contain no unreviewed critical or high finding;
  an unavoidable finding needs a documented dependency path, risk decision, and a
  tracked remediation issue.
- Native and visual claims have human UAT evidence for every platform advertised as
  supported. At minimum this covers install/launch, tab navigation, login/logout or
  the documented auth alternative, keyboard interaction, safe areas/system bars,
  light/dark mode, an offline/API-failure state, and no crash on relaunch. Web-export
  evidence is useful but is never proof of iOS or Android behavior.
- The release issue links committed logs and screenshots under
  `docs/evidence/issue-<N>/` on the `evidence` branch, records the tested device/simulator and OS versions,
  and distinguishes automated PASS from human UAT PASS. Any unmet human-only
  criterion keeps the release issue in `status:needs-uat`, not closed.
- The codebase meets the positioning above: no dead code or parallel systems (one
  theming system, no unused components/hooks/utilities), demo code isolated from the
  foundation, no hard-coded environment values outside validated config, no
  hand-written type shims for packages that ship types, and lint passes with zero
  warnings.
- Every integration seam listed in the positioning exists with a default
  implementation, a unit test for the default, and a docs page showing how to plug in
  a provider.
- In-scope documentation has been checked against the code: every snippet compiles
  against the current APIs and every described behavior matches the app.
- Optional examples kept in this repository (for example the state-management
  recipes in `docs/recipes/`) are either verified against the current `main` or
  explicitly marked as unmaintained.

The repository may move from feature development to **maintenance mode** only after
MVP readiness is evidenced and all of the following hold:

- At least one tagged or otherwise immutable baseline revision has passed the release
  gate; its supported platforms, SDK/Node versions, and known limitations are
  recorded in the release issue or release notes.
- There are no open P0 or P1 defects/security issues, and no unresolved issue that
  invalidates a published setup, platform-support, or security claim. P2/P3 backlog
  items have been consciously deferred rather than treated as invisible scope.
- CI is green on the baseline revision, release dependencies are reproducible via the
  lockfile, and the dependency/security review has a repeatable cadence and owner.
- The team has a documented support policy: how to report a defect, how security
  updates are triaged, what compatibility updates are accepted, and when an Expo or
  React Native upgrade is required.

In maintenance mode, accept only security fixes, reproducible regressions,
compatibility/toolchain updates, documentation corrections, and narrowly scoped
reliability improvements. A new user-facing capability, a new supported platform, a
new required backend integration, or a change to the starter's promised baseline
reopens feature development and requires a new release-readiness issue. Agents must
state which release-gate criteria remain unverified; green unit tests alone never
justify declaring MVP or maintenance readiness.
