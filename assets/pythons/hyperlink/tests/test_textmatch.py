"""
Synthetic-fixture tests for textmatch.py (SPEC section 5).

Every test builds a small PDF with fitz, runs ``textmatch.scan_document`` and
checks the emitted texts and rectangles against ``page.search_for`` (the
reference geometry) -- so the rectangles are verified, not just the texts.
"""

import csv
import os
import subprocess
import sys

import fitz
import pytest

from conftest import (
    SMART_DIR,
    add_page,
    approx_rect,
    new_doc,
    reference_rect,
    rows,
    rows_with_text,
    scan,
    search_rect,
    texts,
)

import textmatch

BODY_X = 100.0


# ---------------------------------------------------------------------------
# Simple groups
# ---------------------------------------------------------------------------


def test_single_line_group_square_brackets():
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 120, "as shown in [Exhibit RL-10] above.")])
    r = rows(doc)
    assert texts(r) == ["Exhibit RL-10"]
    (row,) = rows_with_text(r, "Exhibit RL-10")
    assert row[0] == 1
    assert approx_rect(row[2:], search_rect(page, "Exhibit RL-10"))


def test_curly_braces_group():
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 120, "see {Appendix R-05} please")])
    r = rows(doc)
    assert texts(r) == ["Appendix R-05"]
    assert approx_rect(rows_with_text(r, "Appendix R-05")[0][2:], search_rect(page, "Appendix R-05"))


def test_mismatched_brackets_are_accepted():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "see [Appendix R-05} and {Exhibit R-7] too")])
    assert texts(rows(doc)) == ["Appendix R-05", "Exhibit R-7"]


def test_suffix_is_preserved_verbatim():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "at [Exhibit R-117-12:3] and [Exhibit R-118-4:2/5:1]")])
    assert texts(rows(doc)) == ["Exhibit R-117-12:3", "Exhibit R-118-4:2/5:1"]


def test_unclosed_bracket_at_end_of_document_is_ignored():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "first [Exhibit R-1] ok"), (BODY_X, 700, "the end [Exhibit RL-")])
    r = rows(doc)  # must not raise
    assert texts(r) == ["Exhibit R-1"]


def test_unclosed_bracket_followed_by_late_closer_is_not_a_reference():
    doc = new_doc()
    lines = [(BODY_X, 120, "start [Exhibit RL- broken")]
    for i in range(8):
        lines.append((BODY_X, 140 + i * 20, "some filler body text on the page line number %d" % i))
    lines.append((BODY_X, 320, "and a stray closer ] here"))
    add_page(doc, lines)
    assert rows(doc) == []  # spans > MAX_GROUP_LINES lines -> dropped


# ---------------------------------------------------------------------------
# Line breaks
# ---------------------------------------------------------------------------


def test_plain_break_two_rects():
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 120, "list of exhibits is at [Appendix"), (BODY_X, 140, "R-01]. Next sentence.")])
    r = rows(doc)
    got = rows_with_text(r, "Appendix R-01")
    assert len(got) == 2, r
    assert approx_rect(got[0][2:], search_rect(page, "Appendix"))
    assert approx_rect(got[1][2:], search_rect(page, "R-01"))
    _, stats = scan(doc)
    assert stats.multiline == 1 and stats.groups == 1 and stats.rows == 2


def test_hyphen_break_keeps_hyphen_and_joins_without_space():
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 120, "relied on [Exhibit CL-"), (BODY_X, 140, "012]). Indeed")])
    r = rows(doc)
    got = rows_with_text(r, "Exhibit CL-012")
    assert len(got) == 2, r
    assert approx_rect(got[0][2:], search_rect(page, "Exhibit CL-"))
    assert approx_rect(got[1][2:], search_rect(page, "012"))


def test_hyphen_break_after_prefix_word():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "identified in [Appendix R-"), (BODY_X, 140, "05] evidencing")])
    assert [x[1] for x in rows(doc)] == ["Appendix R-05", "Appendix R-05"]


# ---------------------------------------------------------------------------
# Page breaks, headers, footers, paragraph numbers
# ---------------------------------------------------------------------------


