/**
 * F - Real python (assets/pythons/hyperlink/smarthyperlink.py, local dry-run mode:
 * SMART_LOCAL=1 SMART_DRYRUN=1, no S3, no DB) on copies of I11.pdf through the
 * REAL HyperlinksearchService + REAL processor + REAL Bull queue (concurrency 5).
 *   serial: 1 bundle x 10 files            -> per-file wall time, one python at a time
 *   par3:   3 bundles (3 sections) x 10    -> 3 pythons at a time
 *   par5:   5 bundles (5 sections) x 10    -> 5 pythons at a time
 * A PowerShell sampler records every python.exe (pid, working set, cpu ms) every ~400 ms.
 */
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ADV_OUT, Harness, REPO_ROOT, SCRATCH, bodyFor, flushDb9, now, out, queueWith, secs, sleep } from './common';
import { HyperlinksearchService } from '../../src/services/hyperlinksearch/hyperlinksearch.service';

const SRC = path.join(SCRATCH, 'I11.pdf');
const FILES_PER_BUNDLE = 10;

function startSampler(file: string, stop: string): ChildProcess {
  try { fs.unlinkSync(file); } catch { }
  try { fs.unlinkSync(stop); } catch { }
  const script = `while(-not (Test-Path '${stop}')){ $t=[DateTimeOffset]::Now.ToUnixTimeMilliseconds(); Get-Process -Name python -ErrorAction SilentlyContinue | ForEach-Object { Add-Content -Path '${file}' -Value ('{0},{1},{2},{3}' -f $t,$_.Id,$_.WorkingSet64,[int]$_.TotalProcessorTime.TotalMilliseconds) }; Start-Sleep -Milliseconds 400 }`;
  return spawn('powershell', ['-NoProfile', '-Command', script], { stdio: 'ignore', windowsHide: true });
}

function analyseSamples(file: string, baselinePids: Set<number>, t0: number, t1: number) {
  if (!fs.existsSync(file)) return { note: 'no samples' };
  const rows = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split(',').map(Number)).filter(r => r.length === 4 && !baselinePids.has(r[1]) && r[0] >= t0 - 1000 && r[0] <= t1 + 1000);
  const byT = new Map<number, { count: number; ws: number }>();
  const maxCpu = new Map<number, number>(); const maxWs = new Map<number, number>();
  for (const [t, pid, ws, cpu] of rows) {
    const b = byT.get(t) || { count: 0, ws: 0 }; b.count++; b.ws += ws; byT.set(t, b);
    maxCpu.set(pid, Math.max(maxCpu.get(pid) || 0, cpu)); maxWs.set(pid, Math.max(maxWs.get(pid) || 0, ws));
  }
  const vals = [...byT.values()];
  return {
    samples: byT.size, distinctPythonPids: maxCpu.size, maxConcurrentPythons: Math.max(0, ...vals.map(v => v.count)),
    peakTotalPythonWorkingSetMB: +(Math.max(0, ...vals.map(v => v.ws)) / 1048576).toFixed(0), peakSinglePythonWorkingSetMB: +(Math.max(0, ...maxWs.values()) / 1048576).toFixed(0),
    totalPythonCpuSeconds: +([...maxCpu.values()].reduce((a, b) => a + b, 0) / 1000).toFixed(1),
  };
}

