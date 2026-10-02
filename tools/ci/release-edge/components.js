'use strict';
/**
 * What a venue box release is made of, in build order.
 *
 * Each component says whether it can be built from the trees in hand
 * (detect), the steps that build it (steps, also printed by --dry-run) and
 * what goes into the manifest once built (collect). detect answers:
 *   'available' - build it;
 *   'missing'   - the code for it does not exist yet; allowed only with
 *                 --allow-missing and recorded as missing;
 *   'blocked'   - it exists but cannot be built here (no docker, no base
 *                 image, FE dependencies not installed). Always refused.
 *
 * Today neither apps/rt-edge nor the FE "edge" configuration exists, so
 * both come back 'missing'. They are picked up as soon as they land.
 */

const path = require('path');
const { hashTree, hashFiles } = require('./tree-hash');

const FE_CONFIGURATION = 'edge';
const RT_EDGE_APP = 'rt-edge';
const SERVICE_DOCKERFILE = 'docker/microservices/service.Dockerfile';
const BASE_DOCKERFILE = 'docker/microservices/monorepo-base.Dockerfile';
const BASE_IMAGE = 'monorepo-base:latest';
const APP_IMAGE_REPO = 'etabella/rt-edge-app';
const IMAGE_REPO = 'etabella/rt-edge';
/** Where the FE edge bundle sits inside the rt-edge image; apps/rt-edge serves it from here. */
const FE_IMAGE_DIR = '/usr/src/app/fe-edge';

/**
 * The base image holds node_modules installed from these files, and the
 * release does not rebuild it. It must carry DEPS_LABEL = hashFiles of the
 * tag's copies, or the box could boot on another dependency set. Child
 * images inherit the label, so the built image is checked too.
 */
const DEPS_FILES = ['package.json', 'package-lock.json'];
const DEPS_LABEL = 'com.etabella.deps-sha256';
const IMAGE_ID_RE = /^sha256:[0-9a-f]{64}$/;