def _two_page_break_doc(extra_p1=(), extra_p2=()):
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "2.26 At paragraph 4.8 of the Reply"),
                   (BODY_X, 740, "Law No. 51 of 2023 (the 'New Law' [Exhibit RL-")] + list(extra_p1))
    add_page(doc, [(BODY_X, 80, "10]), which the Claimant argues applies"),
                   (BODY_X, 100, "bankruptcy proceedings having been commenced")] + list(extra_p2))
    return doc, doc[0], doc[1]


def test_page_break_group_emits_one_rect_per_page():
    doc, p1, p2 = _two_page_break_doc()
    r = rows(doc)
    got = rows_with_text(r, "Exhibit RL-10")
    assert [(g[0]) for g in got] == [1, 2], r
    assert approx_rect(got[0][2:], search_rect(p1, "Exhibit RL-"))
    assert approx_rect(got[1][2:], search_rect(p2, "10"))
    _, stats = scan(doc)
    assert stats.crosspage == 1


def test_header_footer_text_does_not_join_across_pages():
    # footer/header carry brackets that would close/open the group if not excluded
    footer = [(BODY_X, 820, "Confidential [Draft] 111-1")]
    header = [(BODY_X, 30, "[Header] Case 123")]
    doc, p1, p2 = _two_page_break_doc(extra_p1=footer, extra_p2=header + [(BODY_X, 820, "Confidential [Draft] 111-2")])
    r = rows(doc)
    assert texts(r) == ["Exhibit RL-10"], r
    assert [g[0] for g in rows_with_text(r, "Exhibit RL-10")] == [1, 2]


def test_repeated_running_line_outside_band_is_excluded():
    # a line that repeats on >= 3 pages at the same y (but outside the 6% band)
    doc = new_doc()
    run = (BODY_X, 65, "DRAFT ] RUNNING HEAD")
    add_page(doc, [run, (BODY_X, 740, "(the 'New Law' [Exhibit RL-")])
    add_page(doc, [run, (BODY_X, 80, "10]), which the Claimant"), (BODY_X, 740, "again [Exhibit RL-")])
    add_page(doc, [run, (BODY_X, 80, "11]) and so on")])
    r = rows(doc)
    assert texts(r) == ["Exhibit RL-10", "Exhibit RL-11"], r


def test_paragraph_number_in_margin_is_ignored_in_join():
    # page 2 starts with a paragraph number in the left margin on the same line
    doc, p1, p2 = _two_page_break_doc(extra_p2=[(60, 80, "2.27")])
    r = rows(doc)
    assert texts(r) == ["Exhibit RL-10"], r


# ---------------------------------------------------------------------------
# Normalisation
# ---------------------------------------------------------------------------


def test_dash_variants_and_nbsp_are_normalised():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "see [Exhibit RL–10] and [Exhibit RL—11]")])
    assert texts(rows(doc)) == ["Exhibit RL-10", "Exhibit RL-11"]


def test_em_dash_inside_group_and_segments():
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 120, "[RWS-1, paras. 10.16 — 10.18]")])
    r = rows(doc)
    assert texts(r) == ["RWS-1", "paras. 10.16 - 10.18"]
    assert approx_rect(rows_with_text(r, "RWS-1")[0][2:], search_rect(page, "RWS-1"))
    assert approx_rect(rows_with_text(r, "paras. 10.16 - 10.18")[0][2:], search_rect(page, "paras. 10.16 — 10.18"))


def test_emitted_text_is_single_spaced_and_trimmed():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "[  Exhibit   RL-10  ]")])
    assert texts(rows(doc)) == ["Exhibit RL-10"]


# ---------------------------------------------------------------------------
# Multi-reference groups
# ---------------------------------------------------------------------------


def test_range_group_gets_singular_prefix_and_own_rects():
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 120, "at [Exhibits R-A03.25 to R-A03.36]. The")])
    r = rows(doc)
    assert texts(r) == ["Exhibit R-A03.25", "Exhibit R-A03.36"]
    assert approx_rect(rows_with_text(r, "Exhibit R-A03.25")[0][2:], search_rect(page, "Exhibits R-A03.25"))
    assert approx_rect(rows_with_text(r, "Exhibit R-A03.36")[0][2:], search_rect(page, "R-A03.36"))


