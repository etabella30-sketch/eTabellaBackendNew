"""Fake smarthyperlink.py for the QA scenarios (production argv shape:
script pdf id csv nBundledetailid bucket key secret endpoint temp).

Behaviour by nBundledetailid (argv[4]) prefix:
    pgerr-*    scan summary, then "Error inserting data into PostgreSQL: ..." on STDOUT, exit 0
    exit4-*    same line, exit 4 (the real script after the python change)
    nonl-*     "Error: no newline" WITHOUT a trailing newline, exit 0 (flush test)
    stderr-*   "Error: on stderr only" on STDERR, clean stdout, exit 0
    hang-*     sleeps 600 s (until killed)
    other      summary line, exit 0
The pid is written to $ORCH_PID_DIR/<pid>.pid (content = id) so a scenario can
tell which pythons are still alive.
"""
import os
import sys
import time

pid_dir = os.environ.get("ORCH_PID_DIR")
tag = sys.argv[4] if len(sys.argv) > 4 else ""
if pid_dir:
    with open(os.path.join(pid_dir, f"{os.getpid()}.pid"), "w") as fh:
        fh.write(tag)
print("SMART: fake qa scanner for", tag, flush=True)
if tag.startswith("pgerr"):
    print("SMART: pages=1 groups=2 rows=2", flush=True)
    print("Error inserting data into PostgreSQL: connection refused (exit 0)", flush=True)
    sys.exit(0)
if tag.startswith("exit4"):
    print("Error inserting data into PostgreSQL: connection refused (exit 4)", flush=True)
    sys.exit(4)
if tag.startswith("nonl"):
    sys.stdout.write("Error: no newline before exit")
    sys.stdout.flush()
    sys.exit(0)
if tag.startswith("stderr"):
    print("SMART: pages=1 groups=1 rows=1", flush=True)
    sys.stderr.write("Error: on stderr only\n")
    sys.stderr.flush()
    sys.exit(0)
if tag.startswith("hang"):
    print("HANG", flush=True)
    time.sleep(600)
    sys.exit(0)
print("SMART: pages=1 groups=1 rows=1", flush=True)
sys.exit(0)
