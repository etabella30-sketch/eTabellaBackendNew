'use strict';
/**
 * Test-only fakes for the release tooling specs: an in-memory fs and an
 * exec that answers from handlers and throws on any command it was not
 * told about, so a spec can never reach real git, docker or node.
 */

const path = require('path');

function enoent(p) {
  const err = new Error("ENOENT: no such file or directory, '" + p + "'");
  err.code = 'ENOENT';
  return err;
}

/** `initial` maps paths to file contents; a null value makes an empty directory. */
function memoryFs(initial = {}) {
  const files = new Map();
  const dirs = new Set();
  const ops = [];
  const norm = (p) => path.resolve(p);
  const addParents = (p) => {
    let d = path.dirname(p);
    while (!dirs.has(d)) {
      dirs.add(d);
      const up = path.dirname(d);
      if (up === d) break;
      d = up;
    }
  };
  const put = (p, data) => {
    const n = norm(p);
    files.set(n, Buffer.isBuffer(data) ? data : Buffer.from(String(data)));
    addParents(n);
  };
  const under = (p, root) => p === root || p.startsWith(root + path.sep);
  for (const [p, data] of Object.entries(initial)) {
    if (data === null) {
      dirs.add(norm(p));
      addParents(norm(p));
    } else {
      put(p, data);
    }
  }
  return {
    files,
    dirs,
    ops,
    existsSync: (p) => files.has(norm(p)) || dirs.has(norm(p)),
    readFileSync(p, enc) {
      const n = norm(p);
      if (!files.has(n)) throw enoent(n);
      const buf = files.get(n);
      return enc ? buf.toString(enc) : buf;
    },
    writeFileSync(p, data) {
      ops.push(['write', norm(p)]);
      put(p, data);
    },
    mkdirSync(p) {
      ops.push(['mkdir', norm(p)]);
      dirs.add(norm(p));
      addParents(norm(p));
    },
    rmSync(p) {
      const n = norm(p);
      ops.push(['rm', n]);
      for (const k of [...files.keys()]) if (under(k, n)) files.delete(k);
      for (const d of [...dirs]) if (under(d, n)) dirs.delete(d);
    },
    readdirSync(p) {
      const n = norm(p);
      if (!dirs.has(n)) throw enoent(n);
      const kinds = new Map();
      for (const k of files.keys()) if (path.dirname(k) === n) kinds.set(path.basename(k), 'file');
      for (const d of dirs) if (d !== n && path.dirname(d) === n) kinds.set(path.basename(d), 'dir');
      return [...kinds].map(([name, kind]) => ({
        name,
        isFile: () => kind === 'file',
        isDirectory: () => kind === 'dir',
      }));
    },
  };
}

/**
 * `handlers` are tried in order with { cmd, args, opts, line }; the first one
 * that returns an object answers (status 0 and empty output by default).
 */
function fakeExec(handlers) {
  const calls = [];
  const exec = (cmd, args, opts = {}) => {
    const call = { cmd, args, opts, line: [cmd, ...args].join(' ') };
    calls.push(call);
    for (const h of handlers) {
      const out = h(call);
      if (out !== undefined) return { status: 0, stdout: '', stderr: '', error: null, ...out };
    }
    throw new Error('unexpected exec: ' + call.line + ' (cwd ' + opts.cwd + ')');
  };
  exec.calls = calls;
  return exec;
}

/** Answers the read-only git queries release-edge makes in one repo. */
function gitRepo(root, repo) {
  const at = path.resolve(root);
  return (call) => {
    if (call.cmd !== 'git' || path.resolve(call.opts.cwd || '') !== at) return undefined;
    if (call.args[0] !== '--no-optional-locks') return { status: 128, stderr: 'spec: git called without --no-optional-locks' };
    const q = call.args.slice(1).join(' ');
    const tags = repo.tags || [];
    if (q === 'status --porcelain=v1 --untracked-files=normal') {
      return { stdout: (repo.dirty || []).map((l) => l + '\n').join('') };
    }
    if (q === 'rev-parse --verify HEAD^{commit}') return { stdout: repo.head + '\n' };
    if (q === 'tag --points-at HEAD') return { stdout: tags.map((t) => t.name + '\n').join('') };
    const m = /^cat-file -t refs\/tags\/(.+)$/.exec(q);
    if (m) {
      const t = tags.find((x) => x.name === m[1]);
      return t ? { stdout: (t.annotated ? 'tag' : 'commit') + '\n' } : { status: 128, stderr: 'not a tag' };
    }
    return undefined;
  };
}

module.exports = { memoryFs, fakeExec, gitRepo };
