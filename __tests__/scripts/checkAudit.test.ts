/**
 * @jest-environment node
 */
import path from 'path';

interface AllowlistEntry {
  id: string;
  package: string;
  severity?: string;
  reviewBy?: string;
  tracking: string;
}

type FixAvailable =
  boolean | { name: string; version: string; isSemVerMajor: boolean };

const { evaluate } = jest.requireActual<{
  evaluate: (
    report: unknown,
    allowlist: AllowlistEntry[],
    today: string
  ) => { lines: string[]; problems: string[] };
}>(path.resolve(__dirname, '../../scripts/check-audit.js'));

const TODAY = '2026-10-12';

/** An `npm audit --json` report with one advisory on `pkg`. */
function report(
  pkg: string,
  severity: string,
  fixAvailable: FixAvailable = false
) {
  return {
    vulnerabilities: {
      [pkg]: {
        severity,
        fixAvailable,
        via: [
          {
            name: pkg,
            severity,
            title: `${pkg} issue`,
            url: `https://github.com/advisories/GHSA-${pkg}`,
          },
        ],
      },
      // A package that depends on it: npm lists the advisory by name only.
      parent: { severity, fixAvailable: false, via: [pkg] },
    },
    metadata: { vulnerabilities: { [severity]: 2 } },
  };
}

function entry(pkg: string, reviewBy = '2027-01-09'): AllowlistEntry {
  return {
    id: `GHSA-${pkg}`,
    package: pkg,
    severity: 'high',
    reviewBy,
    tracking: `https://github.com/advisories/GHSA-${pkg}`,
  };
}

describe('check-audit', () => {
  it('fails on a high advisory that is not reviewed', () => {
    const { problems } = evaluate(report('forge', 'high'), [], TODAY);
    expect(problems).toEqual([
      expect.stringContaining('GHSA-forge (forge issue) is not in'),
    ]);
  });

  it('passes an allowlisted advisory without a fix in range', () => {
    const { problems, lines } = evaluate(
      report('forge', 'high', {
        name: 'expo',
        version: '44.0.6',
        isSemVerMajor: true,
      }),
      [entry('forge')],
      TODAY
    );
    expect(problems).toEqual([]);
    expect(lines[0]).toContain('allowlisted until 2027-01-09');
  });

  it('fails once npm can fix an allowlisted advisory within the ranges', () => {
    for (const fixAvailable of [
      true,
      { name: 'forge', version: '1.4.1', isSemVerMajor: false },
    ]) {
      const { problems } = evaluate(
        report('forge', 'high', fixAvailable),
        [entry('forge')],
        TODAY
      );
      expect(problems).toEqual([
        expect.stringContaining('forge GHSA-forge: a fix is now available'),
      ]);
    }
  });

  it('fails when an allowlist review has expired', () => {
    const { problems } = evaluate(
      report('forge', 'high'),
      [entry('forge', '2026-10-11')],
      TODAY
    );
    expect(problems).toEqual([
      expect.stringContaining('review expired on 2026-10-11'),
    ]);
  });

  it.each([undefined, '2027-1-9', '2027/01/09', 'Jan 9 2027', '2027-02-30'])(
    'fails when an allowlist entry has reviewBy %j, not a YYYY-MM-DD date',
    reviewBy => {
      const { problems } = evaluate(
        report('forge', 'high'),
        [{ ...entry('forge'), reviewBy }],
        TODAY
      );
      expect(problems).toEqual([
        'scripts/audit-allowlist.json advisories[0]: "reviewBy" must be a date (YYYY-MM-DD)',
      ]);
    }
  );

  it('fails when an advisory is re-scored above its review', () => {
    const { problems } = evaluate(
      report('forge', 'critical'),
      [entry('forge')],
      TODAY
    );
    expect(problems).toEqual([
      'forge GHSA-forge: now critical, reviewed as high; review it again.',
    ]);
  });

  it('fails when npm reports the advisory on another package', () => {
    const { problems } = evaluate(
      report('forge', 'high'),
      [{ ...entry('forge'), package: 'other' }],
      TODAY
    );
    expect(problems).toEqual([
      'GHSA-forge: allowlisted for other, but npm reports it on forge; review it for that package.',
    ]);
  });

  it.each([
    ['9999-12-31', false],
    ['2027-04-14', false],
    ['2027-04-13', true],
  ])('accepts a reviewBy at most 183 days away (%s)', (reviewBy, accepted) => {
    const { problems } = evaluate(
      report('forge', 'high'),
      [entry('forge', reviewBy)],
      TODAY
    );
    expect(problems).toEqual(
      accepted
        ? []
        : [
            `scripts/audit-allowlist.json advisories[0]: "reviewBy" ${reviewBy} is more than 183 days away; review it again sooner`,
          ]
    );
  });

  it('fails when an entry has no severity, or not high or critical', () => {
    for (const severity of [undefined, 'moderate']) {
      const { problems } = evaluate(
        report('forge', 'high'),
        [{ ...entry('forge'), severity }],
        TODAY
      );
      expect(problems).toEqual([
        'scripts/audit-allowlist.json advisories[0]: "severity" must be high or critical',
      ]);
    }
  });

  it('fails when an allowlist entry has no id, package, or tracking link', () => {
    const { problems } = evaluate(
      report('forge', 'high'),
      [{ ...entry('forge'), id: '', package: ' ', tracking: undefined! }],
      TODAY
    );
    expect(problems).toEqual(
      ['id', 'package', 'tracking'].map(
        key => `scripts/audit-allowlist.json advisories[0]: "${key}" is missing`
      )
    );
  });

  it('lists the most severe advisories first', () => {
    const merged = (...reports: ReturnType<typeof report>[]) => ({
      vulnerabilities: Object.assign(
        {},
        ...reports.map(r => r.vulnerabilities)
      ),
      metadata: { vulnerabilities: {} },
    });
    const { lines } = evaluate(
      merged(
        report('alpha', 'low'),
        report('bravo', 'moderate'),
        report('charlie', 'critical'),
        report('delta', 'high')
      ),
      [entry('charlie'), entry('delta')].map(e =>
        e.package === 'charlie' ? { ...e, severity: 'critical' } : e
      ),
      TODAY
    );
    expect(lines.slice(0, 4).map(line => line.split(/\s+/)[0])).toEqual([
      'critical',
      'high',
      'moderate',
      'low',
    ]);
  });

  it('reports moderate advisories without failing', () => {
    const { problems, lines } = evaluate(
      report('query', 'moderate', true),
      [],
      TODAY
    );
    expect(problems).toEqual([]);
    expect(lines[0]).toContain('reported (not gated)');
  });

  it.each([
    [
      'an npm error',
      {
        message:
          'request to https://registry/advisories failed, reason: ECONNREFUSED',
        error: { summary: '', detail: '' },
      },
    ],
    ['a report without results', {}],
  ])('fails on %s instead of reporting nothing', (_case, badReport) => {
    const { problems } = evaluate(badReport, [entry('forge')], TODAY);
    expect(problems).toEqual([
      expect.stringContaining('npm audit did not complete'),
    ]);
  });

  it('notes an allowlisted advisory that npm no longer reports', () => {
    const { problems, lines } = evaluate(
      { vulnerabilities: {}, metadata: { vulnerabilities: {} } },
      [entry('forge')],
      TODAY
    );
    expect(problems).toEqual([]);
    expect(lines).toContain(
      'note: forge GHSA-forge is allowlisted but no longer reported; remove the entry.'
    );
  });
});