def test_five_segment_group_with_hyphen_break():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "payment at [Exhibits R-A03.25 to R-A03.27, R-A03.28 to R-A03.36 and R-"),
                   (BODY_X, 140, "A03.44]. The Claimant's")])
    r = rows(doc)
    assert texts(r) == ["Exhibit R-A03.25", "Exhibit R-A03.27", "Exhibit R-A03.28", "Exhibit R-A03.36", "Exhibit R-A03.44"]
    assert len(rows_with_text(r, "Exhibit R-A03.44")) == 2


def test_appendices_and_comma_segments():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "[Appendices R-04 and R-05]; [Appendix R-02, Exhibit R-A02.47]; [RWS-1, para. 8.30]")])
    assert texts(rows(doc)) == ["Appendix R-02", "Appendix R-04", "Appendix R-05", "Exhibit R-A02.47", "RWS-1", "para. 8.30"]


# ---------------------------------------------------------------------------
# Tables
# ---------------------------------------------------------------------------


def _table_page(doc, draw_lines: bool):
    page = doc.new_page(width=595, height=842)
    xs = [100, 140, 260, 320, 540]
    ys = [100, 140, 180]
    if draw_lines:
        for x in xs:
            page.draw_line((x, ys[0]), (x, ys[-1]), color=(0, 0, 0), width=0.5)
        for y in ys:
            page.draw_line((xs[0], y), (xs[-1], y), color=(0, 0, 0), width=0.5)
    cells = [
        (105, 118, "1."), (145, 118, "[Exhibit RL-"), (145, 134, "01]"), (265, 118, "2018"), (325, 118, "Federal Arbitration Law No. 6 of 2018"),
        (105, 158, "2."), (145, 158, "[Exhibit RL-"), (145, 174, "02] more"), (265, 158, "-"), (325, 158, "Chartered Institute of Arbitrators"),
    ]
    for x, y, t in cells:
        page.insert_text((x, y), t, fontsize=10)
    page.insert_text((100, 300), "Body text with [Appendix R-05] here.", fontsize=10)
    return page


@pytest.mark.parametrize("draw_lines", [True, False], ids=["find_tables", "gap-rule-fallback"])
def test_table_cells_do_not_pick_up_neighbour_cells(draw_lines):
    doc = new_doc()
    page = _table_page(doc, draw_lines)
    if draw_lines:
        assert len(page.find_tables().tables) == 1  # the fixture really is a detectable table
    r = rows(doc)
    assert texts(r) == ["Appendix R-05", "Exhibit RL-01", "Exhibit RL-02"], r
    for n in ("01", "02"):
        got = rows_with_text(r, f"Exhibit RL-{n}")
        assert len(got) == 2
        # first rect = "Exhibit RL-" on the first cell line; second = the "NN" continuation only
        assert approx_rect(got[0][2:], search_rect(page, "Exhibit RL-", 0 if n == "01" else 1))
        ref = search_rect(page, n + "]")
        x0, y0, x1, y1 = got[1][2:]
        assert abs(x0 - ref[0]) < 0.6 and abs(y0 - ref[1]) < 0.6 and x1 < ref[2]  # excludes the ']' and the neighbour cell
    _, stats = scan(doc)
    assert stats.table == 2


# ---------------------------------------------------------------------------
# Rotation
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("rotation", [90, 180, 270])
def test_rotated_pages_match_reference_geometry(rotation):
    # emitted rects on rotated pages are the raw search_for boxes (the
    # production deep-scan behaviour); drawing them with page.draw_rect must
    # cover the text -- checked separately in test_rotated_rect_covers_text
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 120, "as shown in [Exhibit RL-10] above."),
                          (BODY_X, 300, "list is at [Appendix"), (BODY_X, 320, "R-01]. Next")], rotation=rotation)
    assert page.rotation == rotation
    r = rows(doc)
    assert texts(r) == ["Appendix R-01", "Exhibit RL-10"], r
    got = rows_with_text(r, "Exhibit RL-10")
    assert len(got) == 1
    assert approx_rect(got[0][2:], reference_rect(page, "Exhibit RL-10"))
    got = rows_with_text(r, "Appendix R-01")
    assert len(got) == 2
    assert approx_rect(got[0][2:], reference_rect(page, "Appendix"))
    assert approx_rect(got[1][2:], reference_rect(page, "R-01"))


