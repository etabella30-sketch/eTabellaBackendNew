#!/usr/bin/env python
"""
backfill.py - OCR existing PDFs already stored in DO Spaces, driven by an ocr_audit results CSV.

Direct mode: reads the file list from CSV, no Redis queue, no Kafka events. Safe to run next to the
live ocrProcess worker because it never touches the shared `ocr` queue.

Per file:
  1. OCRLog row via et_ocr_update  (P -> OCR -> C, or F on failure)
  2. download <bucket>/<cPath>  ->  <work-dir>/<cPath>
  3. pre-check with the audit classifier (skip if the file already has text)
  4. ocrmypdf --redo-ocr (default). Adds a text layer WITHOUT re-encoding page images, and still
     OCRs scan pages that carry a visible Bates stamp (which --skip-text would skip). --force-ocr
     rasterises everything and grew files ~7x on this box (no jbig2/pngquant), so it is opt-in only.
  5. post-check: same page count, text improved, no worse; residual text-less pages -> done_partial
  6. upload back to the same key (old S3 version KEPT unless --delete-old-versions)
  7. BDAttributes.cLVer = new version (cFVer preserved) via et_upload_update_fver
  8. progress row appended to --out (resumable with --resume)

Examples:
  python ocrProcess/backfill.py --csv tools/ocr-audit/out/case_54970cc5.scanned.csv --limit 20 --dry-run
  python ocrProcess/backfill.py --csv tools/ocr-audit/out/case_54970cc5.scanned.csv --limit 20 --workers 4
  python ocrProcess/backfill.py --csv tools/ocr-audit/out/case_54970cc5.scanned.csv --workers 12 --resume
  python ocrProcess/backfill.py --csv tools/ocr-audit/out/case_54970cc5.mixed.csv --mode skip-text --workers 12
"""
import argparse
import csv
import io
import json
import logging
import os
import shutil
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(REPO, "tools", "ocr-audit"))
from ocr_audit import analyze_pdf  # noqa: E402

TESSERACT_DIRS = [
    r"C:\Program Files\Tesseract-OCR",
    r"C:\Program Files (x86)\Tesseract-OCR",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR"),
    "/usr/bin", "/usr/local/bin",
]

FIELDS = ["nBundledetailid", "cPath", "status", "mode", "pages_before", "pages_after", "text_pages_after",
          "bytes_before", "bytes_after", "old_version", "new_version", "ocr_secs", "total_secs", "note"]


# ----------------------------------------------------------------------------- helpers

def ensure_tesseract() -> str:
    exe = shutil.which("tesseract")
    if not exe:
        for d in TESSERACT_DIRS:
            cand = os.path.join(d, "tesseract.exe" if os.name == "nt" else "tesseract")
            if os.path.isfile(cand):
                os.environ["PATH"] = d + os.pathsep + os.environ.get("PATH", "")
                exe = cand
                break
    if not exe:
        sys.exit("tesseract not found. Install UB-Mannheim Tesseract or add it to PATH.")
    return exe


def human(n: float) -> str:
    for u in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {u}"
        n /= 1024
    return f"{n:.1f} TB"


def kill_tree(proc: subprocess.Popen):
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)], capture_output=True)
        else:
            proc.kill()
    except Exception:
        pass


