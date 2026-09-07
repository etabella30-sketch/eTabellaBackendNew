"""
Fix-round-2 regression tests: rect guard, footnotes (Word default sizes),
OCR'd running headers, ruled tables on rotated pages, group segmentation,
templated index rows, references in the footer band, OCR'd '|' opener,
find_tables pre-filter and the runtime contract of the script.
"""

import os
import subprocess
import sys

import fitz
import pytest

from conftest import SMART_DIR, add_page, approx_rect, new_doc, reference_rect, rows, rows_with_text, scan, search_rect, texts
from test_textmatch import BODY_X, _filler, _table_page

import textmatch


def _tiro_page(doc, lines, size=11, x=72, y=100, pitch=None):
    """Base-14 Times (the non-embedded Times New Roman substitute): its line
    boxes are 1.33 em tall, which used to trip the rect-size guard."""
    page = doc.new_page(width=595, height=842)
    tw = fitz.TextWriter(page.rect)
    font = fitz.Font("tiro")
    pitch = pitch or size * 1.25
    for i, t in enumerate(lines):
        tw.append((x, y + i * pitch), t, font=font, fontsize=size)
    tw.write_text(page)
    return page


# --- rect guard ---------------------------------------------------------------


def test_rect_guard_keeps_narrow_glyph_references():
    # narrow glyphs (quotes, 1, parentheses) made the old guard compare the
    # line height with 3x the median glyph WIDTH and drop legitimate rects
    doc = new_doc()
    page = doc.new_page(width=595, height=842)
    page.insert_text((72, 100), 'see [Exhibit "R-1"] here', fontsize=11)
    page.insert_text((72, 120), 'see [Exhibit "R-1", Tab 3] and', fontsize=11)
    page.insert_text((72, 140), "see [Exhibit C-1(a)] and [exhibit c-1] and [see Exhibit C-2]", fontsize=11)
    r = rows(doc)
    assert texts(r) == ['Exhibit "R-1"', "Exhibit C-1(a)", "Exhibit C-2", "Exhibit c-1", "Tab 3"], r
    assert len(rows_with_text(r, 'Exhibit "R-1"')) == 2


def test_rect_guard_with_tall_line_boxes_two_line_group():
    doc = new_doc()
    page = _tiro_page(doc, ["see the [Exhibits", "R-A03.25 to R-A03.36] here", "and [RWS-1, para. 8.30] and [Letter, Exhibit R-1]"])
    r = rows(doc)
    assert len(rows_with_text(r, "Exhibit R-A03.25")) == 2, r  # first-line 'Exhibits' fragment + id
    assert approx_rect(rows_with_text(r, "Exhibit R-A03.25")[0][2:], search_rect(page, "Exhibits"))
    assert {"para. 8.30", "Letter", "Exhibit R-1", "RWS-1"} <= set(texts(r))


def test_rect_guard_still_rejects_multi_line_unions():
    # two chars on the same line id but 5 font sizes apart vertically
    a = textmatch.Char(1, "a", (10, 10, 15, 20), (10, 10, 15, 20), 0, 10.0, line=0)
    b = textmatch.Char(1, "b", (10, 60, 15, 70), (10, 60, 15, 70), 0, 10.0, line=0)
    assert textmatch.rects_for_chars([a, b], {}) == []
    c = textmatch.Char(1, "c", (20, 10, 60, 20), (20, 10, 60, 20), 0, 10.0, line=0)
    assert len(textmatch.rects_for_chars([a, c], {})) == 1


# --- footnotes ------------------------------------------------------------------


