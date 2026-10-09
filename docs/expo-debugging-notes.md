# Expo Debugging: Errors and Warnings - Summary

Reference: [Expo - Errors and warnings](https://docs.expo.dev/debugging/errors-and-warnings/)

## Key Takeaways

### 1. Redbox vs Yellowbox

- **Redbox Error**: Fatal error that prevents the app from running
  - Displayed when a fatal error occurs
  - Can be triggered with `console.error()` or `throw Error()`
- **Yellowbox Warning**: Non-fatal warning, app continues to run
  - Displayed when a warning occurs
  - Triggered with `console.warn()`
  - Should be addressed before releasing the app

### 2. Stack Traces

Stack traces are extremely important for debugging:

- Shows the **file** and **line number** where the error occurred
- Displayed in terminal and Expo Go/development build
- Helps quickly find and fix errors

**Example from documentation:**

```
Error: renderDescription is not defined
  at HomeScreen (HomeScreen.js:7)
```

### 3. Creating Errors and Warnings

```typescript
// Create warning (Yellowbox)
console.warn('Warning message');

// Create error (Redbox)
console.error('Error message');

// Or throw error
throw Error('Error message');
```

## Application to Project

- `shared/ui/ErrorBoundary.tsx`: an app-level boundary and route-level
  boundaries (exported from the group layouts) with a themed fallback, "Try
  again", and "Go home". The stack trace is shown in development only.
- `shared/lib/logger.ts`: `debug` / `info` / `warn` / `error` with a configurable
  minimum level. `logger.warn` uses `console.warn` (a LogBox warning in
  development) and `logger.error` uses `console.error` (a LogBox error).
- Errors from the logger and the boundaries go to the error-reporting seam in
  every build. App code does not call `console` directly (ESLint `no-console`).

See [Error Reporting and Logging](error-reporting.md) for levels, redaction,
and plugging in a crash-reporting provider.

## References

- [Expo Debugging Guide](https://docs.expo.dev/debugging/errors-and-warnings/)
- [React Native LogBox](https://reactnative.dev/docs/debugging#logbox)
- [Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