function readJson(fs, file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function failure(res) {
  return String(res.error || res.stderr || res.stdout || 'exit ' + res.status).trim();
}

/** The command that (re)builds the base image from this tree, labelled with its package files. */
function baseBuildCommand(depsSha256) {
  return 'docker build --label ' + DEPS_LABEL + '=' + depsSha256 + ' -t ' + BASE_IMAGE + ' -f ' + BASE_DOCKERFILE + ' .';
}

/**
 * An image's id and labels from `docker image inspect` (read-only).
 * Returns { missing: why } when docker cannot inspect it; throws on output
 * it cannot read.
 */
function inspectImage(deps, cwd, image) {
  const res = deps.exec('docker', ['image', 'inspect', image, '--format', '{{.Id}} {{json .Config.Labels}}'], { cwd });
  if (res.error || res.status !== 0) return { missing: failure(res) };
  const text = String(res.stdout).trim();
  const cut = text.indexOf(' ');
  const id = cut === -1 ? text : text.slice(0, cut);
  if (!IMAGE_ID_RE.test(id)) throw new Error('unexpected image id for ' + image + ': ' + id);
  let labels;
  try {
    labels = cut === -1 ? null : JSON.parse(text.slice(cut + 1));
  } catch (err) {
    throw new Error('cannot read the labels of ' + image + ': ' + err.message);
  }
  return { id, labels: labels && typeof labels === 'object' ? labels : {} };
}

/* ---------------------------------------------------------------- FE ---- */

function feOutDir(ctx) {
  return path.join(ctx.releaseDir, 'fe-edge');
}

/** The application builder writes the browser files under <outputPath>/browser. */
function feBundleRel(builder) {
  return /:application$/.test(String(builder || '')) ? 'fe-edge/browser' : 'fe-edge';
}

const feEdge = {
  name: 'fe-edge',
  kind: 'fe-bundle',

  detect(ctx, deps) {
    const file = path.join(ctx.feRoot, 'angular.json');
    if (!deps.fs.existsSync(file)) {
      return { status: 'blocked', reason: 'no angular.json in ' + ctx.feRoot + ' (is --fe the Angular repo?)' };
    }
    let ws;
    try {
      ws = readJson(deps.fs, file);
    } catch (err) {
      return { status: 'blocked', reason: 'cannot read ' + file + ': ' + err.message };
    }
    const withEdge = Object.entries(ws.projects || {}).filter(([, p]) => {
      const targets = p && (p.architect || p.targets);
      return p && p.projectType === 'application' && targets && targets.build
        && targets.build.configurations && targets.build.configurations[FE_CONFIGURATION];
    });
    if (withEdge.length === 0) {
      return { status: 'missing', reason: 'not built yet: no "' + FE_CONFIGURATION + '" build configuration in the FE angular.json' };
    }
    if (withEdge.length > 1) {
      return { status: 'blocked', reason: 'several FE projects have an "' + FE_CONFIGURATION + '" configuration: ' + withEdge.map(([n]) => n).join(', ') };
    }
    const [project, def] = withEdge[0];
    const ngBin = path.join(ctx.feRoot, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
    if (!deps.fs.existsSync(ngBin)) {
      return { status: 'blocked', reason: 'FE dependencies are not installed (no node_modules/@angular/cli in ' + ctx.feRoot + '); run npm ci there' };
    }
    const builder = (def.architect || def.targets).build.builder;
    return { status: 'available', info: { project, builder, ngBin } };
  },

  /** What collect will report, known before building (for the image layer and --dry-run). */
  planned(ctx) {
    return { bundleDir: feBundleRel(ctx['fe-edge'].builder) };
  },

  steps(ctx) {
    const fe = ctx['fe-edge'];
    return [
      { rm: feOutDir(ctx) },
      {
        exec: {
          cmd: 'node',
          args: [fe.ngBin, 'build', fe.project, '--configuration', FE_CONFIGURATION, '--output-path', feOutDir(ctx)],
          cwd: ctx.feRoot,
          env: { NG_CLI_ANALYTICS: 'false' },
        },
      },
    ];
  },

  collect(ctx, deps) {
    const fe = ctx['fe-edge'];
    const bundleDir = feBundleRel(fe.builder);
    const tree = hashTree(deps.fs, path.join(ctx.releaseDir, ...bundleDir.split('/')));
    return {
      project: fe.project,
      configuration: FE_CONFIGURATION,
      bundleDir,
      sha256: tree.sha256,
      files: tree.files,
      bytes: tree.bytes,
    };
  },
};

/* ------------------------------------------------------------ rt-edge ---- */

function layerDockerfilePath(ctx) {
  return path.join(ctx.releaseDir, 'rt-edge.Dockerfile');
}

/**
 * The FE layer on top of the rt-edge app image (spec §3.4: "a layer adds
 * the FE edge build"). Label values are safe to inline: the tag matches
 * RELEASE_TAG_RE, commits are hex and FEED_PARSE_VERSION has no quotes or
 * whitespace.
 */
function layerDockerfile(ctx, fe) {
  const lines = [
    '# Generated by tools/ci/release-edge.js for ' + ctx.tag + '. Not checked in.',
    'FROM ' + APP_IMAGE_REPO + ':' + ctx.tag,
    fe
      ? 'COPY ' + fe.bundleDir + '/ ' + FE_IMAGE_DIR + '/'
      : '# No FE edge bundle in this release (released with --allow-missing).',
    'LABEL org.opencontainers.image.version="' + ctx.tag + '" \\',
    '      org.opencontainers.image.revision="' + ctx.backendCommit + '" \\',
    '      com.etabella.fe-commit="' + ctx.feCommit + '" \\',
    '      com.etabella.feed-parse-version="' + ctx.feedParseVersion + '"',
  ];
  return lines.join('\n') + '\n';
}

const rtEdge = {
  name: 'rt-edge',
  kind: 'docker-image',

  /** The local image this component builds. */
  image(tag) {
    return IMAGE_REPO + ':' + tag;
  },

  detect(ctx, deps) {
    if (!deps.fs.existsSync(path.join(ctx.repoRoot, 'apps', RT_EDGE_APP))) {
      return { status: 'missing', reason: 'not built yet: apps/' + RT_EDGE_APP + ' missing' };
    }
    let cli;
    try {
      cli = readJson(deps.fs, path.join(ctx.repoRoot, 'nest-cli.json'));
    } catch (err) {
      return { status: 'blocked', reason: 'cannot read nest-cli.json: ' + err.message };
    }
    const project = cli.projects && cli.projects[RT_EDGE_APP];
    if (!project || project.type !== 'application') {
      return { status: 'blocked', reason: 'apps/' + RT_EDGE_APP + ' exists but nest-cli.json has no "' + RT_EDGE_APP + '" application project' };
    }
    let depsSha256;
    try {
      depsSha256 = hashFiles(deps.fs, ctx.repoRoot, DEPS_FILES).sha256;
    } catch (err) {
      return { status: 'blocked', reason: 'cannot hash ' + DEPS_FILES.join(' and ') + ': ' + err.message };
    }
    const version = deps.exec('docker', ['version', '--format', '{{.Server.Version}}'], { cwd: ctx.repoRoot });
    if (version.error || version.status !== 0) {
      return { status: 'blocked', reason: 'docker is not reachable: ' + failure(version) };
    }
    const base = inspectImage(deps, ctx.repoRoot, BASE_IMAGE);
    if (base.missing) {
      return { status: 'blocked', reason: 'base image ' + BASE_IMAGE + ' not found; build it first: ' + baseBuildCommand(depsSha256) };
    }
    const builtFrom = base.labels[DEPS_LABEL];
    if (builtFrom !== depsSha256) {
      return {
        status: 'blocked',
        reason: 'base image ' + BASE_IMAGE + ' '
          + (builtFrom
            ? 'was built from other package files (' + DEPS_LABEL + ' ' + String(builtFrom).slice(0, 12) + '…, this tag ' + depsSha256.slice(0, 12) + '…)'
            : 'does not say which package files it was built from (no ' + DEPS_LABEL + ' label)')
          + '; rebuild it from this tag: ' + baseBuildCommand(depsSha256),
      };
    }
    return { status: 'available', info: { baseImageId: base.id, depsSha256 } };
  },

  planned(ctx) {
    const info = ctx['rt-edge'];
    return { baseImage: BASE_IMAGE, baseImageId: info.baseImageId, depsSha256: info.depsSha256 };
  },

  /** `results['fe-edge']` is the FE bundle (built, or planned in a dry run), absent when missing. */
  steps(ctx, results) {
    const fe = results['fe-edge'];
    const appImage = APP_IMAGE_REPO + ':' + ctx.tag;
    return [
      { exec: { cmd: 'node', args: ['scripts/build-all-apps.js', RT_EDGE_APP], cwd: ctx.repoRoot } },
      {
        exec: {
          cmd: 'docker',
          args: ['build', '-f', SERVICE_DOCKERFILE, '--build-arg', 'APP_NAME=' + RT_EDGE_APP, '-t', appImage, '.'],
          cwd: ctx.repoRoot,
        },
      },
      { write: { file: layerDockerfilePath(ctx), content: layerDockerfile(ctx, fe) } },
      {
        exec: {
          cmd: 'docker',
          args: ['build', '-f', layerDockerfilePath(ctx), '-t', rtEdge.image(ctx.tag), ctx.releaseDir],
          cwd: ctx.repoRoot,
        },
      },
    ];
  },

  collect(ctx, deps, results) {
    const image = rtEdge.image(ctx.tag);
    const info = ctx['rt-edge'];
    const res = inspectImage(deps, ctx.repoRoot, image);
    if (res.missing) throw new Error('cannot inspect ' + image + ': ' + res.missing);
    // Inherited from the base: catches a base image swapped between the checks and the build.
    if (res.labels[DEPS_LABEL] !== info.depsSha256) {
      throw new Error(image + ' carries ' + DEPS_LABEL + ' ' + (res.labels[DEPS_LABEL] || '(none)') + ', expected '
        + info.depsSha256 + ' (was ' + BASE_IMAGE + ' rebuilt during the release?)');
    }
    return {
      image,
      imageId: res.id,
      baseImage: BASE_IMAGE,
      baseImageId: info.baseImageId,
      depsSha256: info.depsSha256,
      feBundle: Boolean(results['fe-edge']),
      feImageDir: results['fe-edge'] ? FE_IMAGE_DIR : null,
    };
  },
};

/** Build order matters: the image layer copies the FE bundle. */
const COMPONENTS = [feEdge, rtEdge];

module.exports = {
  COMPONENTS,
  FE_CONFIGURATION,
  FE_IMAGE_DIR,
  IMAGE_REPO,
  APP_IMAGE_REPO,
  BASE_IMAGE,
  BASE_DOCKERFILE,
  DEPS_FILES,
  DEPS_LABEL,
  SERVICE_DOCKERFILE,
  baseBuildCommand,
  layerDockerfile,
  feBundleRel,
  toPosix,
  failure,
};
