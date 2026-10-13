const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const reactNative = require('eslint-plugin-react-native');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');
const path = require('path');

/**
 * Colors come from the theme, also on props such as an icon's color, written
 * as a string or inside an expression (AGENTS.md: Styles).
 */
const COLOR_LITERAL = {
  selector:
    'JSXAttribute[name.name=/[cC]olor$/] :matches(Literal[value=/^(#|rgba?\\(|hsla?\\()/i], TemplateElement[value.raw=/^(#|rgba?\\(|hsla?\\()/i])',
  message: 'Use a color from the Paper theme (useTheme()), not a literal.',
};

/**
 * The module a file belongs to, for the import rules: `features/<name>`,
 * `shared/<area>`, or the top-level folder (`app`, `testing`, ...).
 */
function moduleOf(rel) {
  const [top, sub] = rel.split('/');
  return top === 'features' || top === 'shared' ? `${top}/${sub}` : top;
}

/**
 * Project rules lint can't express with core rules: the dependency direction
 * and `@/` for imports outside the current module (AGENTS.md: Project
 * structure, Imports), for `@/` and relative paths alike.
 */
const project = {
  rules: {
    'import-boundaries': {
      meta: { type: 'problem', schema: [] },
      create(context) {
        const file = path
          .relative(__dirname, context.filename)
          .split(path.sep)
          .join('/');
        const from = moduleOf(file);
        const check = (node, source) => {
          if (typeof source !== 'string') return;
          let target;
          if (source.startsWith('@/')) {
            target = source.slice(2);
          } else if (source.startsWith('.')) {
            target = path.posix.normalize(
              path.posix.join(path.posix.dirname(file), source)
            );
          } else {
            return;
          }
          const to = moduleOf(target);
          const [fromTop] = from.split('/');
          const [toTop] = to.split('/');
          const report = message => context.report({ node, message });
          if (
            fromTop === 'shared' &&
            (toTop === 'features' || toTop === 'app') &&
            file !== 'shared/integrations/setup.ts'
          ) {
            report(
              'shared/ must not import features or routes; register them in shared/integrations/setup.ts.'
            );
          } else if (
            fromTop === 'features' &&
            (toTop === 'app' || (toTop === 'features' && to !== from))
          ) {
            report(
              "A feature doesn't import another feature or a route; move shared code to shared/."
            );
          } else if (source.startsWith('.') && to !== from) {
            report(
              `Import ${target} with @/; relative paths stay inside ${from}.`
            );
          }
        };
        return {
          ImportDeclaration: node => check(node.source, node.source.value),
          ExportNamedDeclaration: node =>
            node.source && check(node.source, node.source.value),
          ExportAllDeclaration: node => check(node.source, node.source.value),
          ImportExpression: node =>
            node.source.type === 'Literal' &&
            check(node.source, node.source.value),
        };
      },
    },
  },
};

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
      // Tests, scripts, and app.config.ts are in tsconfig.tools.json (with
      // Node and Jest types); the app's own code is in tsconfig.json.
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.tools.json'],
        tsconfigRootDir: __dirname,
      },
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
  // (AGENTS.md: Exports). And no color literals (COLOR_LITERAL).
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
        COLOR_LITERAL,
      ],
    },
  },
  {
    files: ['app/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', COLOR_LITERAL] },
  },

  // Dependency direction and import paths (AGENTS.md: Project structure,
  // Imports): see `project` above.
  {
    files: ['{app,features,shared,testing}/**/*.{ts,tsx}'],
    plugins: { project },
    rules: { 'project/import-boundaries': 'error' },
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