@pytest.mark.parametrize("rotation", [0, 90, 180, 270])
def test_rotated_rect_covers_text(rotation):
    # independent of search_for: the emitted rect, used as a clip for text
    # extraction on the same page, must return exactly the reference text
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 300, "list is at [Appendix"), (BODY_X, 320, "R-01]. Next")], rotation=rotation)
    got = rows_with_text(rows(doc), "Appendix R-01")
    assert len(got) == 2
    clipped = [page.get_text("text", clip=fitz.Rect(g[2:])).strip() for g in got]
    assert clipped == ["Appendix", "R-01"], clipped


@pytest.mark.parametrize("rotation", [90, 180, 270])
def test_rotated_page_bands_use_visual_orientation(rotation):
    # header/footer bands are measured on the page as displayed: a footer at
    # the visual bottom (y = 580 of a 595 pt high landscape page) must be
    # excluded even though its unrotated coordinates are nowhere near a band
    vis_h = 595 if rotation in (90, 270) else 842
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "body [Exhibit R-1] text"), (BODY_X, vis_h - 15, "footer ] [Draft"),
                   (BODY_X, 20, "[Header] text")], rotation=rotation)
    r = rows(doc)
    assert texts(r) == ["Exhibit R-1"], r


# ---------------------------------------------------------------------------
# De-duplication and helpers
# ---------------------------------------------------------------------------


def test_no_duplicate_rows():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "[Exhibit R-1] and [Exhibit R-1] again"), (BODY_X, 140, "[Exhibit R-1]")])
    r = rows(doc)
    assert len(r) == 3 and len(set(r)) == 3


def test_segment_group_helper():
    segs = textmatch.segment_group("Exhibits R-A03.25 to R-A03.27, R-A03.28 to R-A03.36 and R-A03.44")
    assert [s[2] for s in segs] == ["Exhibit R-A03.25", "Exhibit R-A03.27", "Exhibit R-A03.28", "Exhibit R-A03.36", "Exhibit R-A03.44"]
    assert [s[2] for s in textmatch.segment_group("RWS-1, para. 8.30")] == ["RWS-1", "para. 8.30"]
    assert [s[2] for s in textmatch.segment_group("Appendix R-03, Section 2.4.1")] == ["Appendix R-03", "Section 2.4.1"]


def test_normalise_text():
    assert textmatch.normalise_text("Exhibit RL–\n 10 ") == "Exhibit RL- 10"


# ---------------------------------------------------------------------------
# The drop-in script (local / dry-run mode)
# ---------------------------------------------------------------------------


def test_script_local_dry_run(tmp_path):
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "see [Exhibit RL-10] and [Appendix"), (BODY_X, 140, "R-01] here")])
    pdf = tmp_path / "fixture.pdf"
    doc.save(str(pdf))
    out_csv = tmp_path / "out.csv"
    env = dict(os.environ, SMART_DRYRUN="1", PYTHONIOENCODING="UTF-8")
    env.pop("DB_HOST", None)
    proc = subprocess.run(
        [sys.executable, os.path.join(SMART_DIR, "smarthyperlink.py"), str(pdf), "bd-123", str(out_csv), "bd-123"],
        capture_output=True, text=True, env=env, timeout=120,
    )
    assert proc.returncode == 0, proc.stdout + proc.stderr
    assert "SMART: pages=1 groups=2 rows=3 multiline=1 crosspage=0 table=0" in proc.stdout
    assert pdf.exists()  # local input is never deleted
    with open(out_csv, newline="", encoding="utf-8") as f:
        recs = list(csv.reader(f))
    assert len(recs) == 3
    assert all(len(rec) == 7 and rec[6] == "bd-123" for rec in recs)
    assert sorted(rec[1] for rec in recs) == ["Appendix R-01", "Appendix R-01", "Exhibit RL-10"]
    assert all(float(rec[3]) < float(rec[5]) and float(rec[2]) < float(rec[4]) for rec in recs)


