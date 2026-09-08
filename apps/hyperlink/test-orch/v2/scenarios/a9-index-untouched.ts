/**
 * A9 - Index queue untouched: HyperLinkIndexProcessor source unchanged
 * (git diff --stat against HEAD is empty, read-only git command) and the
 * module still registers hyperlink-index-queue + HyperLinkIndexProcessor.
 */
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { REPO_ROOT, verdict } from '../harness';

export async function run() {
  const rel = 'apps/hyperlink/src/processor/hyperlink.index.processor.ts';
  const diff = spawnSync('git', ['diff', '--stat', 'HEAD', '--', rel], { cwd: REPO_ROOT, encoding: 'utf8' });
  const diffOut = (diff.stdout || '').trim();
  const moduleSrc = fs.readFileSync(path.join(REPO_ROOT, 'apps/hyperlink/src/hyperlink.module.ts'), 'utf8');
  const genSrc = fs.readFileSync(path.join(REPO_ROOT, 'apps/hyperlink/src/services/generatehyperlink/generatehyperlink.service.ts'), 'utf8');
  const registersIndexQueue = /name:\s*'hyperlink-index-queue'/.test(moduleSrc);
  const providesIndexProcessor = /HyperLinkIndexProcessor/.test(moduleSrc) && /providers:\s*\[[^\]]*HyperLinkIndexProcessor/.test(moduleSrc);
  const legacyPathKept = /hyperlinkIndexQueue\.add\(/.test(genSrc) && /timeout: HYPERLINK_JOB_TIMEOUT_MS, attempts: 3, backoff: 1000 \* 60 \* 5/.test(genSrc);
  const registersFileQueue = /name:\s*'hyperlink-file-queue'/.test(moduleSrc);
  const pass = diff.status === 0 && diffOut === '' && registersIndexQueue && providesIndexProcessor && legacyPathKept && registersFileQueue;
  const numbers = `git diff --stat HEAD -- ${rel} => "${diffOut || '(empty)'}" (exit ${diff.status}); module registers hyperlink-index-queue=${registersIndexQueue}, HyperLinkIndexProcessor provided=${providesIndexProcessor}, legacy indexhyperlink add() kept=${legacyPathKept}, hyperlink-file-queue registered=${registersFileQueue}`;
  return verdict('A9', pass, numbers);
}