class Db:
    """Thread-local psycopg2 connections; calls et_* stored procedures the same way DbService does."""

    def __init__(self, env: dict):
        self.env = env
        self.local = threading.local()

    def conn(self):
        c = getattr(self.local, "conn", None)
        if c is None or c.closed:
            import psycopg2
            c = psycopg2.connect(
                host=self.env["DB_HOST"], port=self.env["DB_PORT"], dbname=self.env["DB_DATABASE"],
                user=self.env["DB_USERNAME"], password=self.env["DB_PASSWORD"],
                sslmode="require" if self.env.get("DB_SSL") == "1" else "prefer", connect_timeout=15)
            self.local.conn = c
        return c

    def call(self, fn: str, params: dict) -> list:
        c = self.conn()
        try:
            with c.cursor() as cur:
                cur.execute(f"select et_{fn}(%s::json, 'ref1')", (json.dumps(params),))
                cur.execute('fetch all in "ref1"')
                rows = cur.fetchall()
            c.commit()
            return rows
        except Exception:
            c.rollback()
            raise

    def ocr_log(self, bdid: str, status: str, user: str):
        # nUDid stays null so our rows never collide with the upload pipeline's rows for the same file
        return self.call("ocr_update", {"nMasterid": user, "nBundledetailid": bdid, "cStatus": status,
                                        "nUDid": None, "identifier": "backfill"})

    def versions(self, bdid: str):
        c = self.conn()
        with c.cursor() as cur:
            cur.execute('select "cFVer","cLVer" from "BDAttributes" where "nBundledetailid"=%s::uuid', (bdid,))
            r = cur.fetchone()
        c.commit()
        return (r[0], r[1]) if r else (None, None)

    def set_versions(self, bdid: str, cfver: str, clver: str):
        return self.call("upload_update_fver", {"nBundledetailid": bdid, "cFVer": cfver, "cLVer": clver})

    def case_owner(self, ncaseid: str):
        c = self.conn()
        with c.cursor() as cur:
            cur.execute('select "nCreateId" from "CaseMaster" where "nCaseid"=%s::uuid', (ncaseid,))
            r = cur.fetchone()
        c.commit()
        return str(r[0]) if r and r[0] else None