def test_bare_number_segments_inherit_id_prefix():
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 120, "see [Exhibits R-117, 118 and 119] here")])
    r = rows(doc)
    assert texts(r) == ["Exhibit R-117", "Exhibit R-118", "Exhibit R-119"]
    assert approx_rect(rows_with_text(r, "Exhibit R-118")[0][2:], search_rect(page, "118"))


def test_wide_gap_inside_single_line_group_is_rescued():
    # a justified line with an unusually wide gap inside the reference: the gap
    # rule splits the line, the soft-line fallback still closes the group on
    # the same line
    doc = new_doc()
    page = add_page(doc, [(BODY_X, 120, "as pleaded in [Appendix"), (BODY_X + 140, 120, "R-03], Section 2.4"),
                          (BODY_X, 140, "next line of ordinary body text")])
    r = rows(doc)
    assert texts(r) == ["Appendix R-03"], r
    got = rows_with_text(r, "Appendix R-03")
    assert len(got) == 1  # one line -> one rect spanning both fragments
    assert approx_rect((got[0][2], got[0][3]), search_rect(page, "Appendix")[0:2])
    assert abs(got[0][4] - search_rect(page, "R-03")[2]) < 0.6


def test_empty_and_image_only_pages_do_not_crash():
    doc = new_doc()
    add_page(doc, [(BODY_X, 740, "ends with [Exhibit RL-")])
    doc.new_page(width=595, height=842)  # empty page in between
    add_page(doc, [(BODY_X, 80, "10]) continues"), (BODY_X, 120, "and [Exhibit R-2] here")])
    r = rows(doc)
    # the group does not straddle adjacent pages -> only the closed one is emitted
    assert texts(r) == ["Exhibit R-2"], r


# ---------------------------------------------------------------------------
# Fix round 1: margins, layouts, rotation, page joins, groups
# ---------------------------------------------------------------------------

MARGIN_1IN = 72.0


def test_ordinary_words_at_one_inch_margin_are_not_paragraph_numbers():
    # words such as "para", "and" and a bare "2" at the left margin must stay
    # in the text stream (only real paragraph numbers are dropped)
    doc = new_doc()
    page = add_page(doc, [
        (MARGIN_1IN, 120, "The witness refers to the report and its annex, see [Exhibit R-1,"),
        (MARGIN_1IN, 136, "para 12] and continues with the description of the events."),
        (MARGIN_1IN, 152, "The Respondent relies on the three reports at [Exhibits R-2, R-3"),
        (MARGIN_1IN, 168, "and R-4] which were served together with the Reply."),
        (MARGIN_1IN, 184, "The Respondent relies on the three authorities at [Exhibits CL-1, CL-"),
        (MARGIN_1IN, 200, "2 and CL-3] which were served together with the Reply."),
    ])
    r = rows(doc)
    assert texts(r) == ["Exhibit CL-1", "Exhibit CL-2", "Exhibit CL-3", "Exhibit R-1", "Exhibit R-2",
                        "Exhibit R-3", "Exhibit R-4", "para 12"], r
    assert approx_rect(rows_with_text(r, "Exhibit R-4")[0][2:], search_rect(page, "R-4"))
    got = rows_with_text(r, "Exhibit CL-2")
    assert len(got) == 2
    assert abs(got[1][2] - MARGIN_1IN) < 0.6  # the '2' at the margin is the second rect
    assert abs(got[1][4] - got[1][2] - fitz.get_text_length("2", fontsize=10)) < 0.8


def test_real_paragraph_number_in_margin_is_dropped():
    doc = new_doc()
    add_page(doc, [(40, 120, "3.2"), (MARGIN_1IN, 120, "Genuine paragraph number, then [Exhibit R-6] here."),
                   (40, 136, "(a)"), (MARGIN_1IN, 136, "a list item citing [Exhibit"), (MARGIN_1IN, 152, "R-7] at the break")])
    r = rows(doc)
    assert texts(r) == ["Exhibit R-6", "Exhibit R-7"], r
    # the paragraph numbers are not part of any emitted rect
    assert all(row[2] >= MARGIN_1IN - 0.6 for row in r)


