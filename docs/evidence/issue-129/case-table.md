# Old vs new: `toApiError` for a request with no response

| Case | Where it comes from | `error.code` | XHR `responseType` / `responseText` | Old | New |
|---|---|---|---|---|---|
| Android call timeout | OkHttp `callTimeout` → `InterruptedIOException("timeout")`, no RN timeout flag (seen on the emulator, `android-probe.log`) | `ERR_NETWORK` | `''` / `"timeout"` | `network` | **`timeout`** |
| Android socket timeout | OkHttp `SocketTimeoutException` (RN sets the flag, XHR fires `timeout`) | `ECONNABORTED` | n/a | `timeout` | `timeout` |
| Android closed port | `IOException("unexpected end of stream on …")` (seen on the emulator) | `ERR_NETWORK` | `''` / `"unexpected end of stream on http://localhost:9999/..."` | `network` | `network` |
| iOS offline | NSError localized description | `ERR_NETWORK` | `''` / `"The Internet connection appears to be offline."` | `network` | `network` |
| iOS timeout | RCTNetworking sets the timeout flag | `ECONNABORTED` | n/a | `timeout` | `timeout` |
| Browser network error | XHR `error`, empty text | `ERR_NETWORK` | `''` / `''` | `network` | `network` |
| Blob/arraybuffer request | `responseText` getter throws | `ERR_NETWORK` | `'blob'` / (throws) | `network` | `network` (getter not read) |
| No request attached | axios error without request | `ERR_NETWORK` | none | `network` | `network` |
| Server answered `timeout` as a body | has a response | any | n/a | by status | by status (only no-response errors are checked) |

Only the first row changes. Each row is a test in `__tests__/shared/http/httpClient.test.ts` ("maps … without a response"), except the socket-timeout/iOS-timeout rows, which the existing ECONNABORTED test covers.
