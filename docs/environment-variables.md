# Environment Variables

Learn how to use environment variables in your Expo project.

## Overview

Environment variables are key-value pairs configured outside your source code that allow your app to behave differently depending on the environment. For example, you can enable or disable certain features when building a test version of your app, or switch to a different API endpoint when building for production.

## Quick Start

### Create .env File

Create a `.env` file in the root of your project directory:

```bash
# .env
EXPO_PUBLIC_API_URL=https://staging.example.com
EXPO_PUBLIC_API_KEY=abc123
```

### Use in Code

Access environment variables using `process.env.EXPO_PUBLIC_[NAME]`:

```tsx
import { Button } from 'react-native';

function Post() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  async function onPress() {
    await fetch(apiUrl, { ... });
  }

  return <Button onPress={onPress} title="Post" />;
}
```

## Important Rules

### Prefix Requirement

**All environment variables used in JavaScript code must be prefixed with `EXPO_PUBLIC_`:**

```bash
# ✅ Correct
EXPO_PUBLIC_API_URL=https://api.example.com

# ❌ Wrong - won't be available in JavaScript
API_URL=https://api.example.com
```

### Static Reference

Environment variables must be statically referenced using dot notation:

```tsx
// ✅ Correct - will be inlined
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// ❌ Wrong - won't be inlined
const apiUrl = process.env['EXPO_PUBLIC_API_URL'];

// ❌ Wrong - won't be inlined
const { EXPO_PUBLIC_API_URL } = process.env;
```

## Multiple .env Files

You can use multiple `.env` files for different environments:

```
.env              # Default (can be committed)
.env.local        # Local overrides (should be gitignored)
.env.development  # Development environment
.env.production   # Production environment
```

### Priority Order

Files are loaded in this priority order (later files override earlier ones):

1. `.env`
2. `.env.local`
3. `.env.[NODE_ENV]`
4. `.env.[NODE_ENV].local`

### Gitignore

Add `.env*.local` to your `.gitignore`:

```gitignore
# .gitignore
.env*.local
```

This prevents committing local environment-specific configurations.

## Example Setup

### .env (committed)

```bash
# Default/development values
EXPO_PUBLIC_API_URL=https://api.staging.example.com
EXPO_PUBLIC_ENABLE_ANALYTICS=false
```

### .env.local (gitignored)

```bash
# Local overrides
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### .env.production (committed)

```bash
# Production values
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

## TypeScript Support

For TypeScript, you can create a type definition file:

```typescript
// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL: string;
    EXPO_PUBLIC_API_KEY: string;
    EXPO_PUBLIC_ENABLE_ANALYTICS: string;
  }
}
```

## EAS Build and Update

### EAS Build

EAS Build uses Metro Bundler to build your JavaScript bundle, so it will use `.env` files uploaded with your build job. You can also define environment variables in `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.example.com"
      }
    }
  }
}
```

### EAS Update

EAS Update uses Metro Bundler in your local environment or CI, so it will use available `.env` files.

### EAS Secrets

For sensitive values, use EAS Secrets instead of environment variables:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_KEY --value your-secret-key
```

## Disabling Environment Variables

If you need to disable environment variable loading:

### Disable .env File Loading

```bash
EXPO_NO_DOTENV=1 npx expo start
```

### Disable Client Variable Inlining

```bash
EXPO_NO_CLIENT_ENV_VARS=1 npx expo start
```

## Security Considerations

> **⚠️ Important:** Never store sensitive information in `EXPO_PUBLIC_` variables!

### What NOT to Store

- Private keys
- API secrets
- Database passwords
- Authentication tokens
- Any sensitive credentials

### Why?

Variables prefixed with `EXPO_PUBLIC_` are:

- Embedded in your compiled JavaScript bundle
- Visible in plain text
- Accessible to anyone who inspects your app

### What to Store Instead

- Public API endpoints (non-sensitive)
- Feature flags
- Public configuration values
- Build-time constants

### For Sensitive Data

Use:

- **EAS Secrets** for build-time secrets
- **SecureStore** for runtime secrets (see [Store Data Guide](store-data.md))
- **Backend API** for sensitive operations

## Migration from Other Solutions

### From react-native-config

1. Update `.env` files to prefix variables with `EXPO_PUBLIC_`:

```bash
# Before
API_URL=https://myapi.com

# After
EXPO_PUBLIC_API_URL=https://myapi.com
```

2. Update your code:

```tsx
// Before
import Config from 'react-native-config';
const apiUrl = Config.API_URL;

// After
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

3. Remove `react-native-config` from dependencies:

```bash
npm uninstall react-native-config
```

### From babel-plugin-transform-inline-environment-variables

1. Update variable names to use `EXPO_PUBLIC_` prefix
2. Remove the plugin from `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Remove this line:
    // plugins: ['transform-inline-environment-variables'],
  };
};
```

3. Clear cache:

```bash
npx expo start --clear
```

## Best Practices

1. **Use Descriptive Names**: Make variable names clear and descriptive
2. **Document Variables**: Add comments in `.env` files explaining what each variable does
3. **Use .env.local for Secrets**: Keep sensitive local overrides in `.env.local` (gitignored)
4. **Validate Variables**: Check that required variables exist at runtime
5. **Type Safety**: Use TypeScript definitions for better IDE support
6. **Default Values**: Provide sensible defaults when possible

### Example with Validation

```tsx
const getApiUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not defined');
  }

  return apiUrl;
};
```

## Troubleshooting

### Variables Not Updating

1. **Full Reload**: Shake device → Reload (or press `r` in terminal)
2. **Clear Cache**: `npx expo start --clear`
3. **Check Prefix**: Ensure variables start with `EXPO_PUBLIC_`
4. **Check Syntax**: Use dot notation, not bracket notation

### Variables Not Available

1. **Check File Location**: `.env` must be in project root
2. **Check Prefix**: Must use `EXPO_PUBLIC_` prefix
3. **Check Reference**: Must use `process.env.EXPO_PUBLIC_[NAME]` syntax
4. **Restart Expo**: Stop and restart `npx expo start`

## References

- [Expo: Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Build: Environment Variables](https://docs.expo.dev/build-reference/variables/)
- [EAS Update: Environment Variables](https://docs.expo.dev/eas-update/environment-variables/)
