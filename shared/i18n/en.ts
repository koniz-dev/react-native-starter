/**
 * English strings for the shipped screens. Keys are typed: `t()` only accepts
 * keys defined here, and every other locale must provide the same keys
 * (see `Translations`). Placeholders use `{name}` and are filled by `t()`.
 */
export const en = {
  // Tabs
  'tabs.home': 'Home',
  // @demo remove-block-start
  'tabs.explore': 'Explore',
  // @demo remove-block-end

  // Home
  'home.title': 'Welcome',
  'home.session.title': 'Session',
  'home.session.checking': 'Checking session…',
  'home.session.signedIn': 'Signed in as {name}',
  'home.session.signedInFallbackName': 'your account',
  'home.session.signedOut': 'Not signed in',
  'home.session.signIn': 'Sign in',
  'home.session.logOut': 'Log out',
  'home.session.viewProfile': 'View profile',
  // @demo remove-block-start
  'home.examples.title': 'Examples',
  'home.examples.todos': 'Todos (API example)',
  'home.examples.todosDescription':
    'Loading, error, and retry states with useFetch',
  'home.examples.showcase': 'Component showcase',
  'home.examples.showcaseDescription': 'React Native Paper under the app theme',
  'showcase.title': 'Component showcase',
  // @demo remove-block-end

  // Profile (protected example screen)
  'profile.title': 'Profile',
  'profile.intro':
    'This screen is in the protected (app) route group: it is only reachable while signed in.',
  'profile.name': 'Name',
  'profile.email': 'Email',
  'profile.refreshFailed': 'Could not refresh your profile: {message}',

  // Login
  'login.title': 'Welcome Back',
  'login.subtitle': 'Sign in to continue',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.submit': 'Sign In',
  'login.error.emptyFields': 'Please fill in all fields',
  'login.error.generic': 'Login failed. Please try again.',
  // @demo remove-block-start
  'login.demoHint':
    'Demo backend (DummyJSON): sign in as {username} / {password}. For your backend, set EXPO_PUBLIC_AUTH_API_URL and register an AuthAdapter.',

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
  // @demo remove-block-end

  // Common
  'common.dismiss': 'Dismiss',
  'common.unknownError': 'An error occurred',

  // Error boundary
  'errorBoundary.title': 'Something went wrong',
  'errorBoundary.fallbackMessage': 'An unexpected error occurred',
  'errorBoundary.retry': 'Try again',
  'errorBoundary.goHome': 'Go home',

  // Configuration error screen
  'configError.title': 'Configuration error',
  'configError.body':
    'The environment variables for this build are missing or invalid. Fix them in your .env file (see .env.example) or build profile, then restart the app.',
} as const;

export type TranslationKey = keyof typeof en;
export type Translations = Record<TranslationKey, string>;
