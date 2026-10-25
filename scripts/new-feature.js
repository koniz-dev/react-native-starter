#!/usr/bin/env node
/**
 * Scaffolds a feature with one screen (see docs/conventions.md#adding-a-screen):
 *
 * - features/<name>/screens/<Name>Screen.tsx, a named export;
 * - the one-line route file: app/<name>.tsx (public, the default),
 *   app/(app)/<name>.tsx (signed-in), or app/(tabs)/<name>.tsx (tab, which
 *   also declares the tab in app/(tabs)/_layout.tsx);
 * - its title string, `<name>.title`, in shared/i18n/en.ts;
 * - __tests__/features/<name>/<Name>Screen.test.tsx, which opens the route.
 *
 * It checks the name and every target before it writes anything, so a
 * refused name changes nothing (exit code 2).
 *
 * Usage: npm run new-feature -- <name> [--route public|signed-in|tab]
 * The name is kebab-case (`settings`, `order-history`).
 * Exit codes: 0 done, 2 refused (nothing changed), 1 failed while writing.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const USAGE = `Usage: npm run new-feature -- <name> [--route public|signed-in|tab]

  <name>     kebab-case feature name, such as settings or order-history
  --route    public (app/<name>.tsx, the default), signed-in
             (app/(app)/<name>.tsx), or tab (app/(tabs)/<name>.tsx)
  --help     show this help
`;
const ROUTES = {
  public: 'app',
  'signed-in': 'app/(app)',
  tab: 'app/(tabs)',
};
const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
// `index` is a group's first screen, not a path.
const RESERVED = new Set(['index']);
const I18N = 'shared/i18n/en.ts';
const TAB_LAYOUT = 'app/(tabs)/_layout.tsx';

class Refusal extends Error {}

function parseArgs(args) {
  if (args.includes('--help')) return { help: true };
  let name;
  let route = 'public';
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--route') {
      route = args[i + 1];
      i += 1;
      if (!route || !(route in ROUTES)) {
        throw new Refusal(
          `--route must be one of: ${Object.keys(ROUTES).join(', ')}.`
        );
      }
    } else if (arg.startsWith('-') || name !== undefined) {
      throw new Refusal(`Unexpected argument: ${arg}`);
    } else {
      name = arg;
    }
  }
  if (name === undefined) throw new Refusal('Give the feature a name.');
  return { name, route };
}

function names(name) {
  const words = name.split('-');
  const pascal = words.map(w => w[0].toUpperCase() + w.slice(1)).join('');
  return {
    name,
    pascal,
    camel: pascal[0].toLowerCase() + pascal.slice(1),
    title: words.join(' ').replace(/^./, c => c.toUpperCase()),
  };
}

const exists = rel => fs.existsSync(path.join(ROOT, rel));
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Every route group's file or folder for this name, at any depth of app/. */
function existingRoutes(name) {
  const found = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), {
      withFileTypes: true,
    })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.name === name || entry.name.replace(/\.tsx?$/, '') === name) {
        found.push(rel);
      }
      if (entry.isDirectory() && /^\(.*\)$/.test(entry.name)) walk(rel);
    }
  };
  walk('app');
  return found;
}

function checkName(name) {
  if (!NAME.test(name)) {
    throw new Refusal(
      `"${name}" is not a kebab-case name (lowercase letters, digits, and single hyphens, starting with a letter).`
    );
  }
  if (RESERVED.has(name)) {
    throw new Refusal(`"${name}" is reserved; choose another name.`);
  }
  // @demo remove-block-start
  // demo- folders are the demo's: npm run remove-demo deletes them.
  if (name.startsWith('demo-')) {
    throw new Refusal(`"${name}" is reserved; choose another name.`);
  }
  // @demo remove-block-end
}

function checkFree(n) {
  const taken = [`features/${n.name}`, `__tests__/features/${n.name}`].filter(
    exists
  );
  taken.push(...existingRoutes(n.name));
  if (read(I18N).includes(`'${n.camel}.`)) {
    taken.push(`${I18N} (keys starting with ${n.camel}.)`);
  }
  if (taken.length > 0) {
    throw new Refusal(`"${n.name}" already exists: ${taken.join(', ')}.`);
  }
}

