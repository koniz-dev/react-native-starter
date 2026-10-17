| Body | Old | New | Changed |
|---|---|---|---|
| OAuth2 invalid_grant + description | invalid_grant | Invalid username or password | yes |
| OAuth2 code only | invalid_grant | invalid_grant |  |
| OAuth2 empty description | invalid_grant | invalid_grant |  |
| OAuth2 non-string description | invalid_grant | invalid_grant |  |
| description only | None | Token expired | yes |
| message + description | Wrong password | Wrong password |  |
| message only | Invalid credentials | Invalid credentials |  |
| empty message, error string | Bad request | Bad request |  |
| error string (dummyjson) | Something | Something |  |
| envelope | Nested msg | Nested msg |  |
| envelope + description | Nested msg | desc | yes |
| envelope without message | None | None |  |
| string body | None | None |  |
| null | None | None |  |
| array | None | None |  |
| empty object | None | None |  |
