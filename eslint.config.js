const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const reactNative = require('eslint-plugin-react-native');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

/** Every rule is an error: `npm run lint` also runs with --max-warnings 0. */
const asErrors = rules =>
  Object.fromEntries(
    Object.entries(rules).map(([name, level]) => [
      name,
      level === 'off' || level === 0 ? level : 'error',
    ])
  );

const sharedGlobals = {
  ...globals.node,
  ...globals.es2021,
  __DEV__: 'readonly',
};

// Rules for every source file, JavaScript and TypeScript alike.
const sharedRules = {
  ...react.configs.recommended.rules,
  ...react.configs['jsx-runtime'].rules,
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',

  ...asErrors(reactHooks.configs.recommended.rules),

  'react-native/no-unused-styles': 'error',
  'react-native/split-platform-components': 'error',
  'react-native/no-inline-styles': 'error',
  'react-native/no-color-literals': 'error',

  'prettier/prettier': 'error',
  ...prettierConfig.rules,
};

module.exports = [
  js.configs.recommended,

  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      '.expo-shared/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'android/**',
      'ios/**',
      // Maestro flow scripts run in Maestro's JavaScript engine (http, env globals).
      '.maestro/**',
      'e2e-results/**',
      'web-build/**',
      // Written by `npm run docs:check -- --keep`.
      '.docs-check/**',
    ],
  },

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: sharedGlobals,
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      prettier,
    },
    settings: { react: { version: 'detect' } },
    rules: sharedRules,
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { project: './tsconfig.json' },
    },
    plugins: { '@typescript-eslint': typescript },
    rules: {
      ...asErrors(typescript.configs.recommended.rules),
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // `import type` for types (AGENTS.md: Imports).
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      // Async errors are handled, not dropped (AGENTS.md: Errors). These need
      // type information, hence parserOptions.project above.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },

  // Named exports only; route files in app/ export their screen as default
  // (AGENTS.md: Exports).
  {
    files: ['features/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}', 'testing/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message:
            'Use a named export; only route files in app/ export a default.',
        },
        {
          selector: "ExportSpecifier[exported.name='default']",
          message:
            'Use a named export; only route files in app/ export a default.',
        },
        {
          // Colors come from the theme, also on props such as an icon's color.
          selector:
            'JSXAttribute[name.name=/^(color|backgroundColor|tintColor|placeholderTextColor|underlineColor|selectionColor)$/] > Literal',
          message:
            'Use a color from the Paper theme (useTheme()), not a literal.',
        },
      ],
    },
  },

  // Dependency direction (AGENTS.md: Project structure): shared/ never
  // imports a feature (except the composition root), and a feature doesn't
  // import another feature.
  {
    files: ['shared/**/*.{ts,tsx}'],
    ignores: ['shared/integrations/setup.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/**', '@/app/**'],
              message:
                'shared/ must not import features or routes; register them in shared/integrations/setup.ts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@/(app/|features/)',
              message:
                "A feature doesn't import another feature or a route; move shared code to shared/.",
            },
          ],
        },
      ],
    },
  },

  // Node config files (eslint.config.js, jest.setup.env.js) use CommonJS.
  {
    files: ['*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },

  {
    files: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}',
      'testing/**/*.{ts,tsx}',
      'jest.setup.ts',
    ],
    languageOptions: { globals: { ...sharedGlobals, ...globals.jest } },
  },

  // App code logs through shared/lib/logger.ts, which forwards errors to the
  // error-reporting seam; only the logger and the default reporter write to
  // the console directly.
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: [
      'shared/lib/logger.ts',
      'shared/integrations/errorReporter.ts',
      '__tests__/**',
      'scripts/**',
      'jest.setup*.js',
    ],
    rules: {
      'no-console': 'error',
    },
  },

  // Environment variables are read only by the validated config module,
  // shared/config/env.ts (and by Node code that never ships in the app:
  // app.config.ts at build time, and dev-only tools in scripts/).
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: [
      'shared/config/env.ts',
      'app.config.ts',
      '__tests__/**',
      'jest.setup.env.js',
      'scripts/**',
    ],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            'Read environment values through shared/config/env.ts (getConfig / configResult).',
        },
      ],
    },
  },
];
