# Support Policy

> Part of the starter's maintainer process (branch `maintainers`). See
> [Maintainers](README.md).

The starter has been in **maintenance mode** since `v1.1.1`, the baseline
verified in
[koniz-dev/react-native-starter#57](https://github.com/koniz-dev/react-native-starter/issues/57).
This page tells users and maintainers what to expect. The owner is
koniz-dev.

## Reporting a defect

Open an issue on
[koniz-dev/react-native-starter](https://github.com/koniz-dev/react-native-starter/issues)
with:

- the starter version: the tag (for example `v1.1.1`) or the commit your
  project was created from;
- the platform: iOS Simulator, Android emulator or device, Expo Go or a
  native build, or web, with OS versions;
- the Node and npm versions;
- the steps that reproduce the problem, what you expected, and what
  happened, with logs or screenshots.

A maintainer triages the issue into the queue
([Issue Workflow](issue-workflow.md)) within 7 days. Priorities:

- **P0:** the documented setup is broken, or there is a security issue.
- **P1:** a baseline flow is broken on a supported platform.
- **P2/P3:** everything else.

A defect is fixed on `main` and ships in the next patch tag. Projects that
were already created from the template take the fix themselves; the
template does not update them.

## Security reports

Do **not** open a public issue for a vulnerability. Use GitHub's private
vulnerability reporting: the repository's **Security** tab, then **Report a
vulnerability**. Private vulnerability reporting is enabled on the
repository, so the button is there without a `SECURITY.md`. There is
deliberately no `SECURITY.md` on `main` (a template copy would inherit it) and
no separate `.github` repository; this page is the policy.

- **Acknowledgement:** within 3 days.
- **Assessment:** within 7 days. This checks whether the code reaches the
  app bundles or only build tooling, and how severe the issue is.
- **Fix:**
  - critical or high in the app bundles: a patch tag within 14 days, or a
    published workaround if upstream has to fix it first;
  - build tooling only: reviewed and recorded in
    `scripts/audit-allowlist.json` ([Dependency Review](dependency-review.md)),
    then fixed when upstream ships a fix.
- **Disclosure:** a GitHub security advisory once a fix or workaround is
  available, crediting the reporter unless they prefer otherwise.

Advisories in dependencies that are already public go through the
[Dependency Review](dependency-review.md) (normally monthly, and at the
latest by each allowlist entry's `reviewBy`), or sooner if one is critical.

## What maintenance mode accepts

These follow the [Release Gate](release-gate.md#mvp-and-maintenance-readiness):

- security fixes;
- reproducible regressions;
- compatibility and toolchain updates, such as Expo SDK, React Native, Node,
  and dependency updates;
- documentation corrections;
- narrowly scoped reliability improvements.

A new user-facing capability, a new supported platform, a new required
backend integration, or a change to the promised baseline reopens feature
development. It needs a new release-readiness issue before it ships.

## Expo SDK, React Native, and Node

- **Expo SDK:** only the latest Expo SDK is supported. The starter moves to
  a new SDK within about 4 weeks of its release, through a new
  release-readiness issue and a new tag. Until that tag ships, the previous
  baseline receives only security fixes. React Native, React, and Expo
  Router follow the versions that the Expo SDK pins.
- **An earlier upgrade** is needed when Expo Go or the app stores stop
  supporting the current SDK, or when a security fix needs a newer SDK.
- **Node:** the active LTS line in `.nvmrc`, plus the range in `engines` that
  the Expo SDK supports. A new LTS line is adopted with the next SDK upgrade,
  or earlier if the current line reaches end of life.
- **iOS native builds** need the Xcode version that the Expo SDK requires.
  While the verification host can't run it, native iOS builds stay a known
  limitation of the release.
