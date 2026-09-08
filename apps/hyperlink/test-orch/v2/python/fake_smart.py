"""Stand-in for smarthyperlink.py used by the A4 acceptance scenario.

argv is the production argv (script, file_key, nBundledetailid, csv, ...).
The behaviour is chosen by the nBundledetailid prefix:
    err0-*   prints "Error: simulated failure" and exits 0 (legacy behaviour)
    exit3-*  prints "Error: scan failed" and exits 3
    dberr-*  prints "Error inserting data into PostgreSQL: refused", exits 4
    hang-*   sleeps (a stuck scan) until killed
    anything else: prints a summary line and exits 0
The pid is written to $ORCH_PID_DIR so the harness can count leftovers.
"""
import os
import sys
import time

pid_dir = os.environ.get("ORCH_PID_DIR")
tag = sys.argv[2] if len(sys.argv) > 2 else ""
if pid_dir:
    with open(os.path.join(pid_dir, f"{os.getpid()}.pid"), "w") as fh:
        fh.write(tag)
print("SMART: fake scanner for", tag, flush=True)
if tag.startswith("err0"):
    print("Error: simulated failure (exit 0)", flush=True)
    sys.exit(0)
if tag.startswith("exit3"):
    print("Error: scan failed", flush=True)
    sys.exit(3)
if tag.startswith("dberr"):
    print("SMART: pages=1 groups=1 rows=1 multiline=0 crosspage=0 table=0 (cells=0 columns=0 recovered=0)", flush=True)
    print("Error inserting data into PostgreSQL: connection refused", flush=True)
    sys.exit(4)
if tag.startswith("hang"):
    print("HANG: sleeping", flush=True)
    time.sleep(600)
    sys.exit(0)
print("SMART: pages=1 groups=1 rows=1 multiline=0 crosspage=0 table=0 (cells=0 columns=0 recovered=0)", flush=True)
sys.exit(0)