def test_bare_numbers_after_a_non_reference_segment_do_not_inherit():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "[Exhibit R-56, paras 5 and 7] and [Exhibit R-57, paras. 4.9 to 4.12] end"),
                   (BODY_X, 140, "[Exhibits C-14 to 16] and [RWS-1, para. 8.30 and 8.31] end")])
    got = texts(rows(doc))
    assert "Exhibit R-7" not in got and "Exhibit R-4.12" not in got and "8.31" not in got
    assert {"Exhibit R-56", "paras 5", "Exhibit R-57", "paras. 4.9", "Exhibit C-14", "Exhibit C-16", "RWS-1", "para. 8.30"} <= set(got)


def test_two_column_page_keeps_columns_apart():
    left = ["The Respondent submitted the [Exhibit", "R-401] and the later [Exhibit R-", "402] filed on 3 May 2024 [Appendix",
            "R-05] and so on in the left column.", "A plain one [Exhibit R-403] here."]
    right = ["Unrelated text [see note 4] here", "and [Exhibit R-999] in the right", "column [Appendix R-99] here and",
             "[Exhibit CL-88] plain text in the", "right column [Exhibit R-998] end."]
    for gutter in (60, 18):
        doc = new_doc()
        lines = []
        for i, (l, rr) in enumerate(zip(left, right)):
            lines.append((50, 120 + i * 14, l))
            lines.append((240 + gutter, 120 + i * 14, rr))
        page = add_page(doc, lines)
        r = rows(doc)
        assert texts(r) == ["Appendix R-05", "Appendix R-99", "Exhibit CL-88", "Exhibit R-401", "Exhibit R-402",
                            "Exhibit R-403", "Exhibit R-998", "Exhibit R-999", "note 4"], (gutter, r)  # leading "see " stripped
        got = rows_with_text(r, "Exhibit R-402")
        assert len(got) == 2
        assert abs(got[1][2] - 50) < 0.6 and abs(got[1][3] - search_rect(page, "402]")[1]) < 0.6


def test_unruled_table_wrapped_cells_in_first_and_last_column():
    doc = new_doc()
    page = doc.new_page(width=595, height=842)
    rows_ = [("1.", ["[Exhibit RL-", "01]"], ["Federal Arbitration Law of 2018", "(extract)"]),
             ("3.", ["[Exhibit R-", "100]"], ["[Exhibit CL-", "02]"]),
             ("5.", ["[Exhibit", "RL-05]"], ["plain text", ""])]
    y = 120
    for num, c2, c3 in rows_:
        page.insert_text((64, y), num, fontsize=10)
        for k, t in enumerate(c2):
            if t:
                page.insert_text((104, y + 13 * k), t, fontsize=10)
        for k, t in enumerate(c3):
            if t:
                page.insert_text((264, y + 13 * k), t, fontsize=10)
        y += 46
    r = rows(doc)
    assert texts(r) == ["Exhibit CL-02", "Exhibit R-100", "Exhibit RL-01", "Exhibit RL-05"], r
    for t, n in (("Exhibit CL-02", "02]"), ("Exhibit R-100", "100]"), ("Exhibit RL-01", "01]"), ("Exhibit RL-05", "RL-05]")):
        got = rows_with_text(r, t)
        assert len(got) == 2, (t, got)
        ref = search_rect(page, n)
        assert abs(got[1][2] - ref[0]) < 0.6 and abs(got[1][3] - ref[1]) < 0.6


def test_stretched_justified_line_is_not_a_table():
    # inter-word gaps of 12 pt (about 4x the normal space) on a justified line
    # must not split the line into columns: the neighbouring lines carry text there
    doc = new_doc()
    page = doc.new_page(width=595, height=842)
    for i in range(3):
        page.insert_text((72, 100 + i * 16), "Normal body text line with the usual spacing to define the page median gap here.", fontsize=11)
    x = 72.0
    for w in ["The", "Tribunal", "noted", "[Exhibit", "R-"]:
        page.insert_text((x, 148), w, fontsize=11)
        x += fitz.get_text_length(w, fontsize=11) + 12
    page.insert_text((72, 164), "301] and the parties agreed with that assessment of the evidence.", fontsize=11)
    page.insert_text((72, 180), "Closing body text line with the usual spacing that ends the paragraph here.", fontsize=11)
    r = rows(doc)
    assert texts(r) == ["Exhibit R-301"], r
    assert len(rows_with_text(r, "Exhibit R-301")) == 2