async function runShape(label: string, bundles: number, copies: string[]) {
  const h = new Harness({ label });
  await h.flush();
  const cfg = h.makeConfig({ PY_HYPERLINK_SMART: path.join(REPO_ROOT, 'assets', 'pythons', 'hyperlink', 'smarthyperlink.py'), HYPERLINK_FILE_TIMEOUT_MIN: '45' });
  h.realSearch = new HyperlinksearchService(cfg);
  h.db.getfiles = (q) => Array.from({ length: FILES_PER_BUNDLE }, (_, i) => ({ nBundledetailid: `${q.nSectionid}-${i + 1}`, cFilename: `copy${i + 1}.pdf`, cPath: copies[i % copies.length] }));
  const q = queueWith(h, 'w');
  const gen = h.makeGenerator(q);
  const sampleFile = path.join(ADV_OUT, `py-samples-${label}.csv`), stopFile = path.join(ADV_OUT, `py-stop-${label}`);
  const baseline = new Set<number>();
  try { for (const l of require('child_process').execSync('powershell -NoProfile -Command "Get-Process -Name python -ErrorAction SilentlyContinue | % { $_.Id }"').toString().split(/\r?\n/)) if (l.trim()) baseline.add(Number(l)); } catch { }
  const sampler = startSampler(sampleFile, stopFile);
  await sleep(600);
  const saved = { ...process.env };
  Object.assign(process.env, { SMART_LOCAL: '1', SMART_DRYRUN: '1', PYTHONIOENCODING: 'UTF-8' });
  const memBefore = process.memoryUsage().rss;
  const t0 = now();
  const starts: any[] = [];
  for (let b = 1; b <= bundles; b++) starts.push(await gen.starthyperlink(bodyFor({ nSectionid: `F${label}${b}`, nBundleid: 'B' + b }), false, false, true));
  h.registerWorker(q, 'w', h.makeProcessor(cfg));
  const idle = await h.waitForIdle([q], 240000);
  const t1 = now();
  process.env = saved as any;
  fs.writeFileSync(stopFile, '1');
  await sleep(800);
  try { sampler.kill(); } catch { }
  const memAfter = process.memoryUsage().rss;
  const runs = h.runs.map(r => ({ q: r.queueName, startS: secs(r.start - t0), endS: r.end ? secs(r.end - t0) : null, files: r.filesSeen, secondsPerFile: r.end ? +((r.end - r.start) / 1000 / Math.max(1, r.filesSeen)).toFixed(2) : null }));
  // per-file scan time from the gap between consecutive createHyperlinkFile calls inside each run
  const gaps: number[] = [];
  for (const r of h.runs) { const c = h.fileCalls.filter(x => x.runId === r.runId).map(x => x.t); for (let i = 1; i < c.length; i++) gaps.push(c[i] - c[i - 1]); if (r.end && c.length) gaps.push(r.end - c[c.length - 1]); }
  gaps.sort((a, b) => a - b);
  const pct = (p: number) => gaps.length ? +(gaps[Math.min(gaps.length - 1, Math.floor(p * gaps.length))] / 1000).toFixed(2) : null;
  const totalFiles = h.fileCalls.length;
  const wall = (t1 - t0) / 1000;
  const result = {
    label, bundles, filesPerBundle: FILES_PER_BUNDLE, idle, accepted: starts.map(s => s.msg), totalFilesScanned: totalFiles, wallSeconds: secs(t1 - t0), filesPerSecond: +(totalFiles / wall).toFixed(2),
    perFileSeconds: { mean: +(gaps.reduce((a, b) => a + b, 0) / gaps.length / 1000).toFixed(2), p50: pct(0.5), p90: pct(0.9), max: pct(1) },
    runs, sp: h.spStats(), lastPopups: starts.map(s => { const l = h.lastResponce(s.data.queueName); return l && `${l.nCompleted}/${l.nTotal} ${l.cStatus}`; }),
    python: analyseSamples(sampleFile, baseline, t0, t1), nodeRssMB: { before: +(memBefore / 1048576).toFixed(0), after: +(memAfter / 1048576).toFixed(0) },
    pythonErrorsInOutput: h.consoleLines.filter(l => /Error:|exited with code/.test(l)).length,
  };
  await h.teardown(); await flushDb9();
  return result;
}

export async function run() {
  if (!fs.existsSync(SRC)) throw new Error('I11.pdf missing in scratchpad');
  const copies: string[] = [];
  for (let i = 1; i <= FILES_PER_BUNDLE; i++) { const p = path.join(ADV_OUT, `i11_copy_${i}.pdf`); if (!fs.existsSync(p)) fs.copyFileSync(SRC, p); copies.push(p); }
  const r: any = { cpuLogical: require('os').cpus().length, cpuModel: require('os').cpus()[0].model, totalMemGB: +(require('os').totalmem() / 1073741824).toFixed(0) };
  r.serial = await runShape('serial', 1, copies); out(JSON.stringify(r.serial, null, 1));
  r.par3 = await runShape('par3', 3, copies); out(JSON.stringify(r.par3, null, 1));
  r.par5 = await runShape('par5', 5, copies); out(JSON.stringify(r.par5, null, 1));
  r.speedupCurve = {
    filesPerSecond: { serial: r.serial.filesPerSecond, par3: r.par3.filesPerSecond, par5: r.par5.filesPerSecond },
    speedupVsSerial: { par3: +(r.par3.filesPerSecond / r.serial.filesPerSecond).toFixed(2), par5: +(r.par5.filesPerSecond / r.serial.filesPerSecond).toFixed(2) },
    perFileMeanSeconds: { serial: r.serial.perFileSeconds.mean, par3: r.par3.perFileSeconds.mean, par5: r.par5.perFileSeconds.mean },
    perFileSlowdown: { par3: +(r.par3.perFileSeconds.mean / r.serial.perFileSeconds.mean).toFixed(2), par5: +(r.par5.perFileSeconds.mean / r.serial.perFileSeconds.mean).toFixed(2) },
  };
  out(JSON.stringify(r.speedupCurve, null, 1));
  for (const c of copies) { try { fs.unlinkSync(c); } catch { } }
  return r;
}
