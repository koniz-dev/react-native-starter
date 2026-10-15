/**
 * @jest-environment node
 */
import { spawnSync } from 'child_process';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');

type Fixture = [name: string, file: string, code: string];

const IMPORTS_REJECTED: Fixture[] = [
  ['shared/', 'shared/lib/x.ts', "export * from '@/features/home/x';"],
  [
    'shared/, relatively',
    'shared/lib/x.ts',
    "export * from '../../features/home/x';",
  ],
  ['shared/ to a route', 'shared/lib/x.ts', "import '../../app/_layout';"],
  ['a feature', 'features/home/x.ts', "export * from '@/features/auth/y';"],
  [
    'a feature, relatively',
    'features/home/screens/x.ts',
    "export * from '../../auth/y';",
  ],
  [
    'a feature to a route',
    'features/home/x.ts',
    "export * from '@/app/_layout';",
  ],
  [
    'a relative path out of the module',
    'shared/http/x.ts',
    "export * from '../lib/logger';",
  ],
  [
    'a dynamic import',
    'shared/lib/x.ts',
    "void import('../../features/home/x');",
  ],
  [
    'its own feature through @/',
    'features/home/screens/x.ts',
    "export * from '@/features/home/api/y';",
  ],
];

const IMPORTS_ALLOWED: Fixture[] = [
  [
    'the composition root',
    'shared/integrations/setup.ts',
    "export * from '@/features/home/x';",
  ],
  [
    'a relative path in the feature',
    'features/home/screens/x.ts',
    "export * from '../api/y';",
  ],
  [
    'shared/ through @/',
    'features/home/x.ts',
    "export * from '@/shared/lib/logger';",
  ],
  [
    'a relative path in the area',
    'shared/http/x.ts',
    "export * from './apiError';",
  ],
  ['a package', 'features/home/x.ts', "export * from 'react-native';"],
];

const component = (jsx: string) =>
  'declare const Icon: (p: { color?: string; iconColor?: string }) => null;\n' +
  'export declare const Spinner: (p: { colors?: string[] }) => null;\n' +
  'export declare const Tabs: (p: { screenOptions?: object }) => null;\n' +
  'declare const dark: boolean;\n' +
  'export declare function pick(name: string): string;\n' +
  `export const X = () => (dark ? ${jsx} : null);\n`;

const COLORS_REJECTED: Fixture[] = [
  ['a string', '<Icon color="#ff0000" />'],
  ['an expression', "<Icon color={'#ff0000'} />"],
  ['a conditional', "<Icon color={dark ? '#fff' : 'rgb(0,0,0)'} />"],
  ['a template literal', '<Icon color={`#ff0000`} />'],
  ["Paper's iconColor", '<Icon iconColor="#ff0000" />'],
  ['a color name', '<Icon color="white" />'],
  ['a list of colors', "<Spinner colors={['#f00', 'blue']} />"],
  [
    'a navigator option',
    "<Tabs screenOptions={{ tabBarActiveTintColor: 'red' }} />",
  ],
].flatMap(([name, jsx]) =>
  ['features/home/X.tsx', 'app/x.tsx'].map((file): Fixture => [
    `${name} in ${file}`,
    file,
    component(jsx ?? ''),
  ])
);
COLORS_REJECTED.push([
  'a color constant',
  'shared/ui/X.tsx',
  "const ACCENT = '#ff0000';\n" + component('<Icon color={ACCENT} />'),
]);

const THEME_COLOR: Fixture = [
  'a theme color',
  'features/home/X.tsx',
  'declare const c: string;\n' + component('<Icon color={c} />'),
];
const COLORS_ALLOWED: Fixture[] = [
  [
    'transparent',
    'features/home/X.tsx',
    component('<Icon color="transparent" />'),
  ],
  [
    'a string passed to a function',
    'features/home/X.tsx',
    component("<Icon color={pick('primary')} />"),
  ],
  [
    'the palette in shared/ui/theme.ts',
    'shared/ui/theme.ts',
    "export const palette = { primary: '#066a92' };\n",
  ],
];
const ASSET_REQUIRE: Fixture = [
  'require() of a local image',
  'features/home/Logo.ts',
  "export const logo: unknown = require('../../assets/icon.png');\n",
];
const MODULE_REQUIRE: Fixture = [
  'require() of a module',
  'features/home/Logo.ts',
  "export const helpers: unknown = require('./helpers');\n",
];
const CONSOLE: Fixture = [
  'console',
  'shared/lib/x.ts',
  "export const f = () => console.log('x');\n",
];
const ANY: Fixture = [
  'any',
  'shared/lib/x.ts',
  'export const f = (value: any) => value;\n',
];
const DEFAULT_EXPORT: Fixture = [
  'a default export',
  'features/home/X.tsx',
  'const x = 1;\nexport default x;\n',
];