def _fn_doc(body_size, fn_size):
    doc = new_doc()
    p1 = doc.new_page(width=595, height=842)
    _filler(p1, 100, 600)
    p1.insert_text((72, 616), "The Respondent relies principally on the New Bankruptcy Law 2023 [Exhibit RL-", fontsize=body_size)
    p1.draw_line((72, 626), (200, 626), width=0.5)
    p1.insert_text((72, 640), "1   See the Final Award, para. 12; Statement of Defence, para. 33 [Exhibit C-9].", fontsize=fn_size)
    p1.insert_text((72, 652), "2   Ibid., para. 15; see also the Procedural Order No. 3.", fontsize=fn_size)
    p2 = doc.new_page(width=595, height=842)
    p2.insert_text((72, 100), "10]), which the Claimant says was not in force at the relevant time.", fontsize=body_size)
    _filler(p2, 116, 400)
    return doc


@pytest.mark.parametrize("fn_size", [10, 9])
def test_page_join_skips_word_default_footnotes(fn_size):
    # Word's default: 10 pt footnotes under an 11 pt body (ratio 0.91) -- the
    # footnotes are structurally the trailing smaller-font block
    doc = _fn_doc(11, fn_size)
    r = rows(doc)
    assert texts(r) == ["Exhibit C-9", "Exhibit RL-10"], r
    got = rows_with_text(r, "Exhibit RL-10")
    assert [g[0] for g in got] == [1, 2]
    assert approx_rect(got[0][2:], search_rect(doc[0], "Exhibit RL-"))
    assert approx_rect(got[1][2:], search_rect(doc[1], "10"))


def test_footnote_reference_is_found_but_never_closes_a_body_group():
    # the open body group must not close inside a footnote that carries ']'
    doc = new_doc()
    p = doc.new_page(width=595, height=842)
    p.insert_text((72, 300), "The Respondent relies on the law [Exhibit RL-", fontsize=11)
    p.insert_text((72, 330), "1   See the award, para 12 [sic] and the reply.", fontsize=10)
    r = rows(doc)
    assert texts(r) == ["sic"], r


def test_footnote_references_inside_bottom_band_are_kept():
    # A4, 9 pt footnotes bottom-aligned at a 2 cm margin: the last footnote
    # lines lie inside the 9 % band but chain to the footnote block above
    doc = new_doc()
    p = doc.new_page(width=595, height=842)
    p.insert_text((295, 812), "1", fontsize=9)
    _filler(p, 100, 300)
    p.insert_text((72, 316), "the Tribunal noted [Exhibit C-13].", fontsize=11)
    fn = ["1   Exhibit C-14, p. 3; see [Exhibit C-14] and the covering letter.",
          "2   Ibid.; see also [Exhibit C-15], p. 7, and the reply of 4 May 2019.",
          "3   Witness Statement of Mr. Y, para. 12 [Exhibit C-16]."]
    y0 = 842 - 56.7 - 11 * 2
    p.draw_line((72, y0 - 12), (200, y0 - 12), width=0.5)
    for i, t in enumerate(fn):
        p.insert_text((72, y0 + 11 * i), t, fontsize=9)
    r = rows(doc)
    assert texts(r) == ["Exhibit C-13", "Exhibit C-14", "Exhibit C-15", "Exhibit C-16"], r


def test_isolated_small_footer_line_in_band_is_still_dropped():
    doc = new_doc()
    p = doc.new_page(width=595, height=842)
    _filler(p, 100, 300)
    p.insert_text((72, 316), "body [Exhibit R-1] text", fontsize=11)
    p.insert_text((72, 830), "[Exhibit R-FOOTER] confidential footer text inside the bottom band of the page", fontsize=8)
    assert texts(rows(doc)) == ["Exhibit R-1"]


# --- running headers --------------------------------------------------------------


