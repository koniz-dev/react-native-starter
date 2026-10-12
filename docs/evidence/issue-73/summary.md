# Issue 73 verification: docs corrections

Fixes: [`72fb94a`](https://github.com/koniz-dev/react-native-starter/commit/72fb94a), [`9db5894`](https://github.com/koniz-dev/react-native-starter/commit/9db5894),
[`caa938f`](https://github.com/koniz-dev/react-native-starter/commit/caa938f),
plus the docs parts of #69–#72 and #74 (variant builds, lint, headers, coverage).

| #   | Criterion | Evidence | Result |
| --- | --------- | -------- | ------ |
| 1   | Every item corrected; the adopter journey gives a token-carrying setup | Items 1–10 of the issue edited as listed in the commits; step 1's example now lists the API in EXPO_PUBLIC_API_TRUSTED_ORIGINS, and API and Storage explains why | PASS |
| 2   | Docs read correctly after init --remove-demo --remove-recipes | [init.log](../issue-74/verification/init.log): the wording grep (starter, demo, template, recipe, ...) finds only generic uses (`.env.example` and `public/index.html` as templates, the i18n parameter); markers and template docs gone. Read end to end on that clone: README.md, Getting Started (prerequisites, platforms, scripts), Testing (end-to-end section), Conventions (navigation). One stale sentence found there (iOS Back from Login "is the left-edge swipe", while Login now has its own back button) was fixed in [`72fb94a`](https://github.com/koniz-dev/react-native-starter/commit/72fb94a) | PASS |
| 3   | docs:check before and after init | CI 38292179524 (with the pinned recipe libraries, 43 snippets); [init-gates.log](../issue-74/verification/init-gates.log) | PASS |
