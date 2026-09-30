"""
pytest configuration + fixture helpers for the smart hyperlink scanner tests.

All fixtures are synthetic PDFs built in memory with PyMuPDF (fitz); nothing
here touches the network, S3 or a database.
"""

from __future__ import annotations

import os
import sys
from typing import Dict, List, Optional, Sequence, Tuple

import fitz

SMART_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SMART_DIR not in sys.path:
    sys.path.insert(0, SMART_DIR)

import textmatch  # noqa: E402

PAGE_W, PAGE_H = 595.0, 842.0
FONT_SIZE = 10.0


def new_doc() -> fitz.Document:
    return fitz.open()


def add_page(doc: fitz.Document, lines: Sequence[Tuple[float, float, str]], rotation: int = 0) -> fitz.Page:
    """Add a page and write ``(x, baseline_y, text)`` lines on it.

    Coordinates are *visual* (as displayed).  For a rotated page the text is
    written rotated so that it reads upright once the page rotation is applied
    -- exactly like a scanned page that carries a /Rotate entry.

    NOTE: the returned Page object is only valid until the next ``new_page``
    call on the same document (PyMuPDF invalidates page proxies); re-fetch with
    ``doc[i]`` after adding more pages.
    """
    page = doc.new_page(width=PAGE_W, height=PAGE_H)
    if rotation:
        page.set_rotation(rotation)
        dm = page.derotation_matrix
        for x, y, text in lines:
            page.insert_text(fitz.Point(x, y) * dm, text, fontsize=FONT_SIZE, rotate=rotation)
    else:
        # TextWriter embeds a real font, so non-Latin-1 characters (en/em dash,
        # NBSP) survive the round trip; insert_text with Base-14 fonts does not.
        tw = fitz.TextWriter(page.rect)
        font = fitz.Font("helv")
        for x, y, text in lines:
            tw.append((x, y), text, font=font, fontsize=FONT_SIZE)
        tw.write_text(page)
    return page


def scan(doc: fitz.Document) -> Tuple[List[textmatch.Match], textmatch.ScanStats]:
    stats = textmatch.ScanStats()
    matches = textmatch.scan_document(doc, stats)
    return matches, stats


def rows(doc: fitz.Document) -> List[Tuple[int, str, float, float, float, float]]:
    matches, _ = scan(doc)
    return textmatch.matches_to_rows(matches)


def rows_with_text(doc_rows, text: str):
    return [r for r in doc_rows if r[1] == text]


def texts(doc_rows) -> List[str]:
    return sorted({r[1] for r in doc_rows})


def approx_rect(a: Sequence[float], b: Sequence[float], tol: float = 0.6) -> bool:
    """Rect equality with tolerance (search_for boxes vs unions of char boxes)."""
    return all(abs(float(x) - float(y)) <= tol for x, y in zip(a, b))


def search_rect(page: fitz.Page, needle: str, index: int = 0) -> Tuple[float, float, float, float]:
    """Reference rectangle: ``page.search_for`` result (unrotated page space)."""
    hits = page.search_for(needle)
    assert hits, f"{needle!r} not found on page {page.number + 1}"
    r = hits[index]
    return (r.x0, r.y0, r.x1, r.y1)


def reference_rect(page: fitz.Page, needle: str, index: int = 0) -> Tuple[float, float, float, float]:
    """What the scanner must emit for ``needle``: the raw ``search_for`` box.

    The legacy bracket script additionally spun the box about its own centre on
    rotated pages; that is only reproduced when
    ``textmatch.APPLY_LEGACY_ROTATE_RECT`` is True (see the constant's comment).
    """
    r = fitz.Rect(search_rect(page, needle, index))
    if textmatch.APPLY_LEGACY_ROTATE_RECT and page.rotation != 0:
        center = ((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)
        r = textmatch.rotate_rect(r, page.rotation, center)
    return (round(r.x0, 2), round(r.y0, 2), round(r.x1, 2), round(r.y1, 2))
