"""Stand-in python for the Z adversarial scenarios (production argv shape).

Behaviour by nBundledetailid (argv[2]) prefix:
    pgerr0-*  scan summary, then "Error inserting data into PostgreSQL: ..." and EXIT 0
    pgerr4-*  same line, EXIT 4 (what smarthyperlink.py does now)
    nonl-*    the PostgreSQL error line is the LAST output and has NO trailing newline, exit 0
    late-*    ok lines, 0.2 s pause, then "ERROR: late failure", exit 0
    okish-*   lines that contain the words but are not error lines, exit 0 (must be C)
    ok-*      summary line, exit 0
"""
import sys
import time

tag = sys.argv[2] if len(sys.argv) > 2 else ""
print("SMART: fake z scanner for", tag, flush=True)
if tag.startswith("pgerr0"):
    print("SMART: pages=1 groups=1 rows=1", flush=True)
    print("Error inserting data into PostgreSQL: connection refused", flush=True)
    sys.exit(0)
if tag.startswith("pgerr4"):
    print("SMART: pages=1 groups=1 rows=1", flush=True)
    print("Error inserting data into PostgreSQL: connection refused", flush=True)
    sys.exit(4)
if tag.startswith("nonl"):
    print("SMART: pages=1 groups=1 rows=1", flush=True)
    sys.stdout.write("Error inserting data into PostgreSQL: no newline at the end")
    sys.stdout.flush()
    sys.exit(0)
if tag.startswith("late"):
    print("SMART: pages=1 groups=1 rows=1", flush=True)
    time.sleep(0.2)
    print("ERROR: late failure", flush=True)
    sys.exit(0)
if tag.startswith("okish"):
    print("SMART: 0 errors, no Error inserting happened (this is not an error line)", flush=True)
    print("ERRORS_SEEN=0", flush=True)
    print("SMART: pages=1 groups=1 rows=1", flush=True)
    sys.exit(0)
print("SMART: pages=1 groups=1 rows=1", flush=True)
sys.exit(0)
