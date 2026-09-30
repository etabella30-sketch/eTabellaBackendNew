"""
Exit-code contract of smarthyperlink.py (v2 orchestration, DESIGN_V2.md §3):

    0 success, 1 usage / prerequisite, 2 download failure, 3 scan failure,
    4 DB insert failure.

Every case runs the real script as a subprocess in local mode against an
unreachable database (DB_HOST=127.0.0.1 DB_PORT=1); SMART_DRYRUN is unset
unless the case says so. The S3 endpoint is http://127.0.0.1:1, so nothing
outside this machine is contacted (AWS_MAX_ATTEMPTS=1 keeps botocore from
retrying the refused connection for 20 s).
"""

import os
import subprocess
import sys

import pytest

from conftest import SMART_DIR, add_page, new_doc

SCRIPT = os.path.join(SMART_DIR, "smarthyperlink.py")
BODY_X = 72.0


def _env(**over):
    env = {k: v for k, v in os.environ.items() if k not in ("SMART_DRYRUN", "SMART_LOCAL")}
    env.update({
        "PYTHONIOENCODING": "UTF-8",
        "DB_HOST": "127.0.0.1", "DB_PORT": "1", "DB_DATABASE": "orchtest", "DB_USERNAME": "x", "DB_PASSWORD": "x",
        "AWS_MAX_ATTEMPTS": "1", "AWS_RETRY_MODE": "standard",
    })
    env.update(over)
    return env


def _run(argv, cwd, **envover):
    proc = subprocess.run([sys.executable, SCRIPT] + argv, capture_output=True, text=True, env=_env(**envover), timeout=180, cwd=str(cwd))
    assert "Traceback" not in proc.stderr, proc.stderr
    return proc


def _full_argv(pdf, tag, tmp_path):
    return [str(pdf), tag, str(tmp_path / f"out_{tag}.csv"), tag, "orchtest-bucket", "x", "x", "http://127.0.0.1:1", str(tmp_path / f"dl_{tag}.pdf")]


@pytest.fixture
def small_pdf(tmp_path):
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "Refer to [Exhibit A-1] and {Tab 3} and [ABC-0007].")])
    pdf = tmp_path / "small.pdf"
    doc.save(str(pdf))
    doc.close()
    return pdf


def test_exit_0_success_dry_run(tmp_path, small_pdf):
    proc = _run(_full_argv(small_pdf, "ok", tmp_path), tmp_path, SMART_LOCAL="1", SMART_DRYRUN="1")
    assert proc.returncode == 0, proc.stdout
    assert "SMART: dry-run" in proc.stdout and not any(l.startswith("Error") for l in proc.stdout.splitlines())
    assert (tmp_path / "out_ok.csv").exists()


def test_exit_2_download_failure_s3_unreachable(tmp_path):
    proc = _run(_full_argv("does/not/exist.pdf", "dl", tmp_path), tmp_path)
    assert proc.returncode == 2, proc.stdout
    assert any(l.startswith("Error") for l in proc.stdout.splitlines())


def test_exit_2_download_failure_local_file_missing(tmp_path):
    # 3 args (local mode allowed) but the file does not exist: the script
    # falls back to the S3 download with no bucket -> download failure
    proc = _run([str(tmp_path / "nope.pdf"), "dl2", str(tmp_path / "o.csv")], tmp_path)
    assert proc.returncode == 2, proc.stdout
    assert any(l.startswith("Error") for l in proc.stdout.splitlines())


def test_exit_3_scan_failure_not_a_pdf(tmp_path):
    bad = tmp_path / "bad.pdf"
    bad.write_text("this is not a pdf", encoding="utf-8")
    proc = _run(_full_argv(bad, "scan", tmp_path), tmp_path, SMART_LOCAL="1", SMART_DRYRUN="1")
    assert proc.returncode == 3, proc.stdout
    assert any(l.startswith("Error") for l in proc.stdout.splitlines())


def test_exit_4_db_insert_failure(tmp_path, small_pdf):
    proc = _run(_full_argv(small_pdf, "db", tmp_path), tmp_path, SMART_LOCAL="1")
    assert proc.returncode == 4, proc.stdout
    assert "Error inserting data into PostgreSQL" in proc.stdout
    assert (tmp_path / "out_db.csv").exists()          # the scan itself succeeded


def test_exit_1_usage(tmp_path):
    proc = _run([], tmp_path)
    assert proc.returncode == 1
    assert "usage:" in proc.stdout
