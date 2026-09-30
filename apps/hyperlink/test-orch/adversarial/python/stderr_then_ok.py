"""Python stand-in: emits a warning on stderr (like a PyMuPDF DeprecationWarning),
keeps working for SLEEP_S seconds, then exits 0 with a normal result line."""
import os
import sys
import time

pid_dir = os.environ.get("ORCH_PID_DIR")
tag = sys.argv[2] if len(sys.argv) > 2 else ""
if pid_dir:
    with open(os.path.join(pid_dir, f"{os.getpid()}.pid"), "w") as fh:
        fh.write(tag)
sys.stderr.write("DeprecationWarning: something harmless\n")
sys.stderr.flush()
time.sleep(float(os.environ.get("SLEEP_S", "2")))
print("PAGENO:1,Term:ABC,x:1.0,y:2.0,x1:3.0,y1:4.0,pref:None,Hword:ABC-1,TOEND", flush=True)
sys.exit(0)
