| Backend | Old | New |
|---|---|---|
| Keycloak 401 wrong pw | invalid_grant | Invalid user credentials **(changed)** |
| Keycloak 400 refresh expired | invalid_grant | Token is not active **(changed)** |
| Auth0 403 wrong pw | invalid_grant | Wrong email or password. **(changed)** |
| Auth0 403 mfa_required | mfa_required | Multifactor authentication required **(changed)** |
| Okta 400 | invalid_grant | The credentials provided were invalid. **(changed)** |
| Azure AD ROPC 400 | invalid_grant | AADSTS50126: Error validating credentials due to invalid username or password. Trace ID: 0a1b Correlation ID: 2c3d Timestamp: 2026-10-18 01:02:03Z **(changed)** |
| Google token 400 | invalid_grant | Bad Request **(changed)** |
| Cognito /oauth2/token 400 | invalid_grant | invalid_grant |
| Cognito InitiateAuth 400 | Incorrect username or password. | Incorrect username or password. |
| Firebase signInWithPassword 400 | INVALID_LOGIN_CREDENTIALS | INVALID_LOGIN_CREDENTIALS |
| Supabase GoTrue (old) 400 | invalid_grant | Invalid login credentials **(changed)** |
| Supabase GoTrue (new) 400 | undefined | undefined |
| Django OAuth Toolkit 400 | invalid_grant | Invalid credentials given. **(changed)** |
| DRF SimpleJWT 401 | undefined | undefined |
| Rails Doorkeeper 400 | invalid_grant | The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client. **(changed)** |
| Rails Devise 401 | Invalid Email or password. | Invalid Email or password. |
| Laravel Passport 400 | The user credentials were incorrect. | The user credentials were incorrect. |
| Laravel validation 422 | The email field is required. | The email field is required. |
| Spring Boot 400 | Invalid credentials | Invalid credentials |
| Spring Boot 401 (message hidden) | Unauthorized | Unauthorized |
| Spring Auth Server 400 | invalid_grant | OAuth 2.0 Parameter: grant_type **(changed)** |
| Spring Security OAuth (legacy) 400 | invalid_grant | Bad credentials **(changed)** |
| FastAPI 401 | undefined | undefined |
| FastAPI 422 | undefined | undefined |
| Express/Passport 401 | Unauthorized | Unauthorized |
