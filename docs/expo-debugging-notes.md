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

### Already Implemented

✅ **ErrorBoundary component** - Catches errors in component tree

- Displays stack trace in development mode
- Has user-friendly fallback UI
- Logs errors using `console.error()` in `componentDidCatch`

✅ **API error handling** - Consistent API error handling

- Interceptor to format errors
- Logs errors using `console.error()`

### Improvements Added

✅ **Logger utility** (`utils/logger.ts`)

- `logger.warn()` - For warnings (Yellowbox)
- `logger.error()` - For errors (Redbox)
- `logger.info()` - For info (dev only)
- `logger.debug()` - For debug (dev only)
- `logApiError()` - Helper for API errors

### How to Use the New Logger

```typescript
import { logger, logApiError } from '@/utils/logger';

// Warning (Yellowbox)
logger.warn('Deprecated API will be removed in v2');

// Error (Redbox)
logger.error('Failed to fetch data', error);

// API Error
try {
  await api.get('/users');
} catch (error) {
  logApiError('Failed to fetch users', error);
}
```

## Best Practices

1. **Use the correct log type:**
   - `console.warn()` / `logger.warn()` for warnings
   - `console.error()` / `logger.error()` for errors
   - Don't use `console.log()` for errors

2. **Reading stack traces:**
   - Find file and line number in stack trace
   - Check call stack to understand flow
   - Stack traces only display in development

3. **Error handling:**
   - Use ErrorBoundary for component errors
   - Use try/catch for async operations
   - Log errors with full context

4. **Development vs Production:**
   - Stack traces only display in `__DEV__`
   - Logger utility automatically hides debug logs in production

## References

- [Expo Debugging Guide](https://docs.expo.dev/debugging/errors-and-warnings/)
- [React Native LogBox](https://reactnative.dev/docs/debugging#logbox)
- [Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
