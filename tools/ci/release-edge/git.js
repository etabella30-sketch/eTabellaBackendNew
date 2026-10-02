'use strict';
/**
 * Read-only git queries for release-edge. Every call goes through the
 * injected `exec` and passes --no-optional-locks, so asking for the status
 * never rewrites the index of the tree being released.
 */

/** Usable as a Docker image tag and as a folder name under dist/release/. */
const RELEASE_TAG_RE = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;

function git(exec, cwd, args) {
  const res = exec('git', ['--no-optional-locks', ...args], { cwd });
  if (res.error || res.status !== 0) {
    const why = (res.error || res.stderr || res.stdout || 'exit ' + res.status).toString().trim();
    throw new Error('git ' + args.join(' ') + ' failed in ' + cwd + ': ' + why);
  }
  return String(res.stdout || '');
}

/** Porcelain lines for every tracked change and untracked file (ignored files excluded). */
function dirtyEntries(exec, cwd) {
  return git(exec, cwd, ['status', '--porcelain=v1', '--untracked-files=normal'])
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '');
}

function headCommit(exec, cwd) {
  const sha = git(exec, cwd, ['rev-parse', '--verify', 'HEAD^{commit}']).trim();
  if (!/^[0-9a-f]{40,64}$/.test(sha)) throw new Error('unexpected HEAD id in ' + cwd + ': ' + sha);
  return sha;
}

/** Tags whose commit is HEAD, each with whether it is annotated (a tag object). */
function tagsAtHead(exec, cwd) {
  const names = git(exec, cwd, ['tag', '--points-at', 'HEAD'])
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return names.map((name) => ({
    name,
    annotated: git(exec, cwd, ['cat-file', '-t', 'refs/tags/' + name]).trim() === 'tag',
  }));
}

/**
 * Picks the release tag. Returns { tag } or { error }.
 * HEAD must carry exactly one annotated tag, or the one named by --tag.
 */
function pickReleaseTag(tags, requested, shortHead) {
  let tag;
  if (requested) {
    const hit = tags.find((t) => t.name === requested);
    if (!hit) return { error: 'tag ' + requested + ' does not point at HEAD (' + shortHead + ')' };
    if (!hit.annotated) return { error: 'tag ' + requested + ' is a lightweight tag; a release needs an annotated tag (git tag -a)' };
    tag = hit.name;
  } else {
    const annotated = tags.filter((t) => t.annotated);
    if (annotated.length === 0) {
      if (tags.length > 0) {
        return { error: 'HEAD (' + shortHead + ') carries only lightweight tag(s) ' + tags.map((t) => t.name).join(', ') + '; a release needs an annotated tag (git tag -a)' };
      }
      return { error: 'HEAD (' + shortHead + ') is not at a tag; tag the release first (git tag -a <name>)' };
    }
    if (annotated.length > 1) {
      return { error: 'HEAD (' + shortHead + ') carries ' + annotated.length + ' annotated tags (' + annotated.map((t) => t.name).join(', ') + '); choose one with --tag' };
    }
    tag = annotated[0].name;
  }
  if (!RELEASE_TAG_RE.test(tag)) {
    return { error: 'tag ' + tag + ' cannot name an image or a release folder (letters, digits, _ . - only, at most 128, no leading . or -)' };
  }
  return { tag };
}

module.exports = { RELEASE_TAG_RE, git, dirtyEntries, headCommit, tagsAtHead, pickReleaseTag };
