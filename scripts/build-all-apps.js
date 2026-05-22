#!/usr/bin/env node
/**
 * Build all NestJS monorepo applications listed in nest-cli.json.
 *
 * Quirk: nest-cli.json has `deleteOutDir: true`, so every individual
 * `nest build <app>` wipes dist/ first. We work around it by copying each
 * built main.js into the docker drop-folder immediately after its build,
 * before the next build wipes dist again.
 *
 * Output:
 *   docker/microservices/apps/<app>/main.js   (one per app, ready for Docker COPY)
 *
 * Used by: npm run build:docker
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST_APPS = path.join(ROOT, 'dist', 'apps');
const DROP_FOLDER = path.join(ROOT, 'docker', 'microservices', 'apps');

const cli = JSON.parse(fs.readFileSync(path.join(ROOT, 'nest-cli.json'), 'utf8'));
const apps = Object.entries(cli.projects || {})
  .filter(([_, p]) => p.type === 'application')
  .map(([name]) => name);

if (apps.length === 0) {
  console.error('No applications found in nest-cli.json.');
  process.exit(1);
}

// Wipe the drop-folder so stale outputs from previous builds don't linger.
fs.rmSync(DROP_FOLDER, { recursive: true, force: true });
fs.mkdirSync(DROP_FOLDER, { recursive: true });

console.log(`Building ${apps.length} apps: ${apps.join(', ')}\n`);

const succeeded = [];
const failed = [];

for (const app of apps) {
  process.stdout.write(`[build] ${app} … `);

  const result = spawnSync(
    'npx',
    ['nest', 'build', app],
    { stdio: ['ignore', 'pipe', 'pipe'], cwd: ROOT, shell: true }
  );

  const builtMain = path.join(DIST_APPS, app, 'main.js');
  if (result.status === 0 && fs.existsSync(builtMain)) {
    // Copy main.js to the drop-folder before next build deletes dist/.
    const dest = path.join(DROP_FOLDER, app);
    fs.mkdirSync(dest, { recursive: true });
    fs.copyFileSync(builtMain, path.join(dest, 'main.js'));
    console.log('OK');
    succeeded.push(app);
  } else {
    console.log('FAILED');
    failed.push({
      app,
      stderr: (result.stderr?.toString() || '').split('\n').slice(0, 8).join('\n'),
    });
  }
}

console.log(`\n=== Build summary ===`);
console.log(`✔ ${succeeded.length}/${apps.length} succeeded: ${succeeded.join(', ')}`);
if (failed.length > 0) {
  console.log(`✘ ${failed.length} failed: ${failed.map((f) => f.app).join(', ')}`);
  console.log(`\nFirst lines of each failure:`);
  for (const { app, stderr } of failed) {
    console.log(`\n--- ${app} ---\n${stderr}`);
  }
  // Continue (don't exit non-zero) — the rest of build:docker still runs to
  // populate .env etc. for the apps that did build.
}
