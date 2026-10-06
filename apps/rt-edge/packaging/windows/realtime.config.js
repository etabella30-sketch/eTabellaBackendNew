/**
 * PM2 ecosystem file for eTabella RT local (the venue box). Same shape as the legacy RT local deployment, so an
 * operator who knows that one has nothing new to learn:
 *
 *   - fork mode, single instance (the box holds one reporter connection and one journal per session in memory;
 *     it must never be clustered)
 *   - autorestart on crash (what was received is on disk in data\ and is sent to etabella.net after the restart)
 *   - 4G memory ceiling before PM2 restarts it
 *
 * Settings live in `.env.production`. They are turned into box.json (what main.js reads) every time PM2 loads this
 * file, by env-config.js. Run via:
 *   pm2 start realtime.config.js --env production
 * (run.bat does the install and the start for you.)
 * Logs:  pm2 logs "eTabella RT box"      Status:  pm2 status
 */
require('./env-config').apply();

module.exports = {
  apps: [
    {
      // Not "eTabella RT local": that name belongs to the legacy deployment, which may be registered in the same
      // PM2. Quote the name in ad-hoc commands, e.g.  pm2 logs "eTabella RT box".
      name: 'eTabella RT box',
      script: 'main.js',
      args: '--config box.json',
      cwd: __dirname,
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      // Give the box time to write its journals to disk when PM2 stops it.
      kill_timeout: 20000,
      // A crash loop (for example the port is taken) backs off instead of spinning.
      exp_backoff_restart_delay: 1000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
