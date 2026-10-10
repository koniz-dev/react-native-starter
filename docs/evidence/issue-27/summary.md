# Issue 27 verification — auth token only to trusted origins

Verified on 2026-10-06.

## Change

- `services/api.ts`: the request interceptor resolves each request's full URL
  (`api.getUri(config)`), normalizes its origin with `getOrigin` (lowercase
  `scheme://host[:port]`, userinfo stripped, default ports dropped; parsed by
  hand because React Native's `URL` is incomplete), and attaches
  `Authorization: Bearer …` only if the origin is in `trustedTokenOrigins`.
  Secure storage is not read at all for untrusted origins.
- `trustedTokenOrigins` = the origin of `EXPO_PUBLIC_AUTH_API_URL` plus any
  origins in `EXPO_PUBLIC_API_TRUSTED_ORIGINS` (comma-separated, invalid
  entries ignored). `services/auth.ts` now exports `authBaseURL`.
- `.env.example`, `docs/api-and-storage.md` ("Which hosts receive the token"),
  and `docs/how-to.md` document the rule.

## Deviation from criterion 1's default (and why)

Criterion 1 proposed "by default the configured API origin". That default
would not have fixed the reported leak: in the demo, the token is issued by
DummyJSON (auth) while `EXPO_PUBLIC_API_URL` is JSONPlaceholder, an unrelated
third party, so trusting the API origin by default would still send the
DummyJSON token to JSONPlaceholder. The token belongs to the auth backend, so
the default trusts only the auth origin. A real backend that serves auth and
API from one host needs no configuration; an API on a separate first-party
host is added once via `EXPO_PUBLIC_API_TRUSTED_ORIGINS`.

## Acceptance criteria

| #   | Criterion                                                                                            | Evidence                                                                                                                                                                                                                                                                                                                                                                              | Result                                      |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | Token attached only to allow-listed origins; other origins, including absolute URLs, get no header   | Code above; tests in row 2; device run below                                                                                                                                                                                                                                                                                                                                          | PASS (default = auth origin, see deviation) |
| 2   | Jest: allowed origin gets the header; another origin (absolute URL) does not; no stored token → none | [05-api-origin-tests.log](05-api-origin-tests.log): 16 tests, including "does not send the auth token to the separate demo API host", "does not attach or read the token for another origin", "does not attach the token to a look-alike host", the env allow-list, and `getOrigin` normalization cases. With the origin check disabled, the 3 negative tests fail (checked locally). | PASS                                        |
| 3   | Docs describe the rule and how to extend the allow-list                                              | `docs/api-and-storage.md`, `docs/how-to.md`, `.env.example`                                                                                                                                                                                                                                                                                                                           | PASS                                        |
| 4   | Gates pass and CI is green                                                                           | [01](01-lint.log) (0 errors; the 6 warnings are the existing `ThemedText.tsx` ones, removed by #35), [02](02-type-check.log), [03](03-test-ci.log) (12 suites / 79 tests), [04](04-format-check.log); CI run linked in the closing comment                                                                                                                                            | PASS                                        |

## Device check (iOS 18.6 simulator, Expo Go)

Signed in through the login screen ([signed in](uat/ios-01-signed-in.png)),
then opened Explore against a local API server that records only whether an
`Authorization` header was present ([log](uat/ios-request-headers.log)):

- Default allow-list: `GET /todos authorization=absent`
  ([screen](uat/ios-02-explore-default-allow-list.png)).
- Positive control with `EXPO_PUBLIC_API_TRUSTED_ORIGINS=http://localhost:9999`:
  `GET /todos authorization=present`
  ([screen](uat/ios-03-explore-api-origin-trusted.png)), which shows the server
  detects the header.
