import * as crypto from 'crypto';
import * as path from 'path';
import { hashTree, hashFiles } from './tree-hash';
import { memoryFs } from './spec-fakes';

const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const DIR = path.resolve('/bundle');

describe('hashTree', () => {
  it('hashes sorted "<sha256>  <path>" lines, the sha256sum format', () => {
    const fs = memoryFs({
      [path.join(DIR, 'main.js')]: 'console.log(1)',
      [path.join(DIR, 'index.html')]: '<html></html>',
      [path.join(DIR, 'assets', 'a.css')]: 'a{}',
    });
    const lines =
      sha('a{}') + '  assets/a.css\n' +
      sha('<html></html>') + '  index.html\n' +
      sha('console.log(1)') + '  main.js\n';
    expect(hashTree(fs, DIR)).toEqual({ sha256: sha(lines), files: 3, bytes: 3 + 13 + 14 });
  });

  it('changes when one byte changes', () => {
    const a = hashTree(memoryFs({ [path.join(DIR, 'x.js')]: 'a' }), DIR);
    const b = hashTree(memoryFs({ [path.join(DIR, 'x.js')]: 'b' }), DIR);
    expect(a.sha256).not.toBe(b.sha256);
  });

  it('refuses a missing or empty directory', () => {
    expect(() => hashTree(memoryFs(), DIR)).toThrow('bundle directory missing');
    expect(() => hashTree(memoryFs({ [DIR]: null }), DIR)).toThrow('bundle directory is empty');
  });
});

describe('hashFiles', () => {
  const ROOT = path.resolve('/repo');
  const files = {
    [path.join(ROOT, 'package.json')]: '{"name":"x"}',
    [path.join(ROOT, 'package-lock.json')]: '{"lockfileVersion":3}',
    [path.join(ROOT, 'README.md')]: 'not hashed',
  };

  it('hashes only the named files, sorted: sha256sum package-lock.json package.json | sha256sum', () => {
    const lines = sha('{"lockfileVersion":3}') + '  package-lock.json\n' + sha('{"name":"x"}') + '  package.json\n';
    const fromEitherOrder = [['package.json', 'package-lock.json'], ['package-lock.json', 'package.json']]
      .map((rels) => hashFiles(memoryFs(files), ROOT, rels));
    expect(fromEitherOrder[0]).toEqual({ sha256: sha(lines), files: 2, bytes: 12 + 21 });
    expect(fromEitherOrder[1]).toEqual(fromEitherOrder[0]);
  });

  it('refuses a missing file', () => {
    expect(() => hashFiles(memoryFs({ [path.join(ROOT, 'package.json')]: '{}' }), ROOT, ['package.json', 'package-lock.json']))
      .toThrow('file missing: ' + path.join(ROOT, 'package-lock.json'));
  });
});
