"""Stand-in python for the adversarial scenarios (production argv shape).

Behaviour by nBundledetailid (argv[2]) prefix:
    dbexit0-*   scan summary, then "Error inserting data into PostgreSQL: ..." and EXIT 0
    errsplit-*  "Err" flushed, pause, "or: split across chunks" -> the error line arrives in two chunks, exit 0
    okwarn-*    lines that look error-ish but are not error lines ("ERRORS: 0", "no Error here"), exit 0
    stderr0-*   "Error: only on stderr" on STDERR, nothing on stdout, exit 0
    hang-*      sleeps until killed
    anything else: summary line, exit 0
The pid is written to $ORCH_PID_DIR (as fake_smart.py does) so leftovers can be counted.
"""
import os
import sys
import time

pid_dir = os.environ.get("ORCH_PID_DIR")
tag = sys.argv[2] if len(sys.argv) > 2 else ""
if pid_dir:
    with open(os.path.join(pid_dir, f"{os.getpid()}.pid"), "w") as fh:
        fh.write(tag)
print("SMART: fake adversarial scanner for", tag, flush=True)
if tag.startswith("dbexit0"):
    print("SMART: pages=1 groups=1 rows=1", flush=True)
    print("Error inserting data into PostgreSQL: connection refused (but exit 0)", flush=True)
    sys.exit(0)
if tag.startswith("errsplit"):
    sys.stdout.write("Err")
    sys.stdout.flush()
    time.sleep(0.15)
    sys.stdout.write("or: split across chunks\n")
    sys.stdout.flush()
    sys.exit(0)
if tag.startswith("okwarn"):
    print("ERRORS: 0 found", flush=True)
    print("no Error here, all good", flush=True)
    print("SMART: pages=1 groups=1 rows=1", flush=True)
    sys.exit(0)
if tag.startswith("stderr0"):
    sys.stderr.write("Error: only on stderr\n")
    sys.stderr.flush()
    sys.exit(0)
if tag.startswith("hang"):
    print("HANG: sleeping", flush=True)
    time.sleep(600)
    sys.exit(0)
print("SMART: pages=1 groups=1 rows=1", flush=True)
sys.exit(0)
