# eTabella RT local

One folder, like the legacy RT local: the program, its web pages, a settings file and a batch file to run it. It
runs under **PM2** as `eTabella RT box`.

| File / folder             | Purpose |
| ------------------------- | ------- |
| `run.bat`                 | Menu launcher. Double-click it. |
| `stop.bat`                | Stops local RT (removes its PM2 entry). |
| `.env.production`         | **Settings**: box name, time zone, live server, page port, sign-in, reporter port. Edit this one. Yours: an update never replaces it. |
| `.env.production.example` | The settings template a release ships. `run.bat` copies it to `.env.production` on the first start. |
| `realtime.config.js`      | The PM2 entry: one process, fork mode, restarts on a crash. |
| `main.js`                 | The local RT program (built from `apps/rt-edge` in the backend repo). |
| `public\`                 | Its web pages (the frontend `edge` build). |
| `release.json`            | What this `main.js` + `public\` were built from (version, commits, checksums, `depsChanged`). The box shows the version on its status page. |
| `data\`                   | This box's identity and everything it recorded. **Do not delete**: lines not yet sent to etabella.net are here. |
| `box.json`                | GENERATED from `.env.production` on every start (`env-config.js`). Do not edit it. |
| `node_modules\`           | Runtime libraries. Installed by `run.bat` on first start if missing. |
| `box-url.js`              | Prints the address of the box page. |
| `make-cert.ps1`           | Only for `HTTPS=on`: makes a test certificate for the box address. |
| `send-to-box.js`          | Test feed: acts like a reporter's Eclipse connecting to this box. |

Needs Node.js 22 or newer and PM2 (`run.bat` installs PM2 if it is missing).

The launcher files live in the backend repo at `apps/rt-edge/packaging/windows/` and reach a box only through a
release package (`npm run package:box`, below). Fix them there, never on a box.

## The menu (`run.bat`)

| | |
| --- | --- |
| **[1] Fresh Setup** | First time on a PC: installs the packages and PM2, registers the box, starts it. |
| **[2] Start** | Starts the box. Run it again after changing a setting: it restarts with the new values. |
| **[3] Stop** | Stops the box. What it received stays in `data\` and is sent at the next start. |
| **[4] Settings** | Opens `.env.production` in Notepad. |
| **[5] View Logs** | Live log (Ctrl+C to leave). |
| **[6] View Status** | PM2 status, the link to etabella.net, sessions. |
| **[7] Open Browser** | Opens the box page and lists its address for the other devices. |
| **[8] Register** | Enrolment code from etabella.net (Admin › Venue boxes). First time, or after the box was revoked. |

By hand: `pm2 start realtime.config.js --env production`, `pm2 logs "eTabella RT box"`, `pm2 status`,
`pm2 restart realtime.config.js --env production`.

## Settings (`.env.production`)

| Setting | Meaning | Default |
| --- | --- | --- |
| `BOX_NAME` | Name shown on the box page | |
| `TIME_ZONE` | Venue time zone (IANA name) | |
| `LIVE_URL` | etabella server the transcript goes to | `https://etabella.net` |
| `PORT` | Port of the box page: `http://<this PC address>:<PORT>` | `4000` |
| `SIGN_IN` | `password` = etabella.net email + password on the box page. `cloud` = password on etabella.net (needs `HTTPS=on`) | `password` |
| `HTTPS` | `off` = plain http, no certificate. `on` = https on the box host name (certificate + `PORT=443`) | `off` |
| `TCP_PORT` | Port the reporter's Eclipse dials in to, when the session has no reporter IP | `2600` |
| `SETTINGS_ACCESS` | Who may open box settings: `super-admin` or `case-admin` | `super-admin` |
| `CONSOLE_PORT` | Service page on this PC only (`http://localhost:<port>`), `0` = off | `2601` |
| `DATA_DIR`, `PUBLIC_DIR` | Folders | `./data`, `./public` |

A wrong value is named when you start, and nothing is started until it is fixed. There is no password or key in
this file.

The reporter's IP address and port are **not** in this file: they are set per session on etabella.net (Admin ›
Realtime › Start session), or by a super admin on the box page (gear menu › Realtime transmitter).

## Every day

1. Double-click **`run.bat`**, choose **[2] Start**. The box page opens (`http://<this PC address>:4000`).
2. Sign in with your etabella.net **email and password**.
3. You see your session. **Open transcript** opens the live transcript; **Exit** comes back.
4. A super admin also sees the reporter connection, the connectivity log and the settings.
5. Lines go to etabella.net by themselves. Without internet they are kept here and sent when it is back.

With `HTTPS=off` the password travels from the device to this PC over plain http on the room network (from this
PC to etabella.net it is encrypted). Use it on a network you trust; on an open or shared Wi-Fi use `HTTPS=on`.

## First time on a new PC