def test_ocr_running_header_at_body_size_with_jitter_is_ignored():
    # 4 pages, 53-char running header at BODY size whose y wanders 1.3 pt per
    # page (OCR skew) with 'Page N of 4' on the same line: still a running
    # line, and the page join must go through
    doc = new_doc()
    header = "CLAIMANT'S REPLY MEMORIAL AND DEFENCE TO COUNTERCLAIM"
    for n in range(1, 5):
        p = doc.new_page(width=595, height=842)
        y = 36 + 1.3 * (n - 1)
        p.insert_text((72, y), header, fontsize=11)
        p.insert_text((470, y), "Page %d of 4" % n, fontsize=11)
        p.insert_text((72, 50 + 1.3 * (n - 1)), "Case No. ARB/24/12", fontsize=11)
        p.insert_text((295, 812), str(n), fontsize=9)
        if n == 1:
            _filler(p, 95, 720)
            p.insert_text((72, 736), "The Respondent relies on the New Bankruptcy Law 2023 [Exhibit RL-", fontsize=11)
        elif n == 2:
            p.insert_text((72, 95), "10]), which the Claimant says was not in force. The", fontsize=11)
            _filler(p, 111, 720)
            p.insert_text((72, 736), "The valuation is addressed in the expert report [Appendix", fontsize=11)
        elif n == 3:
            p.insert_text((72, 95), "R-05] to the Statement of Defence, at paragraphs 4.1 to 4.9.", fontsize=11)
            _filler(p, 111, 400)
        else:
            _filler(p, 95, 300)
    r = rows(doc)
    assert texts(r) == ["Appendix R-05", "Exhibit RL-10"], r
    assert [g[0] for g in rows_with_text(r, "Exhibit RL-10")] == [1, 2]
    assert [g[0] for g in rows_with_text(r, "Appendix R-05")] == [2, 3]


def test_running_line_repeat_rule_tolerates_y_jitter():
    doc = new_doc()
    for n in range(3):
        add_page(doc, [(BODY_X, 65 + 1.5 * n, "DRAFT ] RUNNING HEAD"), (BODY_X, 740, "see [Exhibit RL-%d] and" % n)])
    assert texts(rows(doc)) == ["Exhibit RL-0", "Exhibit RL-1", "Exhibit RL-2"]


def test_templated_index_rows_in_header_zone_are_not_running_lines():
    # 4 pages, ruled index starting at the top margin whose first row reads
    # '1. [Exhibit R- Invoice No. 1###' on every page (digit-insensitive
    # repeat at the same y): still content, never a running header
    doc = new_doc()
    for n in range(4):
        p = doc.new_page(width=595, height=842)
        xs = [60, 100, 230, 540]
        ys = [70]
        y = 70
        for rr in range(3):
            k = n * 3 + rr + 1
            p.insert_text((64, y + 14), "%d." % (rr + 1), fontsize=9)
            p.insert_text((104, y + 14), "[Exhibit R-", fontsize=9)
            p.insert_text((104, y + 25), "%d]" % k, fontsize=9)
            p.insert_text((234, y + 14), "Invoice No. %d" % (1000 + k), fontsize=9)
            p.insert_text((234, y + 25), "dated %d May 2019" % k, fontsize=9)
            y += 32
            ys.append(y)
        for x in xs:
            p.draw_line((x, ys[0]), (x, ys[-1]), width=0.8)
        for yy in ys:
            p.draw_line((xs[0], yy), (xs[-1], yy), width=0.8)
    r = rows(doc)
    assert sorted(texts(r), key=lambda t: int(t.split("-")[1])) == ["Exhibit R-%d" % k for k in range(1, 13)], r
    assert len(r) == 24


def test_templated_unruled_rows_with_short_descriptions_survive():
    # same without ruling lines and with a very short varying description:
    # a bracketed line is only a running line when ALL its parts repeat exactly
    doc = new_doc()
    for n in range(4):
        p = doc.new_page(width=595, height=842)
        for rr in range(3):
            k = n * 3 + rr + 1
            y = 70 + rr * 32
            p.insert_text((104, y + 14), "[Exhibit R-", fontsize=9)
            p.insert_text((104, y + 25), "%d]" % k, fontsize=9)
            p.insert_text((234, y + 14), "No. %d" % k, fontsize=9)
    r = rows(doc)
    assert len(texts(r)) == 12, texts(r)


# --- rotated ruled table ------------------------------------------------------------