@pytest.mark.parametrize("rotation", [90, 180, 270])
def test_sideways_content_on_rotated_page(rotation):
    # text written upright in unrotated space on a page that carries /Rotate:
    # it displays sideways, the layout must still follow the text direction
    doc = new_doc()
    page = doc.new_page(width=595, height=842)
    page.insert_text((72, 30), "RUNNING HEADER TEXT", fontsize=9)
    page.insert_text((72, 100), "The Claimant relies on the witness statement served in May [Exhibit", fontsize=11)
    page.insert_text((72, 116), "R-601] which was served late and which the Respondent disputes.", fontsize=11)
    page.insert_text((72, 132), "The Tribunal referred to the arbitration law at [Exhibit CL-", fontsize=11)
    page.insert_text((72, 148), "012] in the award, and the Claimant accepted this [Exhibit R-602].", fontsize=11)
    page.insert_text((72, 810), "[Exhibit R-FOOTER] footer text inside the bottom band", fontsize=9)
    page.set_rotation(rotation)
    r = rows(doc)
    assert texts(r) == ["Exhibit CL-012", "Exhibit R-601", "Exhibit R-602"], r
    got = rows_with_text(r, "Exhibit R-601")
    assert len(got) == 2
    assert approx_rect(got[0][2:], reference_rect(page, "Exhibit", 0))
    assert approx_rect(got[1][2:], reference_rect(page, "R-601"))
    got = rows_with_text(r, "Exhibit CL-012")
    assert approx_rect(got[0][2:], reference_rect(page, "Exhibit CL-"))
    assert approx_rect(got[1][2:], reference_rect(page, "012"))


def _filler(page, y0, y1, text="Filler body text line so that the page looks like a real memorial paragraph."):
    y = y0
    while y < y1:
        page.insert_text((72, y), text, fontsize=11)
        y += 16
    return y


def test_page_join_skips_footnotes():
    doc = new_doc()
    p1 = doc.new_page(width=595, height=842)
    _filler(p1, 100, 590)
    p1.insert_text((72, 600), "The Claimant relies on the second expert report at [Exhibit R-", fontsize=11)
    p1.draw_line((72, 690), (250, 690), width=0.5)
    p1.insert_text((72, 705), "1   Witness Statement of Mr Smith, para 4.", fontsize=9)
    p1.insert_text((72, 718), "2   See also the Reply, para 3.2 and Exhibit R-1.", fontsize=9)
    p2 = doc.new_page(width=595, height=842)
    p2.insert_text((72, 100), "106] which was filed on 3 May 2024, and further evidence.", fontsize=11)
    p2.insert_text((72, 116), "More body text follows here on page 2.", fontsize=11)
    r = rows(doc)
    assert texts(r) == ["Exhibit R-106"], r
    got = rows_with_text(r, "Exhibit R-106")
    assert [g[0] for g in got] == [1, 2]
    assert approx_rect(got[0][2:], search_rect(doc[0], "Exhibit R-"))
    assert approx_rect(got[1][2:], search_rect(doc[1], "106"))


def test_running_header_with_page_number_outside_band_is_ignored():
    # header at y=58 (7 % of A4, outside the 6 % band) repeated on 3 pages,
    # each with its own page number; the group split over pages 2/3 must join
    doc = new_doc()
    for pno in (1, 2, 3):
        p = doc.new_page(width=595, height=842)
        p.insert_text((72, 58), "REPLY MEMORIAL - CONFIDENTIAL", fontsize=9)
        p.insert_text((500, 58), f"Page {pno}", fontsize=9)
        if pno == 3:
            p.insert_text((72, 100), "105] confirms that. Filler continues here.", fontsize=11)
            _filler(p, 116, 740)
        else:
            _filler(p, 100, 740)
        if pno == 2:
            p.insert_text((72, 740), "and the Tribunal will note the second witness statement at [Exhibit R-", fontsize=11)
        p.insert_text((72, 802), f"111-{pno}", fontsize=9)
    r = rows(doc)
    assert texts(r) == ["Exhibit R-105"], r
    assert [g[0] for g in rows_with_text(r, "Exhibit R-105")] == [2, 3]