1. Unzip the release package into a folder of its own and install Node.js. (A package never contains `data\`,
   `box.json` or a filled `.env.production`.)
2. On etabella.net: Admin › Venue boxes › **Add venue box**. Copy the enrolment code (it works once, for 15 minutes).
3. `run.bat` › **[4] Settings**: the settings file is made from the template; set the box name and time zone.
4. `run.bat` › **[1] Fresh Setup**, paste the code. It prints a key fingerprint.
5. On etabella.net open the box, **confirm the fingerprint**, and assign its cases.

**Registering again.** If the box was revoked or removed on etabella.net, register it as a new box: add a venue
box there, then `run.bat` › **[8] Register** › answer `y`. What the box recorded so far is kept in a
`data-old-<date>` folder. If the code is refused, the earlier registration is put back.

## Ports

| Port | Used for | Reachable from |
| ---- | -------- | -------------- |
| `PORT` (4000) | The box page: sign-in, session, live transcript, settings | The network |
| `TCP_PORT` (2600) | The reporter's Eclipse connecting in | The network |
| `CONSOLE_PORT` (2601) | Service page | This PC only |

## Updating

**Cloud first.** A box package relays team data (marks, claims, team members) to etabella.net, so the cloud must
already run what the package expects. Before any box:

1. In the backend repo: `node tools/ci/rt-deploy-check.js …` (refuses while a live venue session runs another parser
   version), then deploy realtime-server. `release.json` → `install.cloudFirst` names the commit.
2. Deploy coreapi (plus download and export if `CommonModule` changed) and authapi only if they changed. Which ones:
   `node tools/ci/affected.js`.
3. Verify each relayed route with a real edge token, and that the box still running the old package works
   against the new cloud.

**Box last**, only when no session is live on it:

1. Check: `run.bat` › **[6] View Status** (or `node main.js status --config box.json`): no session receiving, none
   unsealed.
2. `run.bat` › **[3] Stop**.
3. Rename `main.js` to `main.prev-<date>.js` and `public` to `public.prev-<date>`. Copy `data\edge.sqlite*` aside.
4. Copy the package's `main.js`, `public\` and `release.json` in.
5. Open the package's `release.json`. If `depsChanged` is `true`, copy its `package.json` and `package-lock.json`
   in too and run `npm ci --omit=dev` in this folder (`run.bat` skips the install when `node_modules\` exists).
   If it is `false`, `node_modules\` stays as it is.
6. `run.bat` › **[2] Start**.
7. Smoke test: open `http://<box>:<PORT>/edge/ping`, sign in, open the RT page, Fact › Share with my team shows the
   team, make one QFact.

Never touch `data\`, `box.json` or `.env.production`; the package has none of them.

**Rollback.** Stop; put the `.prev` files back (and `package.json` + `node_modules\` if they changed); start. No
package changes the box database schema without saying so in `release.json`.

## Staging rule

Rehearse every package first, never on an installed box:

- a spare PC, or a disposable folder of its own (the backend's `npm run package:box -- --smoke` makes one under
  `dist/box-smoke/<version>`, boots the package there and checks `/edge/ping`, `/edge-config.json` and
  `/edge/local/status`, then removes the process);
- a different PM2 name (or none: `node main.js --config box.json`), different ports (page 4100, reporter 5655,
  console 2701) and a fresh `data\`;
- never copy `device-key.pem` or `edge.sqlite` from an installed box: two uplinks on one identity;
- use the e2e fake cloud, or enrol the staging copy as a separate test box on dev.

## Building a release (developers)

From the backend repo, with the Angular repo checked out next to it:

```sh
npm run package:box                 # refuses a tree with uncommitted changes
npm run package:box -- --wip        # packages them, version stamped "+wip", paths listed in release.json
npm run package:box -- --smoke      # also boots the result once (staging rule above)
node tools/ci/package-box.js --dry-run
```

It runs the guard specs (G1), builds `rt-edge`, checks the bundle's runtime packages against
`tools/ci/box-externals.baseline.json` and this folder's `package.json` (G6), builds the FE `edge` configuration, and
stages `dist/box/<version>/` plus `dist/box/<version>.zip` with `main.js`, `public\`, this folder's files and
`release.json`. The version is `<date>-<backend commit>-<FE commit>[+wip]`.

`release.json` records the commits, the sha256 of `main.js` and of `public\`, the hash of `libs/` that went into the
bundle (`libsHash`), the runtime packages (`externals`, with `externalsNew` against the baseline), the hash of the
two package files (`depsSha256`) and `depsChanged`: `true` when the bundle needs a package the installed box does
not pin, or when `package.json` differs from the installed box it was compared to (`depsComparedTo`).

After a change in `libs/`, `node tools/ci/affected.js` lists every app to rebuild and upload (a lib fix must reach
every host that imports it, or "fix once" fails silently) and the upload order; the box is always last.