def _ruled_index(page, place=None, rot=0):
    """3-column ruled index with wrapped reference cells; ``place`` maps
    display coordinates to unrotated ones for a /Rotate page."""
    place = place or (lambda x, y: fitz.Point(x, y))
    xs = [60, 100, 230, 540]
    rows_ = [("1.", ["[Exhibit RL-", "01]"], ["Federal Arbitration Law [as amended]", "No. 6 of 2018"]),
             ("2.", ["[Exhibit", "RL-02]"], ["Civil Procedure [Law", "No. 11] of 1992"]),
             ("3.", ["[Exhibit R-", "A03.14.3]"], ["Letter from the Bank dated", "12 March 2019 [Exhibit C-", "31]"]),
             ("4.", ["[Exhibits RL-", "03 and RL-04]"], ["Court of Cassation judgments", "(2019) [see Exhibit RL-05]"])]
    ys = [100, 120]
    y = 120
    for c1, c2, c3 in rows_:
        n = max(len(c2), len(c3))
        for ci, col in enumerate(([c1], c2, c3)):
            for li, t in enumerate(col):
                pt = place(xs[ci] + 4, y + 4 + 10 + li * 12)
                page.insert_text(pt, t, fontsize=10, rotate=rot)
        y += n * 12 + 8
        ys.append(y)
    for x in xs:
        page.draw_line(place(x, ys[0]), place(x, ys[-1]), width=0.8)
    for yy in ys:
        page.draw_line(place(xs[0], yy), place(xs[-1], yy), width=0.8)


@pytest.mark.parametrize("rotation", [0, 90, 180, 270])
def test_ruled_table_on_rotated_page_uses_display_space_cells(rotation):
    # find_tables reports cells in displayed space, rawdict chars are unrotated:
    # the two must be mapped into one frame or the cells scramble
    doc = new_doc()
    media = (842, 595) if rotation in (90, 270) else (595, 842)
    page = doc.new_page(width=media[0], height=media[1])
    page.set_rotation(rotation)
    dm = page.derotation_matrix
    _ruled_index(page, place=lambda x, y: fitz.Point(x, y) * dm, rot=rotation)
    assert len(page.find_tables().tables) == 1
    r = rows(doc)
    want = ["Exhibit C-31", "Exhibit R-A03.14.3", "Exhibit RL-01", "Exhibit RL-02", "Exhibit RL-03", "Exhibit RL-04",
            "Exhibit RL-05", "Law No. 11", "as amended"]
    assert texts(r) == want, r
    for t, n in (("Exhibit RL-01", 2), ("Exhibit C-31", 2), ("Exhibit R-A03.14.3", 2), ("Exhibit RL-04", 1)):
        assert len(rows_with_text(r, t)) == n, (t, r)
    got = rows_with_text(r, "Exhibit C-31")
    assert approx_rect(got[1][2:], reference_rect(page, "31"))
    _, stats = scan(doc)
    assert stats.cells >= 6 and stats.columns == 0


# --- segmentation ---------------------------------------------------------------------


def test_segmentation_oxford_comma_witness_ids_ranges_and_lead_words():
    doc = new_doc()
    add_page(doc, [(BODY_X, 100, "[Exhibits C-1, C-2, and C-3] [Exhibit R-56 and RWS-1, para. 5]"),
                   (BODY_X, 120, "[Exhibit C-12 and CWS-3] [Exhibits C-4 - C-5] [Exhibit C-6.] [Exhibit C-7; see also Exhibit C-8]"),
                   (BODY_X, 140, "[Exhibit C-9 and/or C-10] [Exhibits C-11 and C-12, and Exhibits R-3 and R-4] [see Exhibit CER-2]")])
    got = texts(rows(doc))
    for bad in ("and C-3", "Exhibit RWS-1", "Exhibit CWS-3", "Exhibit C-6.", "see also Exhibit C-8", "and Exhibits R-3",
                "R-4", "see Exhibit CER-2"):
        assert bad not in got, (bad, got)
    for good in ("Exhibit C-3", "RWS-1", "CWS-3", "Exhibit C-4", "Exhibit C-5", "Exhibit C-6", "Exhibit C-8",
                 "Exhibit C-9", "Exhibit C-10", "Exhibit R-3", "Exhibit R-4", "Exhibit CER-2"):
        assert good in got, (good, got)
    # an explicit prefix is kept as written; an unprefixed witness/expert id never inherits one
    assert [s[2] for s in textmatch.segment_group("Exhibit R-1 and CER-2, RER-1")] == ["Exhibit R-1", "CER-2", "RER-1"]
    assert [s[2] for s in textmatch.segment_group("RWS-1, paras. 10.16 - 10.18")] == ["RWS-1", "paras. 10.16 - 10.18"]
    assert [s[2] for s in textmatch.segment_group("Exhibits R-117, 118 and 119")] == ["Exhibit R-117", "Exhibit R-118", "Exhibit R-119"]


