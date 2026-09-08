#!/usr/bin/env python
"""
ocr_audit.py - count how many PDFs in the platform still need OCR.

Per page (PyMuPDF, no rasterizing):
  scan     : image covers >= 50% of page and < --stamp-chars text (scan + Bates stamp) -> needs OCR
  text     : extractable text >= --min-chars and looks like real words
  junk     : text present but mostly control/symbol chars (font w/o ToUnicode, bad OCR) -> redo
  vector   : no text, no big image, many drawing ops (CAD plan, chart)
  blank    : nothing at all

Per file verdict:
  ok_text  : every page has real text          -> no OCR needed
  mixed    : some scan pages                   -> OCR only those pages (scan_page_nums column)
  scanned  : every page is scan                -> full OCR
  junk     : real text missing, junk layer     -> redo OCR
  vector   : drawings only                     -> OCR optional, not counted as need_ocr
  blank    : nothing to OCR
  error    : could not download/open (see note column)

NEED OCR = scanned + mixed + junk

Sources:
  --source db   (default) BundleDetail rows (cStatus='C', cFiletype='PDF'), files pulled from DO Spaces
  --source dir  walk a local folder
  --source csv  first column = S3 key / local path

Examples:
  python tools/ocr-audit/ocr_audit.py --plan                      # counts + bytes, no download
  python tools/ocr-audit/ocr_audit.py --limit 500 --workers 8     # sample run
  python tools/ocr-audit/ocr_audit.py --case case1131 --resume    # one case, resumable
  python tools/ocr-audit/ocr_audit.py --source dir --dir ./assets/doc
"""
import argparse
import csv
import os
import sys
import time
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor, as_completed

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("pip install pymupdf")

# ----------------------------------------------------------------------------- analysis


def _image_cover(page) -> float:
    """Fraction of page area covered by placed images (can exceed 1.0 when images overlap)."""
    area = page.rect.width * page.rect.height or 1.0
    cover = 0.0
    try:
        for img in page.get_images(full=True):
            for r in page.get_image_rects(img[0]):
                cover += (r.width * r.height) / area
    except Exception:
        cover = 1.0 if page.get_images() else 0.0
    return cover


