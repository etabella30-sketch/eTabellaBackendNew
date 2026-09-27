#!/usr/bin/env node
/**
 * Build enabled Docker applications, or the application names passed as arguments.
 *
 * Disable deleteOutDir for this build so locally running services keep their
 * output. Publish each successful bundle to the Docker drop-folder. A failed
 * compile removes that service's old bundle and fails the command.
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
const available = Object.entries(cli.projects || {})
  .filter(([_, p]) => p.type === 'application')
  .map(([name]) => name);
// Match the enabled Compose services. The legacy backup app is not deployable.
const requested = process.argv.slice(2);
const apps = requested.length ? [...new Set(requested)] : available.filter(name => name !== 'backup');
const unknown = apps.filter(name => !available.includes(name));
if (unknown.length) {
  console.error(`Unknown applications: ${unknown.join(', ')}`);
  process.exit(1);
}

if (apps.length === 0) {
  console.error('No applications found in nest-cli.json.');
  process.exit(1);
}

// Keep other services' bundles when doing a targeted rebuild.
fs.mkdirSync(DROP_FOLDER, { recursive: true });

// Preserve outputs used by other locally running services.
const buildConfig = path.join(ROOT, `.nest-docker-${process.pid}.json`);
fs.writeFileSync(buildConfig, JSON.stringify({
  ...cli,
  compilerOptions: { ...cli.compilerOptions, deleteOutDir: false },
}));
process.on('exit', () => fs.rmSync(buildConfig, { force: true }));

console.log(`Building ${apps.length} apps: ${apps.join(', ')}\n`);

const succeeded = [];
const failed = [];

for (const app of apps) {
  process.stdout.write(`[build] ${app} … `);

  // A failed build must never leave an old deployable bundle for this service.
  const dest = path.join(DROP_FOLDER, app);
  fs.rmSync(path.join(dest, 'main.js'), { force: true });

  const result = spawnSync(
    process.execPath,
    [require.resolve('@nestjs/cli/bin/nest.js'), 'build', app, '--config', path.basename(buildConfig)],
    { stdio: ['ignore', 'pipe', 'pipe'], cwd: ROOT }
  );

  const builtMain = path.join(DIST_APPS, app, 'main.js');
  if (result.status === 0 && fs.existsSync(builtMain)) {
    // Copy main.js to the drop-folder before next build deletes dist/.
    fs.mkdirSync(dest, { recursive: true });
    fs.copyFileSync(builtMain, path.join(dest, 'main.js'));
    console.log('OK');
    succeeded.push(app);
  } else {
    console.log('FAILED');
    failed.push({
      app,
      stderr: [result.error?.message, result.stdout?.toString(), result.stderr?.toString()]
        .filter(Boolean).join('\n').split('\n').slice(-35).join('\n'),
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
  process.exitCode = 1;
}
