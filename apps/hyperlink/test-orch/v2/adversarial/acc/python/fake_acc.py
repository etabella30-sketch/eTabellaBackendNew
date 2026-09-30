"""Stand-in for smarthyperlink.py used by scenario K4 (real HyperlinksearchService).

argv is the production argv (script, file_key, nBundledetailid, csv, ...).
Behaviour by nBundledetailid prefix -- every case EXITS 0 on purpose (the
success contract must catch them from the output alone):
    pgerr-*    scan summary, then "Error inserting data into PostgreSQL: ..."  -> must be F
    tb-*       python traceback on stderr, nothing on stdout                   -> must be F
    errmid-*   an INFO line that merely CONTAINS the word Error (not at start)  -> must stay C
    cr-*       "progress\\rError: ..." (error line hidden behind a carriage return, no newline before it)
    lower-*    "error: lowercase"                                              -> informational
    anything else: summary line, exit 0                                        -> C
"""
import os
import sys

pid_dir = os.environ.get("ORCH_PID_DIR")
tag = sys.argv[2] if len(sys.argv) > 2 else ""
if pid_dir:
    with open(os.path.join(pid_dir, f"{os.getpid()}.pid"), "w") as fh:
        fh.write(tag)
print("SMART: fake scanner for", tag, flush=True)
if tag.startswith("pgerr"):
    print("SMART: pages=1 groups=2 rows=2 multiline=0 crosspage=0 table=0 (cells=0 columns=0 recovered=0)", flush=True)
    print("Error inserting data into PostgreSQL: connection refused (127.0.0.1:1)", flush=True)
    sys.exit(0)
if tag.startswith("tb"):
    sys.stderr.write("Traceback (most recent call last):\n  File \"smarthyperlink.py\", line 1, in <module>\nValueError: boom\n")
    sys.stderr.flush()
    sys.exit(0)
if tag.startswith("errmid"):
    print("INFO: 3 groups matched; previous Error state cleared", flush=True)
    sys.exit(0)
if tag.startswith("cr"):
    sys.stdout.write("progress 50%\rError: hidden behind a carriage return\n")
    sys.stdout.flush()
    sys.exit(0)
if tag.startswith("lower"):
    print("error: lowercase error line", flush=True)
    sys.exit(0)
print("SMART: pages=1 groups=1 rows=1 multiline=0 crosspage=0 table=0 (cells=0 columns=0 recovered=0)", flush=True)
sys.exit(0)