def analyze_pdf(data: bytes, max_pages: int = 0, min_chars: int = 20, junk_ratio: float = 0.6,
                stamp_chars: int = 150, vector_min: int = 200) -> dict:
    """Classify one PDF from bytes. Never raises for content problems; returns verdict=error instead.

    Page rules (in order):
      scan   : image cover >= 0.5 and chars < stamp_chars   (full-page image + at most a Bates stamp)
      text   : chars >= min_chars and mostly alnum
      junk   : chars >= min_chars but mostly control/symbol chars (font without ToUnicode -> redo OCR)
      vector : no text, no big image, >= vector_min drawing ops (CAD plan, chart) -> OCR optional
      blank  : nothing at all
    """
    out = dict(pages=0, checked=0, text_pages=0, junk_pages=0, scan_pages=0, vector_pages=0, blank_pages=0,
               scan_page_nums="", verdict="error", note="")
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as e:
        out["note"] = f"open: {e}"[:200]
        return out
    try:
        if doc.needs_pass:
            out["note"] = "encrypted"
            return out
        n = doc.page_count
        out["pages"] = n
        if n == 0:
            out["note"] = "zero pages"
            return out
        if max_pages and n > max_pages:
            step = n / max_pages
            idx = sorted({int(i * step) for i in range(max_pages)} | {0, n - 1})
        else:
            idx = list(range(n))
        scan_nums = []
        for i in idx:
            page = doc[i]
            txt = page.get_text("text").strip()
            chars = len(txt)
            cover = _image_cover(page) if (chars < stamp_chars and page.get_images()) else 0.0
            if cover >= 0.5:
                # an invisible OCR text layer (spans with alpha 0, or GlyphLessFont) means this page WAS
                # OCR'd and simply has little text on it (photo, divider sheet) -> count as text
                try:
                    has_ocr_layer = any(
                        s.get("alpha", 255) == 0 and s.get("text", "").strip()
                        for b in page.get_text("dict")["blocks"] if b.get("type") == 0
                        for l in b["lines"] for s in l["spans"]
                    ) or any("glyphless" in (f[3] or "").lower() for f in page.get_fonts())
                except Exception:
                    has_ocr_layer = False
                if has_ocr_layer and chars > 0:
                    out["text_pages"] += 1
                    continue
                out["scan_pages"] += 1
                scan_nums.append(i + 1)
                continue
            if chars >= min_chars:
                good = sum(1 for c in txt if c.isalnum() or c.isspace())
                if good / chars >= junk_ratio:
                    out["text_pages"] += 1
                else:
                    out["junk_pages"] += 1
                continue
            try:
                ndraw = len(page.get_drawings())
            except Exception:
                ndraw = 0
            if ndraw >= vector_min:
                out["vector_pages"] += 1
            else:
                out["blank_pages"] += 1
        checked = len(idx)
        out["checked"] = checked
        out["scan_page_nums"] = ",".join(map(str, scan_nums[:50]))
        if out["scan_pages"] == checked:
            out["verdict"] = "scanned"
        elif out["scan_pages"] > 0:
            out["verdict"] = "mixed"
        elif out["text_pages"] == 0 and out["junk_pages"] > 0:
            out["verdict"] = "junk"
        elif out["text_pages"] == 0 and out["vector_pages"] > 0:
            out["verdict"] = "vector"
        elif out["text_pages"] == 0:
            out["verdict"] = "blank"
        else:
            out["verdict"] = "ok_text"
        return out
    except Exception as e:
        out["note"] = f"analyze: {e}"[:200]
        return out
    finally:
        doc.close()


# ----------------------------------------------------------------------------- workers

_S3 = None
_CFG = {}


def _init_worker(cfg: dict):
    global _S3, _CFG
    _CFG = cfg
    try:
        fitz.TOOLS.mupdf_display_errors(False)  # damaged PDFs otherwise spam stderr
    except Exception:
        pass
    if cfg.get("use_s3"):
        import boto3
        from botocore.config import Config
        _S3 = boto3.client(
            "s3",
            endpoint_url=cfg["endpoint"],
            region_name=cfg.get("region", "sgp1"),
            aws_access_key_id=cfg["key"],
            aws_secret_access_key=cfg["secret"],
            config=Config(retries={"max_attempts": 4, "mode": "standard"}, max_pool_connections=4),
        )


def _fetch(path: str):
    """Return (bytes, src). Prefer local copy under local_root if present, else S3, else plain path."""
    root = _CFG.get("local_root")
    if root:
        lp = os.path.join(root, path)
        if os.path.isfile(lp):
            with open(lp, "rb") as f:
                return f.read(), "local"
    if _CFG.get("use_s3"):
        obj = _S3.get_object(Bucket=_CFG["bucket"], Key=path)
        return obj["Body"].read(), "s3"
    if os.path.isfile(path):
        with open(path, "rb") as f:
            return f.read(), "local"
    raise FileNotFoundError(path)


EMPTY = dict(bytes=0, pages=0, checked=0, text_pages=0, junk_pages=0, scan_pages=0, vector_pages=0,
             blank_pages=0, scan_page_nums="", src="")


def _work(item: dict) -> dict:
    t0 = time.time()
    res = dict(item)
    try:
        max_mb = _CFG.get("max_mb") or 0
        size_s = str(item.get("cFilesize") or "")
        size = int(size_s) if size_s.isdigit() else 0
        if max_mb and size > max_mb * 1024 * 1024:
            res.update(EMPTY, verdict="skipped_big", note=f"{size} bytes")
            return res
        data, src = _fetch(item["cPath"])
        res.update(analyze_pdf(data, _CFG.get("max_pages", 0), _CFG.get("min_chars", 20),
                               stamp_chars=_CFG.get("stamp_chars", 150)))
        res["bytes"] = len(data)
        res["src"] = src
    except Exception as e:
        res.update(EMPTY, verdict="error", note=f"{type(e).__name__}: {e}"[:200])
    res["secs"] = round(time.time() - t0, 2)
    return res


