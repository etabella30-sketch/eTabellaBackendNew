# Hyperlink orchestration v2 - acceptance harness

Acceptance scenarios A1..A10 of `DESIGN_V2.md` plus A11..A15 (fix round 2:
cancel + restart during getfiles, cancel of a finished batch / cancel-vs-finalize
race, overlapping scopes, TTL / stale / snapshot guards, Bull failed handler)
and A16..A18 (fix round 3: the lost-finalize window after a crash between the
accounting Lua and finalize(); fair share of the file queue between batches,
dead-orchestrator takeover of the enqueue, stale check by the batch's own job
ids under a > 5,000-job foreign queue; late markEnqueueDone TTL, X snapshot
accuracy + no SP 'F' for cancel-killed pythons + cancel poll retry, 1-file
bundle notification id, legacy index key on the single-file scope) against the REAL v2 classes:
`HyperLinkProcessor` (orchestrator), `HyperLinkFileProcessor`,
`HyperlinkBatchService`, `GeneratehyperlinkService`, `RedisDbService` and
REAL Bull 4.12.2 queues (`hyperlink-queue`, `hyperlink-file-queue`) on
127.0.0.1:6379 DB 9, prefix `orchtest`. Stubbed: `DbService.executeRef`,
python (A4/A10 spawn a real python), Kafka emit, winston.

## Run (one command, all scenarios, ~5.5 min)

```
cd "D:\etabella tech\etabella_backend-rt"
set TS_NODE_TRANSPILE_ONLY=1
set PYTHONIOENCODING=UTF-8
npx ts-node -r tsconfig-paths/register apps/hyperlink/test-orch/v2/run.ts
```

`... run.ts A1 A5` runs a subset. One `A<n> PASS|FAIL: <numbers>` line per
scenario, a summary, exit code 0 only when all pass. Redis DB 9 is flushed
before and after every scenario. Results: `<scratchpad>/orch-v2-results.json`
(`ORCH_SCRATCH` env or the path in `harness.ts`).

Prerequisites: local Redis, python 3 with PyMuPDF + pytest (A10). No .env is
loaded; DB_HOST is forced to 127.0.0.1:1 and the S3 endpoint to
http://127.0.0.1:1.

## Scaling used by the harness (production values in brackets)

* per-file scan 20-50 ms (~60 s); `HYPERLINK_FILE_BACKOFF_MS=200` (30 s);
* A1: the bundle job is re-added with `timeout 2 s / attempts 2 / backoff 500 ms`
  and `hyperlink_getfiles` takes 2.5 s on its first call, which reproduces the
  "Bull timeout re-runs the job beside the first run" mechanism;
* A2: Bull `lockDuration 8 s / stalledInterval 4 s` (30 s / 30 s) so the
  crashed worker's jobs are re-run in seconds; the restart also runs
  `HyperlinkService.deleteAllRunningHyperlinkJobs()` (the boot-time wipe) and
  checks that only the legacy index key is removed, the v2 lock/progress key
  survives and an immediate restart of the same bundle is still rejected;
* `HYPERLINK_CANCEL_POLL_MS=300` (production 5 s);
* A15: `lockDuration 4 s / stalledInterval 2 s / maxStalledCount 0` so a killed worker's
  jobs are failed for good by Bull in seconds;
* A4: `HYPERLINK_FILE_TIMEOUT_MIN=0.05` (3 s kill timer; production 45 min);
* A6: `ORCH_A6_FILES` overrides the 3,000 files;
* A16: FAST_STALL (the stalled re-run of the finalizing file job arrives in ~8 s);
* A17: `HYPERLINK_FAIR_CHUNK=50` (production default 100), `HYPERLINK_ENQUEUE_STALE_MS=2000`
  (15 s), FAST_STALL; the foreign queue of (c) is 5,200 jobs (> the 5,000 the
  fallback pager would scan).

## Files

* `harness.ts` - construction, stubs, waits, stats (`HarnessV2.stack()` builds one complete stack)
* `run.ts` - runner
* `scenarios/a1..a18-*.ts` - one module per scenario
* `python/fake_smart.py` - python stand-in for A4 (behaviour by nBundledetailid prefix)
* `assets/pythons/hyperlink/tests/test_exit_codes.py` - the pytest A10 runs
* `adversarial/` - the reviewers' adversarial checks X1..X9 (`adversarial/run.ts`),
  same infrastructure, one `X<n><letter> PASS|FAIL` line per check