def test_letter_page_last_body_line_inside_footer_band_is_kept():
    # Letter page, 0.75 in bottom margin: the last body line (baseline 738)
    # lies inside the 9 % footer band but continues the body -> kept
    doc = new_doc()
    p1 = doc.new_page(width=612, height=792)
    _filler(p1, 100, 738)
    p1.insert_text((72, 738), "and the Tribunal will note the third witness statement at [Exhibit", fontsize=11)
    p1.insert_text((72, 770), "111-1", fontsize=9)
    p2 = doc.new_page(width=612, height=792)
    p2.insert_text((72, 100), "R-107] was served on 3 May 2024 with the Reply. See [Exhibit R-108].", fontsize=11)
    p2.insert_text((72, 770), "111-2", fontsize=9)
    r = rows(doc)
    assert texts(r) == ["Exhibit R-107", "Exhibit R-108"], r
    assert [g[0] for g in rows_with_text(r, "Exhibit R-107")] == [1, 2]


def test_long_exhibit_list_in_one_group():
    ids = ["C-%d" % i for i in range(1, 37)]
    text = "[Exhibits " + ", ".join(ids[:-1]) + " and " + ids[-1] + "]"
    chunks = []
    cur = "The Claimant relies on the following documents "
    for part in text.split(" "):
        if len(cur) + len(part) > 90:
            chunks.append(cur.rstrip())
            cur = ""
        cur += part + " "
    chunks.append(cur.rstrip())
    doc = new_doc()
    add_page(doc, [(MARGIN_1IN, 120 + 16 * i, c) for i, c in enumerate(chunks)])
    r = rows(doc)
    assert sorted(texts(r), key=lambda t: int(t.split("-")[1])) == ["Exhibit " + i for i in ids], r


def test_group_statistics_count_each_bracket_group_once():
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "see [Exhibits"), (BODY_X, 140, "R-A03.25 to R-A03.36] and [RWS-1,"), (BODY_X, 160, "para. 7.2] end")])
    _, stats = scan(doc)
    assert (stats.groups, stats.multiline, stats.rows) == (2, 2, 5)


def test_find_tables_notice_is_not_printed(capsys):
    doc = new_doc()
    _table_page(doc, True)
    rows(doc)
    assert "pymupdf_layout" not in capsys.readouterr().out


def test_script_local_mode_requires_explicit_opt_in_with_full_argv(tmp_path):
    doc = new_doc()
    add_page(doc, [(BODY_X, 120, "see [Exhibit RL-10] here")])
    pdf = tmp_path / "fixture.pdf"
    doc.save(str(pdf))
    out_csv = tmp_path / "out.csv"
    base_env = dict(os.environ, SMART_DRYRUN="1", PYTHONIOENCODING="UTF-8")
    base_env.pop("DB_HOST", None)
    base_env.pop("SMART_LOCAL", None)
    full_argv = [sys.executable, os.path.join(SMART_DIR, "smarthyperlink.py"), str(pdf), "bd-1", str(out_csv), "bd-1",
                 "bucket", "key", "secret", "http://127.0.0.1:9", str(tmp_path / "download.pdf")]
    proc = subprocess.run(full_argv, capture_output=True, text=True, env=dict(base_env, AWS_MAX_ATTEMPTS="1"), timeout=120)
    assert proc.returncode == 2  # v2 contract: the S3 download (fake bucket) fails -> exit 2
    assert "SMART: local mode" not in proc.stdout  # full production argv: the S3 path is taken
    assert not out_csv.exists()
    proc = subprocess.run(full_argv, capture_output=True, text=True, env=dict(base_env, SMART_LOCAL="1"), timeout=120)
    assert proc.returncode == 0 and "SMART: local mode" in proc.stdout
    assert out_csv.exists() and pdf.exists()
