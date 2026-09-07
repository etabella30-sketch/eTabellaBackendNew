"""
smarthyperlink.py -- drop-in replacement for ``hyperlinking.py`` (bracket mode).

Command line (identical to the reference script, argv[1..9]):

    python smarthyperlink.py <file_key> <nBundledetailid> <csv_out> <nBundledetailid>
                             <bucket> <s3_key> <s3_secret> <s3_endpoint> <temp_download_path>

Environment: DB_DATABASE DB_USERNAME DB_PASSWORD DB_HOST DB_PORT, PYTHONIOENCODING=UTF-8.

Flow (same as the reference):
    1. download the PDF from S3 to <temp_download_path>
    2. delete <csv_out> if present
    3. scan the PDF (textmatch.scan_document) and write one CSV row per rect:
       page(1-based), extracted_text, x0, y0, x1, y1, nBundledetailid
    4. DELETE FROM pdf_data WHERE "nBundledetailid"=%s, then COPY the CSV in
    5. remove the temp file.  Exit code 0 even on error (errors are printed).

Local / dry-run mode (for testing, see SPEC section 3):
    * if argv[1] is an existing local file it is used directly -- no S3
      download and the file is NOT deleted at the end.  To make sure a stale
      local file can never shadow an S3 key in production, local mode is only
      taken when the S3 arguments are absent (fewer than 10 argv) or when
      env SMART_LOCAL=1 is set explicitly; "SMART: local mode" is printed;
    * if env SMART_DRYRUN=1 the DB step is skipped.  With the full production
      argv and no DB_HOST the DB step is skipped too, but that is reported as
      "Error: DB_HOST not set ..." (a mis-configured service must not look
      like a successful run);
    * argv[5..9] may be missing in that mode.
    SMART_DRYRUN / SMART_LOCAL must never be set in the service environment.

Deployment: this script AND ``textmatch.py`` must be copied together into
the same directory (``assets/pythons/hyperlink/``).  Requirements: Python 3.8+
and PyMuPDF 1.23+ (``page.find_tables``; on an older PyMuPDF ruled-table
cell detection is disabled and the gap rule takes over, a warning is printed).
Version problems are reported as "Error: ..." with exit code 0, like every
other error, never as a traceback.  No ``__pycache__`` is written next to
the scripts.

Rotated pages (/Rotate 90/180/270): the emitted rects are the raw
text-extraction boxes (the same space ``page.search_for`` returns and the
production deep-scan script writes); the legacy ``rotate_rect`` of the
bracket script is NOT applied (``textmatch.APPLY_LEGACY_ROTATE_RECT``).

At the end a summary line is printed:
    SMART: pages=<n> groups=<n> rows=<n> multiline=<n> crosspage=<n> table=<n> (cells=<n> columns=<n> recovered=<n>)
where table = cells (page.find_tables cells) + columns (gap-rule column
chains) and recovered = groups whose '[' was OCR'd as '|'.
"""

from __future__ import annotations

import csv
import os
import sys
import time

MIN_PYTHON = (3, 8)
MIN_PYMUPDF = (1, 23)  # page.find_tables
MIN_PYMUPDF_HARD = (1, 19)  # rawdict 'dir', TEXT_MEDIABOX_CLIP, derotation_matrix


def _configure_stdout():
    """Windows consoles default to a legacy code page; force UTF-8 output.

    ``errors="backslashreplace"`` so that printing an exception message with
    an unencodable code point (lone surrogate from a malformed key) can never
    itself raise inside the error handler.
    """
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="backslashreplace")
        except Exception:  # pragma: no cover - not all streams support reconfigure
            pass


def _version_tuple(text):
    out = []
    for part in str(text).split("."):
        digits = ""
        for ch in part:
            if not ch.isdigit():
                break
            digits += ch
        if not digits:
            break
        out.append(int(digits))
    return tuple(out)


def _prerequisites():
    """Return an error message when the runtime cannot run this script, else None.

    Checked BEFORE importing textmatch so that an unsupported interpreter
    yields a clean "Error: ..." line and exit code 0 instead of a traceback.
    """
    if sys.version_info < MIN_PYTHON:
        return "Error: Python %s+ required, found %s" % (".".join(map(str, MIN_PYTHON)), sys.version.split()[0])
    try:
        import fitz  # noqa: F401
    except Exception as e:  # pragma: no cover - depends on the host
        return "Error: PyMuPDF (fitz) is not installed: %s" % e
    ver_text = getattr(fitz, "VersionBind", None) or getattr(fitz, "version", ("0",))[0]
    ver = _version_tuple(ver_text)
    if ver < MIN_PYMUPDF_HARD:
        return "Error: PyMuPDF %s+ required, found %s" % (".".join(map(str, MIN_PYMUPDF_HARD)), ver_text)
    if ver < MIN_PYMUPDF:
        print("SMART: warning: PyMuPDF %s < %s: page.find_tables unavailable, ruled-table cells "
              "fall back to the gap rule" % (ver_text, ".".join(map(str, MIN_PYMUPDF))))
    return None


# Do not litter the deployment directory with __pycache__/ (the scripts are
# copied around by hand and served next to other assets).
sys.dont_write_bytecode = True
# textmatch.py lives next to this file (also when copied into assets/pythons/...);
# the explicit path entry matters when this module is imported from elsewhere
# (pytest) -- when run as a script the directory is already sys.path[0].
_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)


