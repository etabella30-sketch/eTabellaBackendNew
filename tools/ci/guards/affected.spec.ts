import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

/*
 * tools/ci/affected.js answers "which apps must be rebuilt and uploaded after this change" from the real import
 * graph (Phase 2 of the shared-libraries plan, replacing a lib-aware Jenkins step with a command). Half of this spec
 * runs it on the real repo, so a Phase 1 fact such as "libs/global imports @app/api-kernel" is proven, not assumed;
 * the other half uses a small synthetic graph where every path is predictable.
 */

const REPO = path.resolve(__dirname, '..', '..', '..');
const requireJs = createRequire(__filename);
const affected = requireJs(path.join(REPO, 'tools', 'ci', 'affected.js'));

const SYNTHETIC = {
  apps: ['alpha', 'beta', 'gamma', 'rt-edge'],
  libs: ['kernel', 'glue', 'perm', 'lonely'],
  consumers: { kernel: ['beta'], glue: ['alpha', 'beta'], perm: ['rt-edge'], lonely: [] },
  libImports: { kernel: [], glue: ['kernel'], perm: ['kernel'], lonely: [] },
};

describe('tools/ci/affected.js on the real repo', () => {
  const graph = affected.loadGraph(fs, REPO);

  it('reads the apps from nest-cli.json and the libs from lib-consumers.json', () => {
    expect(graph.apps).toEqual(expect.arrayContaining(['authapi', 'coreapi', 'realtime-server', 'rt-edge']));
    expect(graph.libs).toEqual(expect.arrayContaining(['global', 'api-kernel', 'permissions', 'api-contracts', 'rt-features', 'platform-cloud']));
  });

  it('sees the Phase 1 lib-to-lib imports and the kernel importing no other lib', () => {
    expect(graph.libImports.global).toEqual(expect.arrayContaining(['api-kernel', 'permissions']));
    expect(graph.libImports['api-kernel']).toEqual([]);
    expect(graph.libImports['rt-edge']).toBeUndefined();
  });

  it('a change in libs/api-kernel rebuilds realtime-server directly and every consumer of libs/global through it', () => {
    const r = affected.classify(['libs/api-kernel/src/caller.ts'], graph);
    expect(r.libs.changed).toEqual(['api-kernel']);
    expect(r.libs.stale).toEqual(expect.arrayContaining(['global']));
    expect(r.apps['realtime-server']).toEqual(expect.arrayContaining(['libs/api-kernel']));
    expect(r.apps.authapi).toEqual(['libs/api-kernel -> libs/global']);
    // coreapi reaches the kernel through global, and since Phase 5 through platform-cloud and rt-features as well.
    expect(r.apps.coreapi).toEqual(expect.arrayContaining(['libs/api-kernel -> libs/global', 'libs/api-kernel -> libs/platform-cloud', 'libs/api-kernel -> libs/rt-features']));
    expect(r.deployOrder[0]).toBe('realtime-server');
  });

  it('the box is affected by its own sources and by the edge libs, and is always last in the upload order', () => {
    const r = affected.classify(['apps/rt-edge/src/main.ts', 'apps/realtime-server/src/x.ts', 'libs/edge-sync/src/y.ts'], graph);
    expect(Object.keys(r.apps).sort()).toEqual(['realtime-server', 'rt-edge']);
    expect(r.apps['rt-edge']).toEqual(['apps/rt-edge/src/main.ts', 'libs/edge-sync']);
    expect(r.deployOrder).toEqual(['realtime-server', 'rt-edge']);
    expect(affected.render(r, 'spec').join('\n')).toContain('npm run package:box');
    expect(affected.render(r, 'spec').join('\n')).toContain('the box last');
  });

  it('root build files touch every app; tooling, docs and specs touch none', () => {
    expect(Object.keys(affected.classify(['package.json'], graph).apps)).toEqual(graph.apps);
    const none = affected.classify(['tools/ci/affected.js', 'docs/x.md', 'apps/rt-edge/src/a.spec.ts', 'libs/global/src/b.spec.ts', 'apps/rt-edge/e2e/x.e2e-spec.ts'], graph);
    expect(none.apps).toEqual({});
    expect(none.tests).toHaveLength(3);
    expect(none.ignored).toHaveLength(2);
  });

  it('SQL migrations and the launcher are notes, not rebuilds', () => {
    const r = affected.classify(['assets/sql-migrations/2026-10-06_x.sql', 'apps/rt-edge/packaging/windows/run.bat'], graph);
    expect(r.apps).toEqual({});
    expect(r.db).toEqual(['assets/sql-migrations/2026-10-06_x.sql']);
    expect(r.packaging).toEqual(['apps/rt-edge/packaging/windows/run.bat']);
    expect(affected.render(r, 'spec').join('\n')).toContain('apply by hand');
  });
});

describe('tools/ci/affected.js on a synthetic graph', () => {
  it('follows lib imports transitively and names the path each app is stale through', () => {
    const r = affected.classify(['libs/kernel/src/x.ts'], SYNTHETIC);
    expect(r.libs.stale).toEqual(['glue', 'perm']);
    expect(r.apps).toEqual({
      alpha: ['libs/kernel -> libs/glue'],
      beta: ['libs/kernel', 'libs/kernel -> libs/glue'],
      'rt-edge': ['libs/kernel -> libs/perm'],
    });
    expect(r.deployOrder).toEqual(['alpha', 'beta', 'rt-edge']);
  });

  it('a lib nobody imports affects nothing, and a lib tsconfig counts as a lib change', () => {
    expect(affected.classify(['libs/lonely/src/x.ts'], SYNTHETIC).apps).toEqual({});
    expect(Object.keys(affected.classify(['libs/glue/tsconfig.lib.json'], SYNTHETIC).apps)).toEqual(['alpha', 'beta']);
  });

  it('backslash and ./ prefixed paths are read as repo paths; unknown apps are left unclassified', () => {
    const r = affected.classify(['apps\\beta\\src\\a.ts', './apps/zeta/src/b.ts'], SYNTHETIC);
    expect(r.apps).toEqual({ beta: ['apps/beta/src/a.ts'] });
    expect(r.other).toEqual(['apps/zeta/src/b.ts']);
  });

  it('staleLibs reports the changed lib each stale lib traces back to', () => {
    const stale = affected.staleLibs(['kernel'], SYNTHETIC.libImports);
    expect([...stale.entries()]).toEqual([['kernel', 'kernel'], ['glue', 'kernel'], ['perm', 'kernel']]);
  });

  it('the scanner ignores commented-out imports and sees every import form', () => {
    const code = affected.stripComments([
      "// import { A } from '@app/alpha-queue';",
      "/* import x from '@app/mipl-queue' */",
      "import { DbService } from '@app/global/db/pg/db.service';",
      "export * from '@app/edge-token';",
      "import '@app/feed-parse/side-effect';",
      "const lazy = import('@app/rt-ingest');",
      "const cjs = require('@app/edge-sync');",
      "const text = 'from @app/permissions';",
    ].join('\n'));
    expect(affected.specifiers(code).filter((s: string) => s.startsWith('@app/')).sort()).toEqual(['@app/edge-sync', '@app/edge-token', '@app/feed-parse/side-effect', '@app/global/db/pg/db.service', '@app/rt-ingest']);
  });
});
