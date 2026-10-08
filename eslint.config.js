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
      // Verification artifacts (scripts kept as evidence), not app code.
      'docs/evidence/**',
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
    },
  },

  // Node config files (eslint.config.js, jest.setup.env.js) use CommonJS.
  {
    files: ['*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },

  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/__tests__/**/*.{ts,tsx,js,jsx}'],
    languageOptions: { globals: { ...sharedGlobals, ...globals.jest } },
  },

  // App code logs through utils/logger.ts, which forwards errors to the
  // error-reporting seam; only the logger and the default reporter write to
  // the console directly.
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: [
      'utils/logger.ts',
      'integrations/errorReporter.ts',
      '__tests__/**',
      'scripts/**',
      'jest.setup*.js',
    ],
    rules: {
      'no-console': 'error',
    },
  },

  // Environment variables are read only by the validated config module
  // (and by app.config.ts, which runs in Node at build time).
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: [
      'config/env.ts',
      'app.config.ts',
      '__tests__/**',
      'jest.setup.env.js',
    ],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            'Read environment values through config/env.ts (getConfig / configResult).',
        },
      ],
    },
  },
];