class Store:
    def __init__(self, env: dict):
        import boto3
        from botocore.config import Config
        self.bucket = env["DO_SPACES_BUCKET_NAME"]
        self.s3 = boto3.client(
            "s3", endpoint_url=env["DO_SPACES_ENDPOINT"], region_name="sgp1",
            aws_access_key_id=env["DO_SPACES_KEY"], aws_secret_access_key=env["DO_SPACES_SECRET"],
            config=Config(retries={"max_attempts": 5, "mode": "standard"}, max_pool_connections=32))

    def download(self, key: str, path: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.s3.download_file(self.bucket, key, path)

    def upload(self, path: str, key: str) -> str:
        with open(path, "rb") as f:
            r = self.s3.put_object(Bucket=self.bucket, Key=key, Body=f,
                                   ContentType="application/pdf", CacheControl="max-age=86400")
        return r.get("VersionId", "")

    def latest_version(self, key: str) -> str:
        r = self.s3.list_object_versions(Bucket=self.bucket, Prefix=key, MaxKeys=50)
        for v in r.get("Versions", []):
            if v["Key"] == key and v.get("IsLatest"):
                return v["VersionId"]
        return ""

    def purge_cdn(self, paths: list, token: str, cdn_id: str, tries: int = 6) -> str:
        """Purge paths (wildcards like 'doc/caseX/*' allowed) from the DO Spaces CDN edge cache.
        DO rate-limits this endpoint aggressively (HTTP 429), so callers purge a folder wildcard
        occasionally rather than one file at a time. Backs off and retries on 429."""
        import urllib.request
        import urllib.error
        req = urllib.request.Request(
            f"https://api.digitalocean.com/v2/cdn/endpoints/{cdn_id}/cache", method="DELETE",
            data=json.dumps({"files": paths}).encode(),
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
        delay = 20
        for attempt in range(tries):
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    return str(resp.status)
            except urllib.error.HTTPError as e:
                if e.code == 429 and attempt < tries - 1:
                    time.sleep(delay)
                    delay = min(delay * 2, 180)
                    continue
                raise

    def delete_other_versions(self, key: str, keep: str) -> int:
        r = self.s3.list_object_versions(Bucket=self.bucket, Prefix=key, MaxKeys=200)
        n = 0
        for v in r.get("Versions", []):
            if v["Key"] == key and v["VersionId"] != keep:
                self.s3.delete_object(Bucket=self.bucket, Key=key, VersionId=v["VersionId"])
                n += 1
        return n


# ----------------------------------------------------------------------------- core

def _log_text(log_path: str) -> str:
    try:
        with open(log_path, "rb") as f:
            return f.read().decode("utf8", "replace")
    except Exception:
        return ""


def is_digitally_signed(path: str) -> bool:
    """Cheap up-front check so signed PDFs are skipped before a 10-minute OCR run.
    Mirrors ocrmypdf's DigitalSignatureError triggers: DocMDP permissions or any /Sig form field."""
    try:
        import pikepdf
        with pikepdf.open(path) as pdf:
            root = pdf.Root
            if "/Perms" in root:
                return True
            acro = root.get("/AcroForm")
            if acro is None:
                return False
            if int(acro.get("/SigFlags", 0)) & 1:
                return True
            stack = list(acro.get("/Fields", []))
            seen = 0
            while stack and seen < 5000:
                f = stack.pop()
                seen += 1
                if str(f.get("/FT", "")) == "/Sig":
                    return True
                stack.extend(f.get("/Kids", []))
    except Exception:
        pass
    return False


def max_megapixels(path: str) -> float:
    """Largest embedded image on any page, in megapixels (A0 drawings reach 100+ MP)."""
    try:
        import fitz
        doc = fitz.open(path)
        best = 0.0
        for page in doc:
            for img in page.get_images(full=True):
                # img = (xref, smask, width, height, bpc, colorspace, ...)
                best = max(best, img[2] * img[3] / 1e6)
        doc.close()
        return best
    except Exception:
        return 0.0


def run_ocr(inp: str, out: str, mode: str, jobs: int, timeout_s: int, log_path: str, extra=(), big_mp: float = 0.0) -> tuple:
    """Run ocrmypdf CLI. Returns (returncode, seconds, last_stderr_line).

    Normal pages: tesseract timeout 180 s, skip OCR on images > 100 MP.
    Huge pages (big_mp > 50, i.e. A0/A1 drawings): never skip, allow 15 min per page, and downsample
    images wider than 10000 px before OCR so tesseract finishes. Title-block text survives that."""
    mode_flag = {"redo-ocr": "--redo-ocr", "force-ocr": "--force-ocr", "skip-text": "--skip-text"}[mode]
    if big_mp > 50:
        # A0/A1 drawings: never skip, long budget, cap at 10000 px (title-block text still legible)
        size_flags = ["--tesseract-timeout", "900", "--skip-big", "400", "--tesseract-downsample-above", "10000"]
    elif big_mp > 15:
        # normal pages scanned at 600-700 dpi (25-30 MP): tesseract crawls at ~50 s/page.
        # 5000 px on A4 is still ~430 dpi, plenty for OCR, and roughly 4x faster.
        size_flags = ["--tesseract-timeout", "400", "--skip-big", "100", "--tesseract-downsample-above", "5000"]
    else:
        size_flags = ["--tesseract-timeout", "180", "--skip-big", "100"]
    cmd = [sys.executable, "-m", "ocrmypdf", inp, out,
           "--language", "eng", "--fast-web-view", "1", "--optimize", "1",
           "--jobs", str(jobs), *size_flags, mode_flag, *extra]
    t0 = time.time()
    with open(log_path, "ab") as lf:
        lf.write((" ".join(cmd) + "\n").encode())
        proc = subprocess.Popen(cmd, stdout=lf, stderr=subprocess.STDOUT,
                                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        try:
            rc = proc.wait(timeout=timeout_s)
        except subprocess.TimeoutExpired:
            kill_tree(proc)
            return -9, time.time() - t0, f"timeout after {timeout_s}s"
    tail = ""
    try:
        with open(log_path, "rb") as lf:
            lines = [l for l in lf.read().decode("utf8", "replace").splitlines() if l.strip()]
            tail = lines[-1][:200] if lines else ""
    except Exception:
        pass
    return rc, time.time() - t0, tail


def verify(before: dict, after: dict, size_before: int, size_after: int) -> tuple:
    """Return (fatal_reason, partial_note). fatal -> do not upload. partial -> upload, status done_partial."""
    if after["verdict"] == "error":
        return f"output unreadable: {after['note']}", ""
    if after["pages"] != before["pages"]:
        return f"page count changed {before['pages']} -> {after['pages']}", ""
    improved = after["text_pages"] > before["text_pages"] or after["scan_pages"] < before["scan_pages"]
    if not improved:
        return f"no text gained (text {before['text_pages']}->{after['text_pages']}, scan {before['scan_pages']}->{after['scan_pages']})", ""
    if after["text_pages"] < before["text_pages"]:
        return f"text pages dropped {before['text_pages']} -> {after['text_pages']}", ""
    if size_before and size_after > 8 * size_before and size_after > 50 * 1024 * 1024:
        return f"output size {human(size_after)} vs input {human(size_before)}", ""
    partial = ""
    if after["scan_pages"] > 0:
        # near-blank scans (signature page, photo) legitimately yield < 150 chars; keep but flag
        partial = f"{after['scan_pages']} of {after['pages']} pages still under 150 chars after OCR"
    return "", partial


def process(item: dict, cfg: dict, db: Db, store: Store) -> dict:
    t0 = time.time()
    bdid, key = item["nBundledetailid"], item["cPath"]
    row = dict(nBundledetailid=bdid, cPath=key, status="", mode=cfg["mode"], pages_before="", pages_after="",
               text_pages_after="", bytes_before="", bytes_after="", old_version="", new_version="",
               ocr_secs="", total_secs="", note="")
    local_in = os.path.join(cfg["work_dir"], key.replace("/", os.sep))
    local_out = local_in[:-4] + ".ocr.pdf" if local_in.lower().endswith(".pdf") else local_in + ".ocr.pdf"
    log_path = os.path.join(cfg["work_dir"], "logs", bdid + ".log")
    logged = False
    try:
        if cfg["dry_run"]:
            row.update(status="dry_run")
            return row
        db.ocr_log(bdid, "P", cfg["user"])
        db.ocr_log(bdid, "OCR", cfg["user"])
        logged = True

        if not os.path.isfile(local_in):
            store.download(key, local_in)
        row["bytes_before"] = os.path.getsize(local_in)
        row["old_version"] = store.latest_version(key)

        with open(local_in, "rb") as f:
            before = analyze_pdf(f.read())
        row["pages_before"] = before["pages"]
        if before["verdict"] == "error":
            raise RuntimeError(f"input unreadable: {before['note']}")
        if before["verdict"] in ("ok_text", "vector", "blank"):
            row.update(status="skipped_has_text", note=before["verdict"])
            db.ocr_log(bdid, "C", cfg["user"])
            return row
        if cfg["max_pages"] and before["pages"] > cfg["max_pages"]:
            row.update(status="deferred_big", note=f"{before['pages']} pages > --max-pages")
            db.ocr_log(bdid, "F", cfg["user"])
            return row

        if not cfg.get("invalidate_signatures") and is_digitally_signed(local_in):
            row.update(status="skipped_signed", note="digitally signed PDF; rerun with --invalidate-signatures to OCR")
            db.ocr_log(bdid, "F", cfg["user"])
            if not cfg["keep_local"]:
                try:
                    os.remove(local_in)
                except OSError:
                    pass
            return row

        mode = cfg["mode"]
        if mode == "auto":
            mode = "redo-ocr"  # keeps original images; handles stamped scan pages; see docstring
        row["mode"] = mode
        if os.path.exists(local_out):
            os.remove(local_out)
        extra = ["--rotate-pages"] if cfg.get("rotate_pages") else []
        if cfg.get("invalidate_signatures"):
            extra.append("--invalidate-digital-signatures")
        big_mp = max_megapixels(local_in)
        if big_mp > 50:
            row["note"] = f"big image {big_mp:.0f} MP"
        # file-level kill timer scales with page count: 45 s/page floor, 8 h ceiling, never below --timeout-min
        timeout_s = min(max(cfg["timeout_s"], before["pages"] * 45), 8 * 3600)
        cfg = dict(cfg, timeout_s=timeout_s)
        rc, secs, tail = run_ocr(local_in, local_out, mode, cfg["jobs"], cfg["timeout_s"], log_path, extra, big_mp)
        row["ocr_secs"] = round(secs, 1)
        if rc == 4 and mode == "redo-ocr":
            # ExitCode.invalid_output_pdf: ocrmypdf's output failed qpdf validation. Seen when the source
            # carries a broken /Outlines (bookmark) tree or annotations with dangling references that get
            # copied through. Fallback 1: strip outlines, retry; fallback 2: strip annotations too, retry.
            repaired = local_in + ".repaired.pdf"
            for strip in ("outlines", "outlines+annots"):
                try:
                    import pikepdf
                    with pikepdf.open(local_in) as _p:
                        if "/Outlines" in _p.Root:
                            del _p.Root["/Outlines"]
                        if strip == "outlines+annots":
                            for _pg in _p.pages:
                                if "/Annots" in _pg:
                                    del _pg["/Annots"]
                        _p.save(repaired)
                    if os.path.exists(local_out):
                        os.remove(local_out)
                    rc, secs2, tail = run_ocr(repaired, local_out, mode, cfg["jobs"], cfg["timeout_s"], log_path, extra, big_mp)
                    secs += secs2
                    row["mode"] = f"redo-ocr(stripped {strip})"
                except Exception as e:
                    rc = 4
                    tail = f"repair failed: {e}"
                finally:
                    try:
                        os.remove(repaired)
                    except OSError:
                        pass
                if rc == 0:
                    break
        if rc == 7 and mode == "redo-ocr":
            # rc=7 = a tesseract child died mid-run. Seen on 200+ page files after 20-30 min, and the same
            # pages OCR fine in isolation -> transient (temp-file churn / AV). Retry the same mode once.
            if os.path.exists(local_out):
                os.remove(local_out)
            rc, secs2, tail = run_ocr(local_in, local_out, mode, cfg["jobs"], cfg["timeout_s"], log_path, extra, big_mp)
            secs += secs2
            if rc == 0:
                row["mode"] = "redo-ocr(retry)"
        if rc in (4, 7):
            # Fallback 2: force-ocr re-renders every page via Ghostscript (tolerates bad streams; bigger file).
            mode = "force-ocr"
            row["mode"] = "force-ocr(fallback)"
            if os.path.exists(local_out):
                os.remove(local_out)
            rc, secs2, tail = run_ocr(local_in, local_out, mode, cfg["jobs"], cfg["timeout_s"], log_path, extra, big_mp)
            secs += secs2
        row["ocr_secs"] = round(secs, 1)
        if rc == 2 and "DigitalSignatureError" in _log_text(log_path):
            # digitally signed PDF: OCR would invalidate the signature. Leave untouched unless told otherwise.
            row.update(status="skipped_signed", note="digitally signed PDF; rerun with --invalidate-signatures to OCR")
            db.ocr_log(bdid, "F", cfg["user"])
            return row
        if rc != 0 or not os.path.isfile(local_out):
            raise RuntimeError(f"ocrmypdf rc={rc}: {tail}")

        row["bytes_after"] = os.path.getsize(local_out)
        with open(local_out, "rb") as f:
            after = analyze_pdf(f.read())
        row.update(pages_after=after["pages"], text_pages_after=after["text_pages"])
        reason, partial = verify(before, after, row["bytes_before"], row["bytes_after"])
        if reason.startswith("no text gained"):
            # OCR ran cleanly but found nothing new (photo/drawing pages, or already OCR'd elsewhere).
            # Not an error: leave the live file untouched.
            row.update(status="skipped_no_gain", note=reason)
            db.ocr_log(bdid, "C", cfg["user"])
            if not cfg["keep_local"]:
                for p in (local_in, local_out):
                    try:
                        os.remove(p)
                    except OSError:
                        pass
            return row
        if reason:
            raise RuntimeError("verify failed: " + reason)
        if partial:
            row["note"] = (row["note"] + " | " + partial).strip(" |")

        new_ver = store.upload(local_out, key)
        row["new_version"] = new_ver
        cfver, _ = db.versions(bdid)
        db.set_versions(bdid, cfver or new_ver, new_ver)
        if cfg["delete_old_versions"] and new_ver:
            store.delete_other_versions(key, new_ver)
        db.ocr_log(bdid, "C", cfg["user"])
        row["status"] = "done_partial" if partial else "done"
        if not cfg["keep_local"]:
            for p in (local_in, local_out):
                try:
                    os.remove(p)
                except OSError:
                    pass
        return row
    except Exception as e:
        row.update(status="failed", note=f"{type(e).__name__}: {e}"[:300])
        if logged:
            try:
                db.ocr_log(bdid, "F", cfg["user"])
            except Exception as e2:
                row["note"] += f" | log: {e2}"[:100]
        return row
    finally:
        row["total_secs"] = round(time.time() - t0, 1)


# ----------------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--csv", required=True, help="ocr_audit results csv (or a split of it)")
    ap.add_argument("--verdict", default="", help="only rows with this verdict (default: all rows in csv)")
    ap.add_argument("--ids", help="text file with nBundledetailid per line to restrict to")
    ap.add_argument("--pages-max", type=int, default=0, help="only files with <= N pages (0 = no cap)")
    ap.add_argument("--pages-min", type=int, default=0, help="only files with >= N pages")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--offset", type=int, default=0)
    ap.add_argument("--mode", choices=["auto", "redo-ocr", "force-ocr", "skip-text"], default="auto",
                    help="auto = redo-ocr. force-ocr rasterises pages (big files); skip-text skips stamped scans")
    ap.add_argument("--workers", type=int, default=4, help="files in parallel")
    ap.add_argument("--jobs", type=int, default=2, help="tesseract threads per file")
    ap.add_argument("--timeout-min", type=int, default=90, help="kill ocrmypdf after this many minutes")
    ap.add_argument("--max-pages", type=int, default=0, help="defer files bigger than this (0 = none)")
    ap.add_argument("--work-dir", default=r"D:\ocr_work" if os.name == "nt" else "/tmp/ocr_work")
    ap.add_argument("--env", default=os.path.join(REPO, ".env.development"))
    ap.add_argument("--user", help="nMasterid written to OCRLog (default: CaseMaster.nCreateId of the case)")
    ap.add_argument("--out", help="progress csv (default ocrProcess/out/backfill_<csvname>.csv)")
    ap.add_argument("--resume", action="store_true", help="skip ids already 'done' or 'skipped_*' in --out")
    ap.add_argument("--dry-run", action="store_true", help="list what would run, touch nothing")
    ap.add_argument("--delete-old-versions", action="store_true", help="delete previous S3 versions (default keep)")
    ap.add_argument("--purge-cdn", action="store_true",
                    help="purge the case folder(s) from the DO CDN edge cache every --purge-every minutes and at the "
                         "end (one wildcard request per folder; needs DO_TOKEN + DO_CDN_ID in env). Without it, "
                         "viewers may see the old file for up to 24h (Cache-Control max-age=86400)")
    ap.add_argument("--purge-every", type=int, default=15, help="minutes between CDN folder purges (default 15)")
    ap.add_argument("--purge-only", action="store_true",
                    help="do no OCR: purge the CDN for every case folder present in --out ledger, then exit")
    ap.add_argument("--invalidate-signatures", action="store_true",
                    help="OCR digitally signed PDFs too (breaks their signature; previous S3 version keeps the signed "
                         "original). Default: mark them skipped_signed and leave untouched")
    ap.add_argument("--rotate-pages", action="store_true",
                    help="let tesseract fix upside-down/sideways pages. OFF by default: it changes page "
                         "geometry, which can shift existing user annotations on those pages")
    ap.add_argument("--keep-local", action="store_true", help="keep downloaded/ocr files in work-dir")
    args = ap.parse_args()

    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    from dotenv import dotenv_values
    env = dotenv_values(args.env)
    for k in ("DB_HOST", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD", "DO_SPACES_ENDPOINT",
              "DO_SPACES_BUCKET_NAME", "DO_SPACES_KEY", "DO_SPACES_SECRET"):
        if not env.get(k):
            sys.exit(f"missing {k} in {args.env}")

    if args.purge_only:
        out = args.out or os.path.join(HERE, "out", f"backfill_{os.path.splitext(os.path.basename(args.csv))[0]}.csv")
        if not (env.get("DO_TOKEN") and env.get("DO_CDN_ID")):
            sys.exit("--purge-only needs DO_TOKEN and DO_CDN_ID in the env file")
        folders = sorted({r["cPath"].rsplit("/", 1)[0] + "/*" for r in csv.DictReader(open(out, newline="", encoding="utf-8"))
                          if r.get("status", "").startswith("done")})
        if not folders:
            sys.exit(f"no done rows in {out}")
        st = Store(env).purge_cdn(folders, env["DO_TOKEN"], env["DO_CDN_ID"])
        print(f"CDN purge {st} for {folders}")
        return

    # items
    rows = list(csv.DictReader(open(args.csv, newline="", encoding="utf-8")))
    if args.verdict:
        rows = [r for r in rows if r.get("verdict") == args.verdict]
    if args.ids:
        want = {l.strip() for l in open(args.ids, encoding="utf-8") if l.strip()}
        rows = [r for r in rows if r["nBundledetailid"] in want]
    rows = [r for r in rows if r.get("nBundledetailid") and r.get("cPath")]
    pages_of = lambda r: int(r["pages"]) if str(r.get("pages", "")).isdigit() else 0
    if args.pages_max:
        rows = [r for r in rows if pages_of(r) <= args.pages_max]
    if args.pages_min:
        rows = [r for r in rows if pages_of(r) >= args.pages_min]
    rows.sort(key=lambda r: (pages_of(r), r["cPath"]))
    if args.offset:
        rows = rows[args.offset:]
    if args.limit:
        rows = rows[:args.limit]

    base = os.path.splitext(os.path.basename(args.csv))[0]
    out = args.out or os.path.join(HERE, "out", f"backfill_{base}.csv")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    os.makedirs(os.path.join(args.work_dir, "logs"), exist_ok=True)
    # keep ocrmypdf's per-page temp files on the work drive instead of the user profile temp dir
    tmp = os.path.join(args.work_dir, "tmp")
    os.makedirs(tmp, exist_ok=True)
    for k in ("TMPDIR", "TEMP", "TMP"):
        os.environ[k] = tmp

    done_ids = set()
    if args.resume and os.path.isfile(out):
        for r in csv.DictReader(open(out, newline="", encoding="utf-8")):
            st = r.get("status", "")
            if st == "skipped_signed" and args.invalidate_signatures:
                continue  # user now wants signed files OCR'd -> not done
            if st.startswith(("done", "skipped")):
                done_ids.add(r["nBundledetailid"])
        before_n = len(rows)
        rows = [r for r in rows if r["nBundledetailid"] not in done_ids]
        print(f"resume: {before_n - len(rows)} already done, {len(rows)} remaining")
    if not rows:
        print("nothing to do")
        return

    tess = ensure_tesseract()
    db = Db(env)
    store = Store(env)
    user = args.user
    if not user:
        ncase = next((r.get("nCaseid") for r in rows if r.get("nCaseid")), None)
        user = db.case_owner(ncase) if ncase else None
    if not user and not args.dry_run:
        sys.exit("cannot determine --user (nMasterid for OCRLog); pass --user <uuid>")

    verdicts = {}
    for r in rows:
        verdicts[r.get("verdict", "?")] = verdicts.get(r.get("verdict", "?"), 0) + 1
    total_pages = sum(int(r["pages"]) for r in rows if str(r.get("pages", "")).isdigit())
    total_bytes = sum(int(r["bytes"]) for r in rows if str(r.get("bytes", "")).isdigit())
    print(f"files={len(rows)} {verdicts} pages={total_pages:,} size={human(total_bytes)} mode={args.mode} "
          f"workers={args.workers} jobs={args.jobs} user={user} tesseract={tess}")
    print(f"work_dir={args.work_dir} out={out} keep_old_versions={not args.delete_old_versions} "
          f"dry_run={args.dry_run}", flush=True)
    if args.dry_run:
        for r in rows[:50]:
            print(f"  {r.get('pages', '?'):>5}p  {r.get('verdict', '?'):<8} {r['cPath']}")
        if len(rows) > 50:
            print(f"  ... {len(rows) - 50} more")
        return

    cfg = dict(mode=args.mode, jobs=args.jobs, timeout_s=args.timeout_min * 60, max_pages=args.max_pages,
               work_dir=args.work_dir, user=user, dry_run=False, delete_old_versions=args.delete_old_versions,
               keep_local=args.keep_local, rotate_pages=args.rotate_pages,
               invalidate_signatures=args.invalidate_signatures,
               purge_cdn=args.purge_cdn, do_token=env.get("DO_TOKEN", ""), cdn_id=env.get("DO_CDN_ID", ""))
    if args.purge_cdn and not (cfg["do_token"] and cfg["cdn_id"]):
        sys.exit("--purge-cdn needs DO_TOKEN and DO_CDN_ID in the env file")

    append = args.resume and os.path.isfile(out)
    fh = open(out, "a" if append else "w", newline="", encoding="utf-8")
    wr = csv.DictWriter(fh, fieldnames=FIELDS, extrasaction="ignore")
    if not append:
        wr.writeheader()
    counts = {}
    pages_done = 0
    t0 = time.time()
    n = 0
    purge_folders = set()
    last_purge = time.time()

    def do_purge(tag):
        if not (cfg["purge_cdn"] and purge_folders):
            return
        try:
            st = store.purge_cdn(sorted(purge_folders), cfg["do_token"], cfg["cdn_id"])
            print(f"   [cdn purge {tag}] {st} for {len(purge_folders)} folder(s)", flush=True)
        except Exception as e:
            print(f"   [cdn purge {tag}] FAILED: {e}  (rerun later with --purge-only)", flush=True)

    try:
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futs = {ex.submit(process, r, cfg, db, store): r for r in rows}
            for fut in as_completed(futs):
                row = fut.result()
                wr.writerow(row)
                fh.flush()
                n += 1
                counts[row["status"]] = counts.get(row["status"], 0) + 1
                if row["status"].startswith("done"):
                    pages_done += int(row["pages_after"] or 0)
                    purge_folders.add(row["cPath"].rsplit("/", 1)[0] + "/*")
                if cfg["purge_cdn"] and time.time() - last_purge > args.purge_every * 60:
                    do_purge("periodic")
                    last_purge = time.time()
                el = time.time() - t0
                rate = pages_done / el if el else 0
                left = max(0, total_pages - pages_done)
                eta = left / rate / 60 if rate else 0
                mark = "OK " if row["status"].startswith("done") else ("-- " if row["status"].startswith(("skipped", "deferred")) else "!! ")
                print(f"{mark}[{n:>5}/{len(rows)}] {row['status']:<17} {str(row['pages_before']):>5}p "
                      f"{str(row['ocr_secs']):>7}s  {row['cPath'].split('/')[-1][:40]:<40} {row['note'][:60]}"
                      f"   | {rate:4.1f} p/s eta {eta:5.0f} min", flush=True)
    except KeyboardInterrupt:
        print("\ninterrupted - rerun with --resume")
    finally:
        fh.close()
    do_purge("final")
    el = time.time() - t0
    print(f"\n===== BACKFILL SUMMARY ===== {n} files in {el/60:.1f} min, {pages_done:,} pages OCR'd")
    for k, v in sorted(counts.items()):
        print(f"  {k:<18} {v:>6}")
    print(f"progress csv: {out}\nper-file ocrmypdf logs: {os.path.join(args.work_dir, 'logs')}")


if __name__ == "__main__":
    main()