/**
 * Lints every fixture as if it were the file at its path, with the project's
 * config, in one separate Node process: ESLint loads its config with a
 * dynamic import, which Jest's module sandbox doesn't support. The files
 * don't exist, so type-aware rules (which need them in the TypeScript
 * program) are off; the rules under test don't use types.
 */
const LINT = `
const { ESLint } = require('eslint');
const fixtures = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const eslint = new ESLint({
  overrideConfig: [{
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { project: null } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
    },
  }],
});
(async () => {
  const out = [];
  for (const [file, code] of fixtures) {
    const [result] = await eslint.lintText(code, { filePath: file });
    out.push(result.messages);
  }
  process.stdout.write(JSON.stringify(out));
})();
`;

const results = new Map<string, string[]>();
const messagesFor = ([name]: Fixture) => results.get(name);

beforeAll(() => {
  const all = [
    ...IMPORTS_REJECTED,
    ...IMPORTS_ALLOWED,
    ...COLORS_REJECTED,
    ...COLORS_ALLOWED,
    THEME_COLOR,
    CONSOLE,
    ANY,
    ASSET_REQUIRE,
    MODULE_REQUIRE,
    DEFAULT_EXPORT,
  ];
  const run = spawnSync(process.execPath, ['-e', LINT], {
    cwd: ROOT,
    input: JSON.stringify(
      all.map(([, file, code]) => [path.join(ROOT, file), code])
    ),
    encoding: 'utf8',
  });
  if (run.status !== 0) throw new Error(run.stderr);
  const messages = JSON.parse(run.stdout) as {
    ruleId: string | null;
    message: string;
  }[][];
  all.forEach(([name], i) => {
    results.set(
      name,
      (messages[i] ?? [])
        .filter(message => message.ruleId !== 'prettier/prettier')
        .map(message => `${message.ruleId}: ${message.message}`)
    );
  });
}, 120000);

describe('lint: imports follow the dependency direction', () => {
  it.each(IMPORTS_REJECTED)('rejects %s', (...fixture) => {
    expect(messagesFor(fixture)).toEqual([
      expect.stringMatching(/^project\/import-boundaries: /),
    ]);
  });

  it.each(IMPORTS_ALLOWED)('allows %s', (...fixture) => {
    expect(messagesFor(fixture)).toEqual([]);
  });
});

describe('lint: colors come from the theme', () => {
  it.each(COLORS_REJECTED)('rejects %s', (...fixture) => {
    expect(messagesFor(fixture)).toContainEqual(
      expect.stringMatching(
        /^no-restricted-syntax: Use a color from the Paper theme/
      )
    );
  });

  it.each(COLORS_ALLOWED)('allows %s', (...fixture) => {
    expect(messagesFor(fixture)).toEqual([]);
  });

  it('allows a theme color, and still rejects default exports', () => {
    expect(messagesFor(THEME_COLOR)).toEqual([]);
    expect(messagesFor(DEFAULT_EXPORT)).toEqual([
      expect.stringMatching(/^no-restricted-syntax: Use a named export/),
    ]);
  });
});

describe('lint: ES imports, except require() of a local asset', () => {
  it('allows require() of an image, font, or media file', () => {
    expect(messagesFor(ASSET_REQUIRE)).toEqual([]);
  });

  it('rejects require() of a module', () => {
    expect(messagesFor(MODULE_REQUIRE)).toEqual([
      expect.stringMatching(/^@typescript-eslint\/no-require-imports: /),
    ]);
  });
});

describe('lint: logging, types, and promises', () => {
  it('rejects console and any', () => {
    expect(messagesFor(CONSOLE)).toEqual([
      expect.stringMatching(/^no-console: /),
    ]);
    expect(messagesFor(ANY)).toEqual([
      expect.stringMatching(/^@typescript-eslint\/no-explicit-any: /),
    ]);
  });

  // Type-aware, so off for the fixtures above (the files don't exist): check
  // the config that applies to a real source file instead.
  it('makes floating and misused promises errors', () => {
    const run = spawnSync(
      process.execPath,
      [
        '-e',
        `new (require('eslint').ESLint)()
          .calculateConfigForFile('shared/lib/useFetch.ts')
          .then(config => process.stdout.write(JSON.stringify(config.rules)))`,
      ],
      { cwd: ROOT, encoding: 'utf8' }
    );
    const rules = JSON.parse(run.stdout) as Record<string, unknown[]>;
    for (const rule of [
      '@typescript-eslint/no-floating-promises',
      '@typescript-eslint/no-misused-promises',
    ]) {
      expect(rules[rule]?.[0]).toBe(2); // error
    }
  });
});
