# Venue box release: `release-edge` and `rt-deploy-check`

Plan: `docs/rt-local-edge-plan.md` in the Angular repo, decision R-SC1 / D6 (scripted release), D5 (`rt-deploy-check` lives in `tools/ci`), D13 (the golden replay gate blocks a release) and D2 (image signing and A/B updates are deferred to the rollout gate).

| Script | What it does |
|---|---|
| `tools/ci/release-edge.js` | From a clean annotated tag: runs the golden replay gate, builds the FE edge bundle and the `rt-edge` image, writes `dist/release/<tag>/manifest.json`, and pushes to `$REGISTRY` only with `--push`. |
| `tools/ci/rt-deploy-check.js` | Before a cloud deploy: refuses when any live venue box session runs a parser version other than the deploy's `FEED_PARSE_VERSION`. |

`FEED_PARSE_VERSION` lives in `libs/feed-parse/src/version.ts` and is exported from `@app/feed-parse`. Bump it whenever the golden replay output intentionally changes, and re-record the goldens with `node tools/ci/golden-replay-gate.js --update` in the same commit.

## Release steps

1. **Run the tests by hand (D6: tests stay a manual pre-tag step).** On the commit you are about to tag:
   ```sh
   node tools/ci/feed-parse-gate.js
   node tools/ci/golden-replay-gate.js
   npx jest apps/realtime-server libs
   npx jest -c tools/ci/release-edge/jest.config.js
   ```
   The last line is not optional: `npx jest` and `npm test` do not run the release tooling specs (see [Tests](#tests)). Some realtime-server suites already fail before this project (DI "should be defined" scaffolds). Compare against that list; do not tag on a new failure. In the Angular repo run `npx ng test --watch=false`.
2. **Tag the backend** with an annotated tag that can also name an image (letters, digits, `_ . -`):
   ```sh
   git tag -a rt-edge-v1.0.0 -m "venue box release 1.0.0"
   ```
   Commit the FE first. Tagging the FE commit with the same name is recommended, not required; the manifest records the FE commit either way.
3. **Dry run.** Prints the checks, every build step and the manifest it would write; runs, builds, writes and pushes nothing. Exit 1 means a real run would refuse, and the reasons are listed.
   ```sh
   node tools/ci/release-edge.js --fe ../eTabella-fe --dry-run
   ```
4. **Release.**
   ```sh
   node tools/ci/release-edge.js --fe ../eTabella-fe
   REGISTRY=registry.example.com/etabella node tools/ci/release-edge.js --fe ../eTabella-fe --push
   ```
   PowerShell: `$env:REGISTRY = "registry.example.com/etabella"`. Log in first (`docker login`); the script never logs in. Until `apps/rt-edge` and the FE `edge` configuration exist, add `--allow-missing`: the manifest then records those components as `missing`.
5. **Before any cloud deploy of realtime-server**, run the deploy check against production:
   ```sh
   RT_DEPLOY_CHECK_PG='postgres://…?sslmode=require' \
     node tools/ci/rt-deploy-check.js --manifest dist/release/rt-edge-v1.0.0/manifest.json --pg env:RT_DEPLOY_CHECK_PG
   ```
   A cloud deploy that is not an edge release uses that commit's version file instead: `--version-file libs/feed-parse/src/version.ts`.

## What release-edge refuses

Every reason is listed at once. The checks only read (git queries, and `docker version` / `docker image inspect` when `apps/rt-edge` exists); the gate does not run and nothing is built until all of them pass.

- The backend tree has any change or untracked file (ignored files such as `dist/` do not count).
- `HEAD` is not at an annotated tag, carries only a lightweight tag, or carries several annotated tags without `--tag <name>`; or the tag cannot name an image.
- `--fe` is missing, does not exist, or its tree is not clean. The main Angular checkout tracks `.claude-flow/*` runtime files that change constantly, so release from a separate clean clone or worktree at the release commit.
- `tools/ci/golden-replay-gate.js` does not exist. The gate is never optional, not even with `--allow-missing`.
- `FEED_PARSE_VERSION` cannot be read from `version.ts`.
- A component is missing and `--allow-missing` was not given, or a component exists but cannot be built here (blocked, see below).
- `--push` without `REGISTRY`, or `REGISTRY` with a scheme or a tag.

After the checks, the gate runs. A non-zero exit blocks the release and nothing is built. A failed build step stops the release and no manifest is written.

## Components

| Component | Built when | Blocked when | Steps |
|---|---|---|---|
| `fe-edge` (FE edge bundle) | an application project in the FE `angular.json` has a `build` configuration named `edge` | FE `node_modules` not installed, or several projects have an `edge` configuration | `ng build <project> --configuration edge --output-path dist/release/<tag>/fe-edge` (run in the FE repo) |
| `rt-edge` (image) | `apps/rt-edge` exists | no `rt-edge` application in `nest-cli.json`, `package.json` or `package-lock.json` missing, docker unreachable, no `monorepo-base:latest` image, or that image was not built from this tag's package files (below) | `node scripts/build-all-apps.js rt-edge`; `docker build` with `docker/microservices/service.Dockerfile` and `APP_NAME=rt-edge` into `etabella/rt-edge-app:<tag>`; a generated `dist/release/<tag>/rt-edge.Dockerfile` adds the FE bundle at `/usr/src/app/fe-edge/` and the release labels, giving `etabella/rt-edge:<tag>` |

`apps/rt-edge` is expected to serve the FE edge bundle from `/usr/src/app/fe-edge/`.

**The base image must match the tag's dependencies.** `monorepo-base:latest` holds the `node_modules` installed from `package.json` and `package-lock.json`, and the release does not rebuild it. So it must carry the label `com.etabella.deps-sha256` with the hash of the tag's two files, the value of `sha256sum package-lock.json package.json | sha256sum`. When the image has no such label (built with the plain command in `docker/README.md`, or loaded from `monorepo-base.tar`) or a different value, the release refuses and prints the command to run from the tagged tree:

```sh
docker build --label com.etabella.deps-sha256=<hash> -t monorepo-base:latest -f docker/microservices/monorepo-base.Dockerfile .
```

Docker's layer cache makes that quick when the package files have not changed. After the build, the release checks that `etabella/rt-edge:<tag>` still carries the same label (child images inherit it), so a base image swapped during the release fails the build instead of shipping. The base image id and the hash (`depsSha256`) go into the manifest.

With `--push`, `etabella/rt-edge:<tag>` is tagged and pushed as `$REGISTRY/rt-edge:<tag>`, and the registry digest goes into the manifest (a warning is printed if docker reports none).

## Manifest

`dist/release/<tag>/manifest.json`, written after the builds and rewritten after a push:

```json
{
  "schemaVersion": 1,
  "tag": "rt-edge-v1.0.0",
  "backendCommit": "<40 hex>",
  "feCommit": "<40 hex>",
  "FEED_PARSE_VERSION": "1.0.0",
  "node": "v20.11.1",
  "createdAt": "2026-10-01T10:00:00.000Z",
  "gate": { "script": "tools/ci/golden-replay-gate.js", "exitCode": 0 },
  "allowMissing": false,
  "components": [
    { "name": "fe-edge", "kind": "fe-bundle", "status": "built", "project": "etabella", "configuration": "edge",
      "bundleDir": "fe-edge/browser", "sha256": "<tree hash>", "files": 42, "bytes": 1234567 },
    { "name": "rt-edge", "kind": "docker-image", "status": "built", "image": "etabella/rt-edge:rt-edge-v1.0.0",
      "imageId": "sha256:<64 hex>", "baseImage": "monorepo-base:latest", "baseImageId": "sha256:<64 hex>",
      "depsSha256": "<64 hex>", "feBundle": true, "feImageDir": "/usr/src/app/fe-edge" }
  ],
  "push": { "requested": true, "registry": "registry.example.com/etabella", "status": "pushed",
    "images": [{ "image": "etabella/rt-edge:rt-edge-v1.0.0", "ref": "registry.example.com/etabella/rt-edge:rt-edge-v1.0.0",
      "repoDigest": "registry.example.com/etabella/rt-edge@sha256:<64 hex>" }] }
}
```

- A component not built has `"status": "missing"` and a `reason`.
- `push.status` is `not-requested`, `pushed`, `nothing-to-push` (with `--allow-missing` and no image) or `failed` (with `error`; exit 1).
- `node` is the node that ran the release (and built both bundles). The image runs the base image's node.
- The FE `sha256` is a tree hash: the sha256 of the sorted `"<sha256>  <path>"` lines `sha256sum` prints for every file. To check a copy:
  ```sh
  cd <bundle> && find . -type f -printf '%P\n' | LC_ALL=C sort | while IFS= read -r f; do sha256sum "$f"; done | sha256sum
  ```

## rt-deploy-check

```
node tools/ci/rt-deploy-check.js (--manifest <manifest.json> | --version-file <version.ts>)
                                 (--sessions-file <sessions.json> | --pg <connection string | env:VAR>)
```

- **Live venue box session.** The rule names what is *not* live, so a blank, lowercase or new code is compared rather than skipped (fail closed). A session is live unless:
  - it is deleted;
  - its `cFeedSource` is `D`, `H` or `W` (or, in the database, NULL: legacy provenance);
  - its `cSyncState` is sealed: `K`, `W` or `F` (spec §4.4 `NOT IN ('K','W','F')`);
  - it has no `cSyncState` and its `cStatus` is `C` or `E` (ended) or `P` (published).
- A live session whose parser version differs from the deploy's, older or newer, or has none, refuses the deploy. All of them are listed, with their codes (a blank or padded code prints quoted, e.g. `cSyncState=" "`).
- `--sessions-file`: a JSON array of `{ nSesid, parserVer, cStatus }`; `cSyncState` and `cFeedSource` are optional and follow the rule above. A row with no status at all counts as live. A code outside the known ones exits 2: `cFeedSource` `D E H W`, `cSyncState` `L S K W F`, `cStatus` `R A L C E P`. That includes `""`, `"r"` and `"R "`.
- `--pg`: reads `RSessionMaster` in a read-only transaction. `env:VAR` takes the connection string from `$VAR`, so the password stays out of the shell history and the process list. The connection string is never printed. For a managed database with its own CA, use `sslmode=no-verify` or supply the CA.
- The query uses the Phase 2 columns (`cFeedSource`, `cParserVer`, `cSyncState`, migration `2026-10-19_rt_edge_core`). If none exist yet, it prints a framed **NOTICE: no venue sessions schema yet** (naming the database it read) and exits 0: nothing could be compared, and it is not a verified pass. If only some exist, it exits 2.
- The columns are looked up in `pg_catalog`, not `information_schema`, so a role without privileges on `RSessionMaster` cannot look like an unmigrated database. A database with no `RSessionMaster` table at all (the wrong `--pg` target) exits 2, never the notice.
- PASS and REFUSE name where the sessions came from (the file, or `database <name>`).

Exit codes:

| | `release-edge.js` | `rt-deploy-check.js` |
|---|---|---|
| 0 | released (dry run: would release) | pass, or no venue schema yet (with the notice) |
| 1 | refused, gate blocked, build or push failed (dry run: would refuse) | refused: a live box session runs another parser |
| 2 | usage error | usage or input error; the check could not be made, so treat it as refused |

## Tests

The repo's jest config (`package.json` `"jest"`) only searches `apps/` and `libs/` (`"roots"`), so `npx jest`, `npm test` and `npx jest tools/ci/release-edge` do not run these specs. Like the `tools/eclipse-capture` tests (`npm run test:eclipse-capture`), they run on their own, with a config that reuses the repo's settings rooted at this folder and sends only `.ts` through ts-jest (the tools are plain CommonJS):

```sh
npx jest -c tools/ci/release-edge/jest.config.js
```

An npm script for it (`"test:release-edge": "jest -c tools/ci/release-edge/jest.config.js"`) is requested but not added yet, because `package.json` belongs to a separate change.

Git, docker, node, the file system and the database are all fakes (`spec-fakes.js`); the specs run nothing for real. `feed-parse-version.spec.ts` also reads the real `version.ts` (and `index.ts`) to check that the text parser, the compiled constant and the lib's re-export agree.

## Not in this script

- Image signing and A/B updates: deferred until the rollout gate (D2).
- A CI pipeline: D6 chose a scripted release. Upgrade trigger: a second backend engineer, or more than 3 boxes in the field.
- Rebuilding the base image, and publishing the manifest anywhere but `dist/release/<tag>/`. Keep the manifest with the release notes, because `rt-deploy-check` needs it.
- Cloud-direct cut-mode (`'D'`, `cApply = 'C'`) sessions. The engineering spec's `rt-deploy-check` row also lists them (refuse unless `ALLOW_PARSER_REBASE=1`, until O-1 is settled); D6's accepted scope is live box sessions only, so they are not checked here yet.
