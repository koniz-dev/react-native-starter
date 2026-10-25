/**
 * @jest-environment node
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { copyProject, projectFiles } from '@/testing/projectCopy';

function run(dir: string, args: string[]) {
  return spawnSync(process.execPath, ['scripts/new-feature.js', ...args], {
    cwd: dir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

const read = (dir: string, file: string) =>
  fs.readFileSync(path.join(dir, file), 'utf8');

/** Every project file and its contents, to check that nothing changed. */
function snapshot(dir: string): Record<string, string> {
  return Object.fromEntries(
    projectFiles(dir).map(file => [file, read(dir, file)])
  );
}

// Names an adopter's own features are unlikely to use, so the test still
// runs in a project made from the template.
describe('new-feature on a copy of the template', () => {
  const copies: string[] = [];
  const copy = () => {
    const dir = copyProject('new-feature-');
    copies.push(dir);
    return dir;
  };
  afterAll(() => {
    for (const dir of copies) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('scaffolds a public, a signed-in, and a tab feature that type-check and are formatted', () => {
    const dir = copy();
    for (const args of [
      ['scaffold-public'],
      ['scaffold-signed-in', '--route', 'signed-in'],
      ['scaffold-tab', '--route', 'tab'],
    ]) {
      const result = run(dir, args);
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
    }

    const screen = read(
      dir,
      'features/scaffold-signed-in/screens/ScaffoldSignedInScreen.tsx'
    );
    expect(screen).toContain('export function ScaffoldSignedInScreen()');
    expect(screen).not.toMatch(/export default/);
    expect(read(dir, 'app/scaffold-public.tsx')).toBe(
      "export { ScaffoldPublicScreen as default } from '@/features/scaffold-public/screens/ScaffoldPublicScreen';\n"
    );
    expect(read(dir, 'app/(app)/scaffold-signed-in.tsx')).toContain(
      'ScaffoldSignedInScreen as default'
    );
    expect(read(dir, 'app/(tabs)/scaffold-tab.tsx')).toContain(
      'ScaffoldTabScreen as default'
    );
    // A public screen has its own header; a signed-in one gets the group's.
    expect(
      read(dir, 'features/scaffold-public/screens/ScaffoldPublicScreen.tsx')
    ).toContain('headerShown: true');
    expect(screen).not.toContain('headerShown');
    expect(
      read(dir, 'features/scaffold-tab/screens/ScaffoldTabScreen.tsx')
    ).not.toMatch(/Stack|edges=/);

    const en = read(dir, 'shared/i18n/en.ts');
    expect(en).toContain("'scaffoldPublic.title': 'Scaffold public',");
    expect(en).toContain("'scaffoldSignedIn.title': 'Scaffold signed in',");
    expect(en).toContain("'scaffoldTab.title': 'Scaffold tab',");
    // Tabs route only declared screens.
    expect(read(dir, 'app/(tabs)/_layout.tsx')).toMatch(
      /name="scaffold-tab"[\s\S]*t\('scaffoldTab\.title'\)[\s\S]*<\/Tabs>/
    );
    expect(
      read(
        dir,
        '__tests__/features/scaffold-signed-in/ScaffoldSignedInScreen.test.tsx'
      )
    ).toContain("initialUrl: '/scaffold-signed-in'");

    const generated = [
      'features',
      'app',
      'shared/i18n/en.ts',
      '__tests__/features',
    ];
    const prettier = spawnSync(
      process.execPath,
      [require.resolve('prettier/bin/prettier.cjs'), '--check', ...generated],
      { cwd: dir, encoding: 'utf8' }
    );
    expect(prettier.stdout + prettier.stderr).toContain(
      'All matched files use Prettier code style!'
    );
    const tsc = spawnSync(
      process.execPath,
      [require.resolve('typescript/bin/tsc'), '--noEmit'],
      { cwd: dir, encoding: 'utf8' }
    );
    expect(tsc.stdout + tsc.stderr).toBe('');
    expect(tsc.status).toBe(0);
  }, 120_000);

  it.each([
    [['Settings'], 'is not a kebab-case name'],
    [['order_history'], 'is not a kebab-case name'],
    [['order--history'], 'is not a kebab-case name'],
    [['2fa'], 'is not a kebab-case name'],
    [['index'], 'is reserved'],
    [['demo-notes'], 'is reserved'], // @demo remove-current-line
    [['home'], 'already exists: features/home'],
    [['login'], 'already exists: app/(auth)/login.tsx'],
    [['common'], 'keys starting with common.'],
    [[], 'Give the feature a name'],
    [['notes', 'more'], 'Unexpected argument: more'],
    [['notes', '--route', 'modal'], '--route must be one of'],
    [['notes', '--dry-run'], 'Unexpected argument: --dry-run'],
  ])('refuses %j and changes nothing', (args, message) => {
    const dir = copies[0] ?? copy();
    const before = snapshot(dir);

    const result = run(dir, args);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain(message);
    expect(snapshot(dir)).toEqual(before);
  });
});
