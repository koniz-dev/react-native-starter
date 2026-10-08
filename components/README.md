# Components

Reusable React Native components. Style them with React Native Paper and the
theme from `useTheme()` (see [`constants/Theme.ts`](../constants/Theme.ts) and
[Color Themes](../docs/color-themes.md)); there is no separate set of themed
primitives.

| Component           | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `ErrorBoundary`     | App-level and route-level error boundaries with a themed fallback  |
| `LoadingScreen`     | Centered activity indicator with an optional message               |
| `ConfigErrorScreen` | Startup screen shown when the environment configuration is invalid |

## ErrorBoundary

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <RiskyWidget />
</ErrorBoundary>;
```

The app root and every route group already have one; see
[Error Reporting and Logging](../docs/error-reporting.md#error-boundaries).

## LoadingScreen

```tsx
import { LoadingScreen } from '@/components/LoadingScreen';

<LoadingScreen message="Loading data..." />;
```

See [Error and Loading Guide](../docs/error-and-loading.md#loadingscreen).