def test_trailing_period_rect_excludes_the_period():
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 100, "as in [Exhibit C-6.] there")])
    r = rows(doc)
    assert texts(r) == ["Exhibit C-6"]
    assert approx_rect(rows_with_text(r, "Exhibit C-6")[0][2:], search_rect(page, "Exhibit C-6"))


# --- OCR'd '|' opener ------------------------------------------------------------------


def test_ocr_pipe_opener_is_recovered_in_tables():
    # OCR read the '[' of a table cell as a vertical bar: '| Exhibit RL-10]'
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 120, "10.   | Exhibit RL-10] 2023 New Bankruptcy Law"),
                          (BODY_X, 140, "and a real one [Exhibit RL-11] | not a reference] here")])
    r = rows(doc)
    assert texts(r) == ["Exhibit RL-10", "Exhibit RL-11"], r
    assert approx_rect(rows_with_text(r, "Exhibit RL-10")[0][2:], search_rect(page, "Exhibit RL-10"))
    _, stats = scan(doc)
    assert stats.recovered == 1 and stats.groups == 2


def test_ocr_pipe_recovery_can_be_switched_off(monkeypatch):
    monkeypatch.setattr(textmatch, "RECOVER_OCR_PIPE_OPENER", False)
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "10.   | Exhibit RL-10] 2023 New Bankruptcy Law")])
    assert rows(doc) == []


# --- performance pre-filter ---------------------------------------------------------------


def test_find_tables_is_skipped_for_pages_without_a_grid(monkeypatch):
    doc = new_doc()
    page = doc.new_page(width=595, height=842)
    page.insert_text((72, 100), "text with a header rule and [Exhibit R-1]", fontsize=11)
    page.draw_line((72, 44), (523, 44), width=0.5)
    page.draw_line((72, 110), (200, 110), width=0.5)  # an underline
    assert not textmatch._may_contain_table(page)
    calls = []
    orig = fitz.Page.find_tables
    monkeypatch.setattr(fitz.Page, "find_tables", lambda self, *a, **k: calls.append(1) or orig(self, *a, **k))
    assert texts(rows(doc)) == ["Exhibit R-1"]
    assert calls == []
    doc2 = new_doc()
    _table_page(doc2, True)
    assert textmatch._may_contain_table(doc2[0])
    assert texts(rows(doc2)) == ["Appendix R-05", "Exhibit RL-01", "Exhibit RL-02"]
    assert calls == [1]


# --- runtime contract -----------------------------------------------------------------------


def test_char_and_fragment_do_not_need_dataclass_slots():
    # Python 3.8/3.9 compatibility: plain __slots__ classes
    c = textmatch.Char(1, "a", (0, 0, 5, 10), (0, 0, 5, 10), 0, 10.0)
    assert not hasattr(c, "__dict__") and c.line == -1 and c.cell is None
    f = textmatch.Fragment([c], 1, 0)
    assert not hasattr(f, "__dict__") and f.text == "a" and (f.vx0, f.vx1) == (0, 5)