# ----------------------------------------------------------------------------- sources


def load_env(path: str) -> dict:
    try:
        from dotenv import dotenv_values
    except ImportError:
        sys.exit("pip install python-dotenv")
    if not os.path.isfile(path):
        sys.exit(f"env file not found: {path}")
    return dotenv_values(path)


def items_from_db(env: dict, args) -> list:
    try:
        import psycopg2
    except ImportError:
        sys.exit("pip install psycopg2-binary")
    conn = psycopg2.connect(
        host=env["DB_HOST"], port=env["DB_PORT"], dbname=env["DB_DATABASE"],
        user=env["DB_USERNAME"], password=env["DB_PASSWORD"],
        sslmode="require" if env.get("DB_SSL") == "1" else "prefer", connect_timeout=15)
    where = ["upper(bd.\"cFiletype\") = 'PDF'", "bd.\"cStatus\" = 'C'", "bd.\"cPath\" is not null"]
    params = []
    if args.case:
        if args.case.lower().startswith("case"):
            where.append("split_part(bd.\"cPath\", '/', 2) = %s")
            params.append(args.case)
        else:
            where.append("sm.\"nCaseid\" = %s::uuid")
            params.append(args.case)
    if args.section:
        where.append("bd.\"nSectionid\" = %s::uuid")
        params.append(args.section)
    if args.since:
        where.append("bd.\"dCreateDt\" >= %s")
        params.append(args.since)
    sql = """
        select bd."nBundledetailid", bd."cPath", bd."cFilesize", bd."cPage", bd."nSectionid",
               sm."nCaseid", cm."cCasename"
        from "BundleDetail" bd
        left join "SectionMaster" sm on sm."nSectionid" = bd."nSectionid"
        left join "CaseMaster" cm on cm."nCaseid" = sm."nCaseid"
        where """ + " and ".join(where) + """
        order by bd."cPath"
    """
    if args.limit:
        sql += f" limit {int(args.limit)}"
    if args.offset:
        sql += f" offset {int(args.offset)}"
    cur = conn.cursor()
    cur.execute(sql, params)
    cols = ["nBundledetailid", "cPath", "cFilesize", "cPage", "nSectionid", "nCaseid", "cCasename"]
    rows = [dict(zip(cols, (str(v) if v is not None else "" for v in r))) for r in cur.fetchall()]
    conn.close()
    return rows


def items_from_dir(root: str) -> list:
    rows = []
    for dp, _, fns in os.walk(root):
        for fn in fns:
            if fn.lower().endswith(".pdf"):
                p = os.path.join(dp, fn)
                rows.append(dict(nBundledetailid="", cPath=p, cFilesize=str(os.path.getsize(p)), cPage="",
                                 nSectionid="", nCaseid="", cCasename=""))
    rows.sort(key=lambda r: r["cPath"])
    return rows


def items_from_csv(path: str) -> list:
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        for r in csv.reader(f):
            if not r or r[0].lower() in ("cpath", "key", "path"):
                continue
            rows.append(dict(nBundledetailid="", cPath=r[0].strip(), cFilesize="", cPage="",
                             nSectionid="", nCaseid="", cCasename=""))
    return rows


# ----------------------------------------------------------------------------- main

FIELDS = ["nBundledetailid", "cPath", "cCasename", "nCaseid", "nSectionid", "cPage", "cFilesize",
          "verdict", "pages", "checked", "text_pages", "junk_pages", "scan_pages", "vector_pages",
          "blank_pages", "scan_page_nums", "bytes", "src", "secs", "note"]