# ---------------------------------------------------------------------------
# S3 download -- same as the reference implementation
# ---------------------------------------------------------------------------


def download_pdf_to_disk(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path):
    import boto3
    from botocore.client import Config

    s3 = boto3.client(
        "s3",
        region_name="sgp1",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
    )
    print("DOWNLOAD =>", bucket_name, file_key)
    with open(download_path, "wb") as f:
        s3.download_fileobj(bucket_name, file_key, f)
    print(f"Successfully downloaded '{file_key}' to '{download_path}'.")


# ---------------------------------------------------------------------------
# Scanning + CSV
# ---------------------------------------------------------------------------


def scan_pdf_to_csv(pdf_path: str, output_file: str, nbundledetailid: str):
    """Scan the PDF and write the CSV (no header, same columns as the reference)."""
    import fitz
    import textmatch

    stats = textmatch.ScanStats()
    document = fitz.open(pdf_path)
    try:
        matches = textmatch.scan_document(document, stats)
    finally:
        document.close()
    rows = textmatch.matches_to_rows(matches)
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        for page, text, x0, y0, x1, y1 in rows:
            writer.writerow([page, text, x0, y0, x1, y1, nbundledetailid])
    return stats


# ---------------------------------------------------------------------------
# PostgreSQL -- delete-before-insert + COPY, same as the reference
# ---------------------------------------------------------------------------


def insert_csv_to_postgres(csv_file, conn_params, nbundledetailid):
    try:
        import psycopg2

        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        print(f"Connected to the PostgreSQL database: {conn_params['dbname']}")

        # Step 1: Delete existing records for the given nBundledetailid
        delete_query = 'DELETE FROM pdf_data WHERE "nBundledetailid" = %s;'
        cursor.execute(delete_query, (nbundledetailid,))
        print(f"Deleted records with nBundledetailid = {nbundledetailid}")

        # Step 2: Insert new CSV data (the CSV is written as UTF-8 above)
        print(f"Inserting data from {csv_file} into the PostgreSQL table...")
        with open(csv_file, "r", encoding="utf-8") as f:
            copy_query = """
                COPY pdf_data (page, extracted_text, x0, y0, x1, y1, "nBundledetailid")
                FROM STDIN
                WITH (FORMAT csv)
            """
            cursor.copy_expert(copy_query, f)

        conn.commit()
        print(f"Successfully inserted data from {csv_file} into the PostgreSQL table.")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error inserting data into PostgreSQL: {e}")


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def _arg(i: int, default=None):
    return sys.argv[i] if len(sys.argv) > i else default


def main() -> int:
    _configure_stdout()
    started = time.time()
    problem = _prerequisites()
    if problem is None:
        try:
            import textmatch  # noqa: F401
        except Exception as e:
            problem = "Error: cannot import textmatch.py (deploy it next to %s): %s" % (os.path.basename(__file__), e)
    if problem is not None:
        print(problem)
        return 0

    file_key = _arg(1)
    nbundledetailid = _arg(2)
    output_file = _arg(3)
    if not file_key or not nbundledetailid or not output_file:
        print("usage: smarthyperlink.py <file_key|local.pdf> <nBundledetailid> <csv_out> [<nBundledetailid> <bucket> <key> <secret> <endpoint> <temp_path>]")
        return 0

    bucket_name = _arg(5)
    access_key = _arg(6)
    secret_key = _arg(7)
    endpoint_url = _arg(8)
    download_path = _arg(9)

    # local mode: argv[1] is an existing file AND either the S3 arguments are
    # absent or SMART_LOCAL=1 (never implicit in the full production call)
    local_allowed = len(sys.argv) < 10 or os.getenv("SMART_LOCAL") == "1"
    local_mode = local_allowed and os.path.isfile(file_key)
    dry_run = os.getenv("SMART_DRYRUN") == "1"
    db_missing = not os.getenv("DB_HOST")
    if local_mode:
        print(f"SMART: local mode ({file_key})")

    conn_params = {
        "dbname": os.getenv("DB_DATABASE"),
        "user": os.getenv("DB_USERNAME"),
        "password": os.getenv("DB_PASSWORD"),
        "host": os.getenv("DB_HOST"),
        "port": int(os.getenv("DB_PORT") or 5432),
    }

    pdf_path = file_key if local_mode else download_path
    try:
        # Step 1: Download the PDF from the S3 bucket (unless a local file was given)
        if not local_mode:
            download_pdf_to_disk(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path)

        # Step 2: Clear existing content in the output file before starting
        if os.path.exists(output_file):
            os.remove(output_file)

        # Step 3: Perform the search and write results to CSV
        stats = scan_pdf_to_csv(pdf_path, output_file, nbundledetailid)
        print(stats.summary())

        # Step 4: Insert CSV data into PostgreSQL (after deleting old records)
        if dry_run:
            print("SMART: dry-run, DB step skipped")
        elif db_missing:
            if len(sys.argv) >= 10:
                print("Error: DB_HOST not set; DB step skipped (pdf_data NOT updated)")
            else:
                print("SMART: DB_HOST not set, DB step skipped")
        else:
            insert_csv_to_postgres(output_file, conn_params, nbundledetailid)

    except Exception as e:
        print(f"Error: {e}")

    finally:
        # Step 5: Clean up: Remove the downloaded file (never a local input file)
        if not local_mode and download_path and os.path.exists(download_path):
            os.remove(download_path)
        print(f"SMART: elapsed={time.time() - started:.2f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
