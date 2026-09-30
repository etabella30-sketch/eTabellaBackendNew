/**
 * A10 - Real python exit codes: runs the pytest module
 * assets/pythons/hyperlink/tests/test_exit_codes.py (codes 0 / 1 / 2 / 3 / 4
 * of the real smarthyperlink.py, local mode, DB 127.0.0.1:1, S3 127.0.0.1:1).
 */
import { spawnSync } from 'child_process';
import * as path from 'path';
import { REPO_ROOT, verdict } from '../harness';

export async function run() {
  const testsDir = path.join(REPO_ROOT, 'assets', 'pythons', 'hyperlink', 'tests');
  const py = spawnSync('python', ['-m', 'pytest', '-q', '-p', 'no:cacheprovider', 'test_exit_codes.py', '-v'], {
    cwd: testsDir, encoding: 'utf8', timeout: 300000,
    env: { ...process.env, PYTHONIOENCODING: 'UTF-8', PYTHONDONTWRITEBYTECODE: '1' },
  });
  const outp = (py.stdout || '') + (py.stderr || '');
  const summary = (outp.match(/^(\d+ passed.*|.*failed.*|.*error.*)$/mi) || [])[0] || outp.split('\n').filter(Boolean).pop() || '';
  const passed = Number((outp.match(/(\d+) passed/) || [])[1] || 0);
  const failed = Number((outp.match(/(\d+) failed/) || [])[1] || 0);
  const cases = (outp.match(/test_exit_\d+_[a-z_0-9]+ (PASSED|FAILED)/g) || []).map(s => s.replace('test_exit_', '').replace(' PASSED', ':ok').replace(' FAILED', ':FAIL'));
  const pass = py.status === 0 && passed >= 6 && failed === 0;
  const numbers = `pytest exit=${py.status} ${summary.trim()} [${cases.join(', ')}]`;
  return verdict('A10', pass, numbers, { tail: outp.split('\n').slice(-12).join('\n') });
}