VERDICTS = ("ok_text", "scanned", "mixed", "junk", "vector", "blank", "skipped_big", "error")

NEED = ("scanned", "mixed", "junk")


def human(n: float) -> str:
    for u in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024:
            return f"{n:.1f} {u}"
        n /= 1024
    return f"{n:.1f} PB"


def case_of(path: str) -> str:
    parts = path.replace("\\", "/").split("/")
    for p in parts:
        if p.lower().startswith("case"):
            return p
    return parts[-2] if len(parts) > 1 else ""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--env", default=".env.development", help="env file for DB + DO Spaces creds")
    ap.add_argument("--source", choices=["db", "dir", "csv"], default="db")
    ap.add_argument("--dir", help="local folder (--source dir)")
    ap.add_argument("--csv-in", help="csv/txt of keys or paths (--source csv)")
    ap.add_argument("--case", help="case dir name (case1131) or nCaseid uuid")
    ap.add_argument("--section", help="nSectionid uuid")
    ap.add_argument("--since", help="only rows with dCreateDt >= YYYY-MM-DD")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--offset", type=int, default=0)
    ap.add_argument("--workers", type=int, default=max(2, min(8, (os.cpu_count() or 4))))
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                  "out", "ocr_audit_results.csv"))
    ap.add_argument("--resume", action="store_true", help="skip cPath already present in --out")
    ap.add_argument("--plan", action="store_true", help="only count rows and bytes, no download")
    ap.add_argument("--max-pages", type=int, default=0, help="sample at most N pages per PDF (0 = all)")
    ap.add_argument("--min-chars", type=int, default=20, help="chars needed to call a page 'text'")
    ap.add_argument("--stamp-chars", type=int, default=150,
                    help="page with full-page image and fewer chars than this = scan (Bates stamp only)")
    ap.add_argument("--max-mb", type=int, default=0, help="skip files larger than N MB (0 = none)")
    ap.add_argument("--local-root", default=None,
                    help="prefer local copy at <root>/<cPath> when present (default: ASSETS from env)")
    ap.add_argument("--no-s3", action="store_true", help="never touch S3 (local only)")
    ap.add_argument("--progress", type=int, default=50, help="print progress every N files")
    args = ap.parse_args()
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # case names may be non-latin
    except Exception:
        pass

    env = load_env(args.env) if (args.source == "db" or not args.no_s3) else {}

    # ---- collect items
    if args.source == "db":
        items = items_from_db(env, args)
    elif args.source == "dir":
        if not args.dir:
            sys.exit("--dir required")
        items = items_from_dir(args.dir)
        args.no_s3 = True
        args.local_root = ""
    else:
        if not args.csv_in:
            sys.exit("--csv-in required")
        items = items_from_csv(args.csv_in)
        if args.limit:
            items = items[args.offset:args.offset + args.limit]

    total_bytes_est = sum(int(i["cFilesize"]) for i in items if str(i.get("cFilesize") or "").isdigit())
    print(f"rows: {len(items):,}   est. download: {human(total_bytes_est)}   source={args.source}", flush=True)

    if args.plan:
        by_case = Counter(case_of(i["cPath"]) for i in items)
        print("\ntop 15 case dirs by file count:")
        for c, n in by_case.most_common(15):
            print(f"  {c:<45} {n:>8,}")
        return

    # ---- resume
    if args.resume and os.path.isfile(args.out):
        done = set()
        with open(args.out, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                if r.get("verdict") not in ("error", "skipped_big"):
                    done.add(r["cPath"])
        before = len(items)
        items = [i for i in items if i["cPath"] not in done]
        print(f"resume: {before - len(items):,} already done, {len(items):,} remaining")
    if not items:
        print("nothing to do")
        return

    use_s3 = not args.no_s3
    if use_s3:
        for k in ("DO_SPACES_ENDPOINT", "DO_SPACES_BUCKET_NAME", "DO_SPACES_KEY", "DO_SPACES_SECRET"):
            if not env.get(k):
                sys.exit(f"missing {k} in {args.env}")
    local_root = args.local_root if args.local_root is not None else (env.get("ASSETS") or "")
    cfg = dict(
        use_s3=use_s3,
        endpoint=env.get("DO_SPACES_ENDPOINT"), bucket=env.get("DO_SPACES_BUCKET_NAME"),
        key=env.get("DO_SPACES_KEY"), secret=env.get("DO_SPACES_SECRET"),
        local_root=local_root or None,
        max_pages=args.max_pages, min_chars=args.min_chars, stamp_chars=args.stamp_chars, max_mb=args.max_mb,
    )

    # ---- run
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or ".", exist_ok=True)
    append = args.resume and os.path.isfile(args.out)
    fh = open(args.out, "a" if append else "w", newline="", encoding="utf-8")
    wr = csv.DictWriter(fh, fieldnames=FIELDS, extrasaction="ignore")
    if not append:
        wr.writeheader()

    counts = Counter()
    by_case = defaultdict(Counter)
    got_bytes = 0
    t0 = time.time()
    n_done = 0
    print(f"workers={args.workers}  s3={use_s3}  local_root={local_root or '-'}  out={args.out}", flush=True)
    try:
        with ProcessPoolExecutor(max_workers=args.workers, initializer=_init_worker, initargs=(cfg,)) as ex:
            futs = [ex.submit(_work, it) for it in items]
            for fut in as_completed(futs):
                r = fut.result()
                wr.writerow(r)
                n_done += 1
                counts[r["verdict"]] += 1
                by_case[r.get("cCasename") or case_of(r["cPath"])][r["verdict"]] += 1
                got_bytes += int(r.get("bytes") or 0)
                if n_done % args.progress == 0 or n_done == len(items):
                    fh.flush()
                    el = time.time() - t0
                    rate = n_done / el if el else 0
                    eta = (len(items) - n_done) / rate if rate else 0
                    need = sum(counts[k] for k in NEED)
                    print(f"[{n_done:>7,}/{len(items):,}] {rate:5.1f} f/s  eta {eta/60:6.1f} min  "
                          f"dl {human(got_bytes):>9}  need_ocr={need:,} ok={counts['ok_text']:,} "
                          f"err={counts['error']:,}", flush=True)
    except KeyboardInterrupt:
        print("\ninterrupted - partial results kept, rerun with --resume")
    finally:
        fh.close()

    # ---- summary
    el = time.time() - t0
    need = sum(counts[k] for k in NEED)
    print("\n===== SUMMARY =====")
    print(f"files checked : {n_done:,}   in {el/60:.1f} min   downloaded {human(got_bytes)}")
    for k in VERDICTS:
        if counts[k]:
            print(f"  {k:<12} {counts[k]:>8,}   {100*counts[k]/max(1,n_done):5.1f}%")
    print(f"NEED OCR       {need:>8,}   {100*need/max(1,n_done):5.1f}%   (scanned + mixed + junk)")
    if counts["vector"]:
        print(f"  ('vector' = CAD/drawing pages with no text; OCR optional, not counted above)")

    bc_path = os.path.splitext(args.out)[0] + ".by_case.csv"
    with open(bc_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["case", "files", *VERDICTS, "need_ocr", "need_pct"])
        for c, cnt in sorted(by_case.items(), key=lambda kv: -sum(kv[1][k] for k in NEED)):
            tot = sum(cnt.values())
            nd = sum(cnt[k] for k in NEED)
            w.writerow([c, tot, *(cnt[k] for k in VERDICTS), nd, f"{100*nd/max(1,tot):.1f}"])
    print(f"\nper-file  : {args.out}\nper-case  : {bc_path}")


if __name__ == "__main__":
    main()
