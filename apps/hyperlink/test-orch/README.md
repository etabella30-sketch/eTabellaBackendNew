# Hyperlink orchestration failure-mode harness

Empirical reproduction of why bundle hyperlink jobs restart, double-process,
block other bundles and misreport success. Drives the REAL `HyperLinkProcessor`,
REAL `GeneratehyperlinkService`, REAL `RedisDbService` and a REAL Bull 4.12.2
queue; only the I/O edges are stubbed (DbService.executeRef, python spawn,
Kafka emit, winston). Scenarios S4b/S4c use the REAL `HyperlinksearchService`
and spawn real python.

## Run (one command, all scenarios)

```
cd "D:\etabella tech\etabella_backend-rt"
set TS_NODE_TRANSPILE_ONLY=1
npx ts-node -r tsconfig-paths/register apps/hyperlink/test-orch/run.ts
```

Optional: `... run.ts S1 S3` runs a subset. Results are written to
`<scratchpad>/orch-results.json` (path in `harness.ts` / env `ORCH_SCRATCH`).

Prerequisites: local Redis on 127.0.0.1:6379 (DB 9 is FLUSHED before/after every
scenario; Bull prefix `orchtest`), python 3 with PyMuPDF + psycopg2 + pytest on
PATH. No .env is loaded; DB_HOST is forced to 127.0.0.1:1 and the S3 endpoint to
http://127.0.0.1:1 so nothing remote is contacted.

## Time scaling

* file duration 10-50 ms (Windows timers make 20 ms ~31 ms, 50 ms ~62 ms; effective
  per-file times are reported);
* Bull `timeout` / `backoff` are scaled by `Harness.submitScaled`: the job is
  submitted through the real `starthyperlink` (lock key + 12 h / 3 attempts /
  5 min opts), then swapped for a job with the identical data object and identical
  opts except `timeout` and `backoff` (the constant is a function-local `const`
  and cannot be monkeypatched);
* production behaviour = `resumeNeutralised: true` (rds.getValue returns null for
  keys ending in `/done`) + the 1 h timeout semantics scaled down;
* S4c production = kill timer neutralised with `HYPERLINK_FILE_TIMEOUT_MIN=35000`.

## Files

* `harness.ts` - construction, instrumentation, wait/flush helpers
* `run.ts` - runner
* `scenarios/s1..s8-*.ts` - one module per scenario
* `python/hang.py` - stand-in python that never exits (S4c)
* `<scratchpad>/test_smarthyperlink_exit.py` - pytest for the real script's exit codes (S4b)
