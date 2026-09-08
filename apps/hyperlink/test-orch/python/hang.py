"""Stand-in for smarthyperlink.py used by S4c.

argv is the production argv (script, file_key, nBundledetailid, csv, ...).
If the nBundledetailid contains 'hang' the process sleeps (a stuck scan);
otherwise it exits 0 immediately. The pid is written to $ORCH_PID_DIR so the
harness can count / kill leftover processes.
"""
import os
import sys
import time

pid_dir = os.environ.get("ORCH_PID_DIR")
tag = sys.argv[2] if len(sys.argv) > 2 else ""
if pid_dir:
    with open(os.path.join(pid_dir, f"{os.getpid()}.pid"), "w") as fh:
        fh.write(tag)
if "hang" in tag:
    print("HANG: sleeping", flush=True)
    time.sleep(600)  # capped so a harness crash cannot leave it for an hour
else:
    print("OK", flush=True)
sys.exit(0)