function screenFile(n, route) {
  const key = `${n.camel}.title`;
  // A screen under the root stack shows its own header with a back button;
  // the signed-in group's layout shows one already; tabs have none.
  const header = {
    public: `      <Stack.Screen options={{ headerShown: true, title: t('${key}') }} />\n`,
    'signed-in': `      <Stack.Screen options={{ title: t('${key}') }} />\n`,
    tab: '',
  }[route];
  return `import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
${header ? "import { Stack } from 'expo-router';\n" : ''}import { Text, useTheme } from 'react-native-paper';
import { t } from '@/shared/i18n';
import { DocumentTitle } from '@/shared/ui/DocumentTitle';

/** The ${n.title} screen (\`/${n.name}\`). */
export function ${n.pascal}Screen() {
  const theme = useTheme();
  return (
    <SafeAreaView
${header ? "      edges={['bottom', 'left', 'right']}\n" : ''}      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
${header}      <DocumentTitle title={t('${key}')} />
      <Text
        variant="headlineMedium"
        accessibilityRole="header"
        style={styles.content}
        testID="${n.name}-title"
      >
        {t('${key}')}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center' },
});
`;
}

function testFile(n, route) {
  const signedIn = route === 'signed-in';
  return `import { renderRouter, screen } from 'expo-router/testing-library';
${
  signedIn
    ? `import { setItem, STORAGE_KEYS } from '@/shared/storage/storage';
import { secureStore } from '@/testing';
`
    : ''
}
describe('<${n.pascal}Screen />', () => {
  it('opens at /${n.name} with its title', async () => {
${
  signedIn
    ? `    // The route needs sign-in: store a session for the app to restore.
    secureStore.set(STORAGE_KEYS.AUTH_TOKEN, 'stored-token');
    await setItem(STORAGE_KEYS.USER_DATA, {
      id: 1,
      email: 'user@example.com',
      name: 'User',
    });
`
    : ''
}    const app = await renderRouter('./app', { initialUrl: '/${n.name}' });

    expect(await screen.findByTestId('${n.name}-title')).toHaveTextContent(
      '${n.title}'
    );
    expect(app.getPathname()).toBe('/${n.name}');
  });
});
`;
}

function withString(source, n) {
  const end = '} as const;';
  if (!source.includes(end)) {
    throw new Refusal(`${I18N} has no "${end}" to add the string before.`);
  }
  return source.replace(
    end,
    `\n  // ${n.title}\n  '${n.camel}.title': '${n.title}',\n${end}`
  );
}

function withTab(source, n) {
  const end = '    </Tabs>';
  if (!source.includes(end)) {
    throw new Refusal(`${TAB_LAYOUT} has no "</Tabs>" to add the tab before.`);
  }
  // Tabs route only the screens declared here (Expo Router 58).
  const tab = `      <Tabs.Screen
        name="${n.name}"
        options={{
          title: t('${n.camel}.title'),
          tabBarAccessibilityLabel: t('${n.camel}.title'),
          tabBarButtonTestID: 'tab-${n.name}',
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="circle-outline"
              size={24}
              color={focused ? tabBar.active : tabBar.inactive}
              aria-hidden
            />
          ),
        }}
      />
`;
  return source.replace(end, `${tab}${end}`);
}

async function format(files) {
  const prettier = require('prettier');
  for (const file of files) {
    const filepath = path.join(ROOT, file.path);
    const options = (await prettier.resolveConfig(filepath)) ?? {};
    file.text = await prettier.format(file.text, { ...options, filepath });
  }
}

async function main(args) {
  const { help, name, route } = parseArgs(args);
  if (help) {
    process.stdout.write(USAGE);
    return;
  }
  checkName(name);
  const n = names(name);
  checkFree(n);

  const routeFile = `${ROUTES[route]}/${n.name}.tsx`;
  const files = [
    {
      path: `features/${n.name}/screens/${n.pascal}Screen.tsx`,
      text: screenFile(n, route),
    },
    {
      path: routeFile,
      text: `export { ${n.pascal}Screen as default } from '@/features/${n.name}/screens/${n.pascal}Screen';\n`,
    },
    { path: I18N, text: withString(read(I18N), n) },
    {
      path: `__tests__/features/${n.name}/${n.pascal}Screen.test.tsx`,
      text: testFile(n, route),
    },
  ];
  if (route === 'tab') {
    files.push({ path: TAB_LAYOUT, text: withTab(read(TAB_LAYOUT), n) });
  }
  await format(files);

  for (const file of files) {
    const target = path.join(ROOT, file.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.text);
  }
  process.stdout.write(
    `Created the ${n.title} feature (/${n.name}, ${route}):\n` +
      files.map(file => `  ${file.path}\n`).join('') +
      `\nNext: build the screen, add its strings to ${I18N}, and run\n` +
      'npm run lint && npm run type-check && npm run test:ci.\n'
  );
}

main(process.argv.slice(2)).catch(error => {
  if (error instanceof Refusal) {
    process.stderr.write(`new-feature: ${error.message}\n\n${USAGE}`);
    process.exitCode = 2;
  } else {
    process.stderr.write(`new-feature: ${error.stack ?? error}\n`);
    process.exitCode = 1;
  }
});
