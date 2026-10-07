/**
 * English strings for the shipped screens. Keys are typed: `t()` only accepts
 * keys defined here, and every other locale must provide the same keys
 * (see `Translations`). Placeholders use `{name}` and are filled by `t()`.
 */
export const en = {
  // Tabs
  'tabs.home': 'Home',
  'tabs.explore': 'Explore',

  // Home: session card
  'home.session.checking': 'Checking session…',
  'home.session.signedIn': 'Signed in as {name}',
  'home.session.signedInFallbackName': 'demo user',
  'home.session.signedOut': 'Not signed in',
  'home.session.tryDemo': 'Try authentication demo',
  'home.session.logOut': 'Log out',

  // Login
  'login.title': 'Welcome Back',
  'login.subtitle': 'Sign in to continue',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.submit': 'Sign In',
  'login.error.emptyFields': 'Please fill in all fields',
  'login.error.generic': 'Login failed. Please try again.',
  'login.demoHint':
    'Demo credentials: {username} / {password}. Set EXPO_PUBLIC_AUTH_API_URL and adapt services/auth.ts for your backend.',

  // Explore (API example)
  'explore.title': 'API Example',
  'explore.subtitle': 'Fetching todos from JSONPlaceholder API',
  'explore.loading': 'Loading todos...',
  'explore.retry': 'Retry',
  'explore.retrying': 'Loading...',
  'explore.errorTitle': 'Error',
  'explore.listTitle': 'Todos ({count})',
  'explore.empty': 'No todos found',
  'explore.done': '✓ Done',
  'explore.todoMeta': 'User ID: {userId} • ID: {id}',

  // Common
  'common.dismiss': 'Dismiss',
  'common.unknownError': 'An error occurred',

  // Error boundary
  'errorBoundary.title': 'Something went wrong',
  'errorBoundary.fallbackMessage': 'An unexpected error occurred',
  'errorBoundary.retry': 'Try Again',

  // Configuration error screen
  'configError.title': 'Configuration error',
  'configError.body':
    'The environment variables for this build are missing or invalid. Fix them in your .env file (see .env.example) or build profile, then restart the app.',
} as const;

export type TranslationKey = keyof typeof en;
export type Translations = Record<TranslationKey, string>;