def test_prerequisite_check_reports_old_python(monkeypatch):
    import smarthyperlink

    monkeypatch.setattr(sys, "version_info", (3, 7, 9, "final", 0))
    monkeypatch.setattr(sys, "version", "3.7.9 (default)")
    msg = smarthyperlink._prerequisites()
    assert msg is not None and msg.startswith("Error: Python 3.8+ required")
    monkeypatch.setattr(sys, "version_info", (3, 13, 0, "final", 0))
    assert smarthyperlink._prerequisites() is None
    assert smarthyperlink._version_tuple("1.23.8") == (1, 23, 8) and smarthyperlink._version_tuple("1.24.0rc1") == (1, 24, 0)


def test_summary_line_breaks_down_table_kinds():
    st = textmatch.ScanStats(pages=1, groups=2, rows=3, table=2, cells=1, columns=1)
    assert st.summary() == "SMART: pages=1 groups=2 rows=3 multiline=0 crosspage=0 table=2 (cells=1 columns=1 recovered=0)"


def test_script_reports_missing_db_host_with_full_argv(tmp_path):
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "see [Exhibit RL-10] here")])
    pdf = tmp_path / "fixture.pdf"
    doc.save(str(pdf))
    out_csv = tmp_path / "out.csv"
    env = dict(os.environ, SMART_LOCAL="1", PYTHONIOENCODING="UTF-8")
    for k in ("DB_HOST", "SMART_DRYRUN"):
        env.pop(k, None)
    argv = [sys.executable, os.path.join(SMART_DIR, "smarthyperlink.py"), str(pdf), "bd-1", str(out_csv), "bd-1",
            "bucket", "key", "secret", "http://127.0.0.1:9", str(tmp_path / "download.pdf")]
    proc = subprocess.run(argv, capture_output=True, text=True, env=env, timeout=120)
    assert proc.returncode == 0, proc.stdout + proc.stderr
    assert "Error: DB_HOST not set" in proc.stdout and out_csv.exists()
    assert "Traceback" not in proc.stderr


def test_script_reports_missing_textmatch_cleanly(tmp_path):
    # only smarthyperlink.py deployed: a clean 'Error:' line, exit code 0
    import shutil

    shutil.copy(os.path.join(SMART_DIR, "smarthyperlink.py"), str(tmp_path / "smarthyperlink.py"))
    env = dict(os.environ, PYTHONIOENCODING="UTF-8")
    env.pop("PYTHONPATH", None)
    proc = subprocess.run([sys.executable, str(tmp_path / "smarthyperlink.py"), "x.pdf", "bd", str(tmp_path / "o.csv")],
                          capture_output=True, text=True, env=env, timeout=120, cwd=str(tmp_path))
    assert proc.returncode == 0
    assert "Error: cannot import textmatch.py" in proc.stdout and "Traceback" not in proc.stderr
    assert not (tmp_path / "__pycache__").exists()


def test_table_detection_skipped_on_pages_without_brackets(monkeypatch):
    # A drawing-heavy page with no bracket text (CAD sheet, scanned drawing)
    # must not pay for get_drawings/find_tables; a page with a bracket still does.
    calls = []
    real = textmatch._detect_tables

    def spy(page):
        calls.append(page.number)
        return real(page)

    monkeypatch.setattr(textmatch, "_detect_tables", spy)
    doc = new_doc()
    p0 = doc.new_page(width=595, height=842)
    for i in range(30):
        p0.draw_line((60, 100 + i * 20), (540, 100 + i * 20), width=0.5)
        p0.draw_line((60 + i * 16, 100), (60 + i * 16, 700), width=0.5)
    p0.insert_text((72, 60), "DRAWING-12-6", fontsize=9)
    p1 = doc.new_page(width=595, height=842)
    p1.insert_text((72, 100), "see [Exhibit R-1] here", fontsize=11)
    r = rows(doc)
    assert texts(r) == ["Exhibit R-1"], r
    assert calls == [1], calls
