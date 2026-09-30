"""
textmatch.py -- geometry-aware bracket-reference matcher for PyMuPDF documents.

Finds bracket groups such as ``[Exhibit RL-01]``, ``{Appendix R-05}`` or
``[Exhibits R-A03.25 to R-A03.36]`` in a PDF and returns one rectangle per
(page, line) that the reference text occupies -- even when the reference is
broken over two lines, hyphenated at the break, split over a page boundary or
laid out inside a table cell / a column of an unruled table / a two-column page.

The pipeline (see SPEC section 3):

1. ``extract_page`` -- pull every character (with its bbox) out of
   ``page.get_text("rawdict")``, order the characters geometrically (line by
   line, top to bottom, left to right *in the frame in which the text is
   upright*) and drop header/footer lines and paragraph-number tokens that sit
   in the left margin.
2. ``build_streams`` -- turn the characters into *text streams*: the main body
   stream (lines joined with a space, or with nothing when the previous line
   ends in a hyphen; a hard separator where a line was split into columns),
   one stream per detected table cell and "column chains" built with the
   horizontal-gap rule for fragments that open a group on a split line.
3. ``scan_streams`` -- run the group regex over every stream, map matches back
   to characters, split multi-reference groups into segments and union the
   character boxes per (page, line) into rectangles.
4. ``scan_document`` -- drive the above over a whole document (two passes: a
   cheap first pass collects line signatures for the running-header rule, the
   second pass scans one page at a time so memory stays bounded per page) and
   stitch the last body lines of page N to the first body lines of page N+1
   so that a group straddling a page break is found as well.

Notes on the layout rules (all thresholds are module constants below):

* Running headers/footers are lines whose digit-insensitive text repeats on
  REPEAT_LINE_MIN_PAGES pages at about the same y (REPEAT_Y_TOLERANCE, or
  anywhere inside the header/footer zone).  A line with a bracket must repeat
  with its digits too, so templated table rows survive; lines inside detected
  table cells are never running lines.
* Footnotes are the trailing block of lines whose font size is smaller than
  the page's body size by more than FOOTNOTE_SIZE_DELTA (Word: 10 pt under an
  11 pt body).  They are scanned (footnote citations are common) but kept
  behind a hard break in the body stream and excluded from the page join.
  Small-font lines inside the footer band are kept when they chain to the
  text above at the normal pitch.
* Table cells reported by ``page.find_tables`` are in *displayed* page space;
  the rawdict chars are unrotated, so the char centres are mapped with
  ``page.rotation_matrix`` before the cell lookup.  ``find_tables`` only runs
  on pages whose drawings contain ruling lines in both directions.
* Emitted rectangles are the raw text-extraction boxes (the space
  ``page.search_for`` returns, which the viewer draws correctly on rotated
  pages); the legacy ``rotate_rect`` is kept behind APPLY_LEGACY_ROTATE_RECT.
* An OCR'd ``[`` read as ``|`` in front of a strict reference
  (``| Exhibit RL-10]``) is recovered when RECOVER_OCR_PIPE_OPENER is set.

The module is deliberately free of I/O, S3 and database code; it only depends
on PyMuPDF (1.23+ for ``find_tables``; 1.19+ otherwise) and Python 3.8+.
``smarthyperlink.py`` wraps it with the production contract.
"""

from __future__ import annotations

import bisect
import contextlib
import io
import math
import re
import statistics
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, NamedTuple, Optional, Sequence, Set, Tuple

import fitz  # PyMuPDF

# ---------------------------------------------------------------------------
# Tunables (module constants so they can be adjusted without touching code)
# ---------------------------------------------------------------------------

# -- header / footer -----------------------------------------------------------
#: Header band (fraction of the page height, measured in the frame in which the
#: text is upright).  Lines inside the band are dropped UNLESS they look like
#: body text (at least BODY_LINE_MIN_CHARS characters and not a repeated
#: running line) -- a Letter page with 0.75in margins puts its last body line
#: inside a 9 % band, so the band alone must not decide.
HEADER_BAND_FRACTION = 0.06
#: Footer band, see HEADER_BAND_FRACTION.
FOOTER_BAND_FRACTION = 0.09
#: Wider zone in which running headers/footers are still recognised by content
#: (repeated on several pages, or a short page-number line); body text in the
#: zone is kept.
HEADER_ZONE_FRACTION = 0.12
FOOTER_ZONE_FRACTION = 0.14
#: A line inside the header/footer band with at least this many non-space
#: characters is body text (long running headers are caught by the repeat rule).
BODY_LINE_MIN_CHARS = 45
#: A shorter line inside the band is still body text when it continues the
#: body at the normal line pitch: the gap to the neighbouring kept line (the
#: line above for the footer band, below for the header band) is at most this
#: multiple of its own height.  A footer sits at least a blank line away.
BODY_CHAIN_DY = 1.0
#: A line whose digit-normalised text repeats on at least this many pages at
#: the same position is a running header/footer.
REPEAT_LINE_MIN_PAGES = 3
#: Position tolerance (points) for "the same position" -- OCR'd running lines
#: wander by a point or two per page.  Inside the header/footer zones the
#: position is not compared at all.
REPEAT_Y_TOLERANCE = 4.0
#: A line shorter than this (characters incl. spaces) is 'short': outside the
#: header/footer zones the repeat rule only removes short lines without
#: brackets (templated body text must survive).
REPEAT_LINE_MAX_CHARS = 60
#: Short lines in the zone that look like a page number are dropped.
PAGE_NUMBER_RE = re.compile(
    r"^\s*(?:page\s+)?-?\s*\d{1,4}\s*-?\s*(?:of\s+\d{1,4})?\s*$"  # "5", "- 5 -", "Page 5", "5 of 97"
    r"|\bpage\s+\d{1,4}\b"  # "... Page 5"
    r"|^\s*\d{1,4}\s*-\s*\d{1,4}\s*$",  # "111-12" document id
    re.IGNORECASE,
)

# -- paragraph numbers ----------------------------------------------------------
#: Only a token that ends left of this fraction of the page width can be a
#: paragraph number / list marker.
BODY_LEFT_FRACTION = 0.20
#: Paragraph-number / list-marker forms: ``2.27``, ``12.``, ``(a)``, ``a.``,
#: ``(iv)``, ``iv.``, ``(3)``.  Ordinary short words ("and", "the", "Tab") and
#: bare numbers followed by a normal space are NOT paragraph numbers.
PARA_TOKEN_RE = re.compile(
    r"^(?:\d{1,3}(?:\.\d{1,3}){0,3}\.?"  # 2.27  12.  1.2.3
    r"|\(?[a-zA-Z][).]"  # (a)  a.  A)
    r"|\(?[ivxlIVXL]{1,6}[).]"  # (iv)  iv.
    r"|\(\d{1,3}\))$"  # (3)
)
#: The paragraph number must be the FIRST token of the line and be followed by
#: a gap of at least this multiple of the page's median space width ...
PARA_GAP_FACTOR = 2.5
#: ... and at least this many points.
PARA_GAP_MIN_PT = 6.0

# -- column / table gap rule ----------------------------------------------------
#: Horizontal gap larger than this multiple of the median inter-word gap on the
#: same line is a column-break candidate (table without ruling lines).
COLUMN_GAP_FACTOR = 3.0
#: Minimum number of inter-word gaps on a line before its own median is used;
#: shorter lines fall back to the page median.
MIN_GAPS_FOR_LINE_MEDIAN = 4
#: Absolute floor for the column-break gap (points) -- guards against lines
#: whose median gap is tiny (e.g. OCR text with zero-width spaces).
COLUMN_GAP_MIN_PT = 6.0
#: A candidate gap is only a column break when every neighbouring line (within
#: this multiple of the line height above/below) is free of text next to one
#: edge of the gap (a window as wide as the gap threshold, at the start of the
#: next column or at the end of the previous one) -- true columns are
#: vertically aligned, stretched justified lines are not.  Only one edge is
#: required because cell / column text is ragged on the other side.
COLUMN_CONFIRM_DY = 1.6
#: Inset (points) applied to the confirmation window.
COLUMN_CONFIRM_INSET = 1.0
#: How many following lines a column chain may continue over ...
MAX_COLUMN_CONTINUATION_LINES = 3
#: ... searching at most this many following lines for them (an empty cell
#: line in between is skipped).
MAX_COLUMN_SEARCH_LINES = 6
#: Vertical distance (in multiples of the fragment height) within which the
#: continuation line of a column chain must start.
MAX_COLUMN_CONTINUATION_DY = 3.0

# -- tables -----------------------------------------------------------------------
#: ``find_tables`` only runs on pages whose drawings contain at least this
#: many horizontal AND vertical line-like paths (a single rule is never a table).
TABLE_MIN_RULES = 2
#: Minimum length (points) of a line item to count as a ruling line ...
TABLE_RULE_MIN_LENGTH = 5.0
#: ... and the maximum deviation (points) from the horizontal / vertical.
TABLE_RULE_THICKNESS = 1.5

# -- page join / footnotes ----------------------------------------------------------
#: How many body lines at the page end / page start take part in the
#: cross-page join.
PAGE_JOIN_LINES = 2
#: Lines whose font size is below this fraction of the page's median font size
#: are 'small' (running headers, captions): a small line in the header/footer
#: band is dropped unless it is long or chained to the body/footnote block.
SMALL_TEXT_FRACTION = 0.85
#: Footnotes: the trailing block of lines at the page end whose font size is
#: smaller than the page's body size by more than this many points (Word's
#: default is 10 pt footnotes under an 11 pt body).  Footnote lines are
#: scanned (they carry references) but separated from the body by a hard
#: break and excluded from the cross-page join.
FOOTNOTE_SIZE_DELTA = 0.3

# -- groups -----------------------------------------------------------------------
#: Groups longer than this (inner characters) are not references and are dropped.
MAX_GROUP_CHARS = 600
#: Groups spanning more than this many lines are dropped.
MAX_GROUP_LINES = 8
#: A rect whose height (layout frame) exceeds this multiple of the median font
#: size of its own line merged several lines and is dropped (guard; never
#: expected since rects are built per (page, line)).
MAX_RECT_SIZE_FACTOR = 3.0

#: Tolerance (fraction of line height) for clustering raw lines into one
#: geometric line.
LINE_CLUSTER_TOLERANCE = 0.5
#: Raw lines at the same height whose x-ranges overlap by more than this
#: fraction of the narrower one are overprinted / stacked text, not
#: side-by-side neighbours: they become separate geometric lines.
LINE_OVERLAP_FRACTION = 0.3
#: Fallback median inter-word gap (points) for pages without any spaces.
DEFAULT_SPACE_WIDTH = 3.0

#: Rounding of emitted coordinates -- same as the reference implementation.
COORD_DECIMALS = 2

# Rotated pages (/Rotate 90/180/270). The legacy bracket script passed every
# rect through rotate_rect(), which spins the box about its OWN centre -- for
# 90/270 that only swaps width and height in place, so the box no longer sits
# on the text. The production deep-scan script (searchDeep.py), which produced
# the links users see today, emits raw text-extraction rects with no such
# transform, and the viewer draws those correctly. We follow the deep-scan
# behaviour. Set to True only to reproduce the legacy bracket-script geometry.
APPLY_LEGACY_ROTATE_RECT = False

# Characters used in the stream text that can never occur in the PDF text.
#: Hard separator: a group regex can never cross it (column break).
COLUMN_BREAK = "\x1f"

# Group regex: ``[`` or ``{`` ... ``]`` or ``}`` (mismatched pairs accepted),
# no nested opener, no column break, length-capped.
GROUP_RE = re.compile(r"[\[{]([^\[\]{}" + COLUMN_BREAK + r"]{0," + str(MAX_GROUP_CHARS) + r"})[\]}]")

#: OCR'd tables sometimes read the opening ``[`` as a vertical bar
#: (``| Exhibit RL-10]``).  When set, a closer-only group is accepted when the
#: text between the bar and the closer is a strict reference (prefix word +
#: id); the opener char of such a group is the bar.
RECOVER_OCR_PIPE_OPENER = True
OCR_PIPE_GROUP_RE = re.compile(
    r"\|\s*((?:Exhibits?|Appendi(?:x|ces)|Tabs?|Annex(?:es)?|Schedules?|Attachments?)"
    r"\s+[A-Za-z]{0,4}-?\d[A-Za-z0-9.:/-]{0,20})\s*[\]}]"
)

# Separators used to split a multi-reference group into segments.  Longest
# alternatives first so that an Oxford comma (", and C-3") or "; and" is one
# separator and "and" never leaks into the next segment.
SEGMENT_SEP_RE = re.compile(
    r",\s*(?:and|&)\s+|;\s*(?:and|&)\s+|\s+and/or\s+|, |; | and | to | & "
)
# Leading words stripped from a segment ("see also Exhibit C-2" -> "Exhibit C-2").
SEGMENT_LEAD_RE = re.compile(r"^(?:see\s+also|see|cf\.?|also|and|&)\s+", re.IGNORECASE)
# Trailing punctuation stripped from a segment ("Exhibit C-1." -> "Exhibit C-1").
SEGMENT_TRAIL_CHARS = ".,;:"
# A dash range between two lettered ids ("C-1 - C-3", "C-1 -- C-3") is split
# into two references; "10.16 - 10.18" (bare numbers) is left alone.
ID_RANGE_RE = re.compile(r"\s-+\s(?=[A-Za-z]{1,4}-\d)")
# Ids of witness statements / expert reports (RWS-1, CWS-3, CER-2, RER-1) are
# case terms of their own and never inherit the group's prefix word.
NO_PREFIX_ID_RE = re.compile(r"^[A-Za-z]{0,2}(?:WS|ER)-\d", re.IGNORECASE)

# Reference prefix words (lower-case) and their singular form.
PREFIX_SINGULAR = {
    "exhibit": "Exhibit",
    "exhibits": "Exhibit",
    "appendix": "Appendix",
    "appendices": "Appendix",
    "tab": "Tab",
    "tabs": "Tab",
    "annex": "Annex",
    "annexes": "Annex",
    "annexure": "Annexure",
    "annexures": "Annexure",
    "schedule": "Schedule",
    "schedules": "Schedule",
    "attachment": "Attachment",
    "attachments": "Attachment",
    "bundle": "Bundle",
    "bundles": "Bundle",
    "volume": "Volume",
    "volumes": "Volume",
    "document": "Document",
    "documents": "Document",
    "request": "Request",
    "requests": "Request",
}

# A segment that starts like a reference id (``R-A03.36``, ``CL-012``, ``012``)
# receives the group's prefix word when it has none of its own.
REF_ID_RE = re.compile(r"^[A-Za-z]{0,4}(?:-[A-Za-z]{0,3})?\d")
# Letter part of a reference id followed by a plain number (``R-`` in ``R-117``);
# a later bare-number segment (``118``) inherits it.
ID_PREFIX_RE = re.compile(r"^([A-Za-z]{1,4}-)\d+(?:[.:/-]\S*)?$")
BARE_NUMBER_RE = re.compile(r"^\d+(?:[.:/-]\S*)?$")

# Dash variants normalised to ASCII hyphen-minus.
_DASHES = "‐‑‒–—−­"  # hyphen, nb-hyphen, figure dash, en/em dash, minus, soft hyphen
_NORMALISE_MAP = {ord(c): "-" for c in _DASHES}
_NORMALISE_MAP[0x00A0] = " "  # NBSP
_NORMALISE_MAP[0x00C2] = None  # stray 'Â' (mojibake of NBSP)


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


# Char and Fragment are the hot objects (one Char per character of the
# document); they are plain __slots__ classes rather than
# ``@dataclass(slots=True)`` so that the module imports on Python 3.8/3.9 too.


class Char:
    """One character of the PDF with its geometry.

    ``bbox`` is the raw PyMuPDF bbox (unrotated page space, same space as
    ``page.search_for``).  ``vbox`` is the bbox transformed into the page's
    *layout frame* (the frame in which the text reads left to right, top to
    bottom) and is only used for ordering / layout decisions.  For the common
    case (horizontal text, no page rotation) it is the same tuple object.

    ``block`` (rawdict block number) is kept per SPEC section 3; it is only
    used as a tie-breaker when ordering raw lines that share a baseline.
    """

    __slots__ = ("page", "c", "bbox", "vbox", "block", "size", "line", "cell")

    def __init__(self, page: int, c: str, bbox: Tuple[float, float, float, float],
                 vbox: Tuple[float, float, float, float], block: int, size: float,
                 line: int = -1, cell: Optional[Tuple[int, int, int]] = None):
        self.page = page  # 1-based page number
        self.c = c  # normalised character ('' when dropped, ' ' for any whitespace)
        self.bbox = bbox
        self.vbox = vbox
        self.block = block  # rawdict block number
        self.size = size  # font size (points)
        self.line = line  # geometric line id (per page, top to bottom)
        self.cell = cell  # (table, row, col) when inside a table cell

    @property
    def is_space(self) -> bool:
        return self.c == "" or self.c.isspace()

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"Char(p{self.page} {self.c!r} line={self.line} bbox={tuple(round(v, 1) for v in self.bbox)})"


class Fragment:
    """A run of characters on one geometric line without a column break."""

    __slots__ = ("chars", "page", "line", "col_break_after", "vx0", "vx1", "vy0", "vy1")

    def __init__(self, chars: List[Char], page: int, line: int, col_break_after: bool = False):
        self.chars = chars
        self.page = page
        self.line = line
        self.col_break_after = col_break_after  # a column break follows on the same line
        self.vx0 = min(c.vbox[0] for c in chars)
        self.vx1 = max(c.vbox[2] for c in chars)
        self.vy0 = min(c.vbox[1] for c in chars)
        self.vy1 = max(c.vbox[3] for c in chars)

    @property
    def text(self) -> str:
        return "".join(c.c for c in self.chars)


@dataclass
class Stream:
    """A flat text with a parallel char map.

    ``text[i]`` came from ``chars[i]`` (``None`` for synthesised separators /
    spaces).  ``kind`` is 'body', 'cell', 'column' or 'pagejoin'.
    """

    kind: str
    text: str = ""
    chars: List[Optional[Char]] = field(default_factory=list)
    join_pos: int = -1  # for 'pagejoin': index where page N+1 text starts
    origin_chars: Optional[set] = None  # for 'column': ids of chars of the opening fragment


@dataclass
class Rect:
    page: int
    x0: float
    y0: float
    x1: float
    y1: float

    def as_tuple(self) -> Tuple[int, float, float, float, float]:
        return (self.page, self.x0, self.y0, self.x1, self.y1)


@dataclass
class Match:
    """One emitted reference: the text and one rect per (page, line)."""

    text: str
    rects: List[Rect]
    group_text: str  # the whole normalised bracket group (no brackets)
    kind: str  # stream kind the match came from
    multiline: bool = False
    crosspage: bool = False
    group_key: tuple = ()  # identity of the bracket group (opener char position)
    recovered: bool = False  # opener was an OCR'd '|' (OCR_PIPE_GROUP_RE)


@dataclass
class PageData:
    number: int  # 1-based
    rotation: int
    chars: List[Char]  # body chars in geometric order (margins removed)
    cells: Dict[Tuple[int, int, int], List[Char]]  # table cell -> chars
    page_median_gap: float  # median inter-word gap on the page (points)
    body_size: float  # median font size of the page (points)


# ---------------------------------------------------------------------------
# Normalisation helpers
# ---------------------------------------------------------------------------


def normalise_char(c: str) -> str:
    """Map a single PDF character to its normalised form ('' = dropped)."""
    if c is None:
        return ""
    out = c.translate(_NORMALISE_MAP)
    if out == "":
        return ""
    if out.isspace():
        return " "
    return out


def normalise_text(s: str) -> str:
    """Normalise a free-text string the same way stream text is normalised."""
    s = s.translate(_NORMALISE_MAP)
    s = re.sub(r"\s*\n\s*", " ", s)
    return re.sub(r"\s+", " ", s).strip()


_DIGIT_RE = re.compile(r"\d")


def _line_signature(text: str) -> str:
    """Digit-insensitive normalised text used by the running-line rule."""
    return _DIGIT_RE.sub("#", normalise_text(text))


# ---------------------------------------------------------------------------
# Rotation helper -- identical to the reference implementation
# ---------------------------------------------------------------------------


def rotate_rect(rect: fitz.Rect, angle: float, center: Tuple[float, float]) -> fitz.Rect:
    """Rotate ``rect`` by ``angle`` degrees about ``center`` (reference behaviour)."""
    x1, y1, x2, y2 = rect.x0, rect.y0, rect.x1, rect.y1
    x1 -= center[0]
    y1 -= center[1]
    x2 -= center[0]
    y2 -= center[1]

    x1r = x1 * math.cos(math.radians(angle)) - y1 * math.sin(math.radians(angle))
    y1r = x1 * math.sin(math.radians(angle)) + y1 * math.cos(math.radians(angle))
    x2r = x2 * math.cos(math.radians(angle)) - y2 * math.sin(math.radians(angle))
    y2r = x2 * math.sin(math.radians(angle)) + y2 * math.cos(math.radians(angle))

    x1r += center[0]
    y1r += center[1]
    x2r += center[0]
    y2r += center[1]

    return fitz.Rect(min(x1r, x2r), min(y1r, y2r), max(x1r, x2r), max(y1r, y2r))


# ---------------------------------------------------------------------------
# Layout frame: the rotation that makes the text read left to right
# ---------------------------------------------------------------------------


def _line_angle(direction: Sequence[float]) -> int:
    """Writing direction of a rawdict/dict line -> angle rounded to 0/90/180/270."""
    dx, dy = direction[0], direction[1]
    if dx == 0 and dy == 0:
        return 0
    angle = int(round(math.degrees(math.atan2(dy, dx)) / 90.0)) * 90
    return angle % 360


def _layout_matrix(angle: int) -> fitz.Matrix:
    """Matrix that maps text written at ``angle`` (unrotated page space) onto
    the horizontal, reading order left -> right, following lines below."""
    return fitz.Matrix(-angle)


def _unrotated_page_rect(page: fitz.Page) -> fitz.Rect:
    r = fitz.Rect(page.rect) * page.derotation_matrix
    r.normalize()
    return r


# ---------------------------------------------------------------------------
# Pass 1: cheap line signatures for the running header/footer rule
# ---------------------------------------------------------------------------


class LineKey(NamedTuple):
    """Position + text of a raw line, as used by the running-line rule."""

    y: float  # distance of the line centre from the page top (layout frame)
    rel_y: float  # the same as a fraction of the page height (0 = top, 1 = bottom)
    sig: str  # digit-insensitive normalised text
    exact: str  # normalised text


def _line_key(bbox: Sequence[float], lm: fitz.Matrix, lrect: fitz.Rect, text: str) -> Optional[LineKey]:
    exact = normalise_text(text)
    if not exact:
        return None
    r = fitz.Rect(bbox) * lm
    y = (r.y0 + r.y1) / 2.0 - lrect.y0
    return LineKey(y, y / max(lrect.height, 1.0), _DIGIT_RE.sub("#", exact), exact)


def _layout_rect(urect: fitz.Rect, lm: fitz.Matrix) -> fitz.Rect:
    r = urect * lm
    r.normalize()
    return r


class _SigHits:
    """Occurrences of one line signature, indexed for the repeat queries."""

    __slots__ = ("ys", "pages", "head_pages", "foot_pages", "by_exact", "_hits")

    def __init__(self, hits: List[Tuple[float, float, int, str]]):
        hits.sort(key=lambda h: h[0])
        self.ys = [h[0] for h in hits]
        self.pages = [h[2] for h in hits]
        self.head_pages = {h[2] for h in hits if h[1] < HEADER_ZONE_FRACTION}
        self.foot_pages = {h[2] for h in hits if h[1] > 1.0 - FOOTER_ZONE_FRACTION}
        self.by_exact: Optional[Dict[str, "_SigHits"]] = None  # built lazily
        self._hits = hits

    def exact(self, text: str) -> Optional["_SigHits"]:
        if self.by_exact is None:
            groups: Dict[str, list] = {}
            for h in self._hits:
                groups.setdefault(h[3], []).append(h)
            self.by_exact = {t: _SigHits(g) for t, g in groups.items()}
        return self.by_exact.get(text)

    def pages_near(self, y: float, tol: float, need: int) -> int:
        """Number of distinct pages (up to ``need``) with a hit within ``tol`` of ``y``."""
        lo = bisect.bisect_left(self.ys, y - tol)
        hi = bisect.bisect_right(self.ys, y + tol)
        seen: Set[int] = set()
        for i in range(lo, hi):
            seen.add(self.pages[i])
            if len(seen) >= need:
                break
        return len(seen)


class RepeatIndex:
    """Running header/footer detector: which raw lines repeat across pages.

    Built from the cheap first pass (:func:`collect_line_signatures`).  A line
    *repeats* when its digit-insensitive signature occurs on at least
    REPEAT_LINE_MIN_PAGES pages within REPEAT_Y_TOLERANCE points of the same
    layout-y -- OCR'd running headers wander by a point or two per page, so
    an exact y match is not required.  Inside the header/footer zones the
    position is ignored altogether (a header is a header wherever exactly it
    sits).  ``repeats_exactly`` demands the same text digits included: it is
    what bracketed lines are tested with, so a templated table row
    ("1. [Exhibit R- Invoice No. 1001") that only repeats digit-insensitively
    is never mistaken for a running line.  Queries are O(log n) with an early
    exit, so templated documents (the same cell text on every page) stay fast.
    """

    def __init__(self):
        self._raw: Dict[str, List[Tuple[float, float, int, str]]] = {}  # sig -> [(y, rel_y, page, exact)]
        self._index: Optional[Dict[str, _SigHits]] = None

    def add(self, page: int, key: LineKey) -> None:
        self._raw.setdefault(key.sig, []).append((key.y, key.rel_y, page, key.exact))
        self._index = None

    def _hits(self, key: LineKey, exact: bool) -> Optional[_SigHits]:
        if self._index is None:
            self._index = {sig: _SigHits(hits) for sig, hits in self._raw.items()}
        hits = self._index.get(key.sig)
        if hits is not None and exact:
            hits = hits.exact(key.exact)
        return hits

    def _pages(self, key: LineKey, exact: bool) -> int:
        hits = self._hits(key, exact)
        if hits is None:
            return 0
        need = REPEAT_LINE_MIN_PAGES
        if key.rel_y < HEADER_ZONE_FRACTION and len(hits.head_pages) >= need:
            return len(hits.head_pages)
        if key.rel_y > 1.0 - FOOTER_ZONE_FRACTION and len(hits.foot_pages) >= need:
            return len(hits.foot_pages)
        return hits.pages_near(key.y, REPEAT_Y_TOLERANCE, need)

    def repeats(self, key: LineKey) -> bool:
        return self._pages(key, exact=False) >= REPEAT_LINE_MIN_PAGES

    def repeats_exactly(self, key: LineKey) -> bool:
        return self._pages(key, exact=True) >= REPEAT_LINE_MIN_PAGES


def collect_line_signatures(doc: fitz.Document) -> RepeatIndex:
    """First pass: index (layout-y, text) of every raw line of every page.

    Uses ``get_text("dict")`` (no per-character data), so this pass is cheap
    and retains only a few strings per page.
    """
    index = RepeatIndex()
    for i, page in enumerate(doc):
        try:
            d = page.get_text("dict", flags=_RAWDICT_FLAGS)
        except Exception:  # pragma: no cover - defensive
            continue
        lines = []
        for block in d["blocks"]:
            if block.get("type", 0) != 0:
                continue
            for line in block["lines"]:
                text = "".join(s["text"] for s in line["spans"])
                if text.strip():
                    lines.append((line["bbox"], line.get("dir", (1, 0)), text))
        if not lines:
            continue
        urect = _unrotated_page_rect(page)
        for bbox, direction, text in lines:
            lm = _layout_matrix(_line_angle(direction))
            k = _line_key(bbox, lm, _layout_rect(urect, lm), text)
            if k is not None:
                index.add(i + 1, k)
    return index


# ---------------------------------------------------------------------------
# Pass 2, step 1: character extraction and geometric ordering
# ---------------------------------------------------------------------------

_RAWDICT_FLAGS = fitz.TEXT_PRESERVE_WHITESPACE | fitz.TEXT_PRESERVE_LIGATURES | fitz.TEXT_MEDIABOX_CLIP
# NOTE: TEXT_PRESERVE_IMAGES is deliberately NOT set -- with it, rawdict of a
# scanned page carries the whole page image (base64) and costs ~250 ms/page.
# TEXT_DEHYPHENATE is NOT set either: we want the hyphen and the raw line
# break, the join rule is applied by ourselves.


def _transform_bbox(bbox: Sequence[float], m: fitz.Matrix) -> Tuple[float, float, float, float]:
    r = fitz.Rect(bbox) * m
    r.normalize()
    return (r.x0, r.y0, r.x1, r.y1)


class _TableIndex:
    """Cell lookup for the cells of ``page.find_tables()`` in O(log n) per char."""

    def __init__(self, tables):
        self.tables = []  # (bbox, row_y0s, rows) ; rows: (y0, y1, cell_x0s, cells[(x0, x1, key)])
        self.cell_counts: Dict[int, int] = {}  # table index -> number of cells
        for ti, tab in enumerate(tables):
            rows = []
            n_cells = 0
            for ri, row in enumerate(tab.rows):
                cells = []
                for ci, cell in enumerate(row.cells):
                    if cell is None:
                        continue
                    r = fitz.Rect(cell)
                    cells.append((r.x0, r.x1, (ti, ri, ci)))
                if not cells:
                    continue
                cells.sort()
                n_cells += len(cells)
                rb = fitz.Rect(row.bbox)
                rows.append((rb.y0, rb.y1, [c[0] for c in cells], cells))
            if rows:
                rows.sort()
                self.tables.append((fitz.Rect(tab.bbox), [r[0] for r in rows], rows))
                self.cell_counts[ti] = n_cells

    def __bool__(self) -> bool:
        return bool(self.tables)

    def is_grid_cell(self, key: Tuple[int, int, int]) -> bool:
        """True when the cell belongs to a table with several cells (a page
        frame drawn as one big rectangle is a one-cell 'table')."""
        return self.cell_counts.get(key[0], 0) >= 2

    def lookup(self, x: float, y: float) -> Optional[Tuple[int, int, int]]:
        for bbox, row_y0s, rows in self.tables:
            if not bbox.contains(fitz.Point(x, y)):
                continue
            ri = bisect.bisect_right(row_y0s, y) - 1
            if ri < 0:
                continue
            y0, y1, cell_x0s, cells = rows[ri]
            if not (y0 <= y <= y1):
                continue
            ci = bisect.bisect_right(cell_x0s, x) - 1
            if ci < 0:
                continue
            x0, x1, key = cells[ci]
            if x0 <= x <= x1:
                return key
        return None


def _may_contain_table(page: fitz.Page) -> bool:
    """Cheap pre-filter: ``find_tables`` (strategy 'lines') needs ruling lines
    in BOTH directions, so a page whose drawings hold fewer than
    TABLE_MIN_RULES horizontal or vertical line-like items (a header rule, an
    underline, a logo) is skipped -- that keeps such pages at text speed.
    A path may carry a whole grid as many items, so the items are counted,
    not the paths; rectangles count for both directions."""
    horizontal = vertical = 0
    for path in page.get_drawings():
        for item in path.get("items", ()):
            op = item[0]
            if op == "l":
                a, b = item[1], item[2]
                if abs(b.y - a.y) <= TABLE_RULE_THICKNESS and abs(b.x - a.x) > TABLE_RULE_MIN_LENGTH:
                    horizontal += 1
                elif abs(b.x - a.x) <= TABLE_RULE_THICKNESS and abs(b.y - a.y) > TABLE_RULE_MIN_LENGTH:
                    vertical += 1
            elif op in ("re", "qu"):
                r = fitz.Rect(item[1]) if op == "re" else item[1].rect
                if r.width > TABLE_RULE_MIN_LENGTH and r.height > TABLE_RULE_MIN_LENGTH:
                    horizontal += 1  # a rectangle / filled cell: borders in both directions
                    vertical += 1
                elif r.width > TABLE_RULE_MIN_LENGTH:
                    horizontal += 1  # a thin filled bar = a rule
                elif r.height > TABLE_RULE_MIN_LENGTH:
                    vertical += 1
            if horizontal >= TABLE_MIN_RULES and vertical >= TABLE_MIN_RULES:
                return True
    return False


def _detect_tables(page: fitz.Page) -> _TableIndex:
    """Index of table cells found by ``page.find_tables``.

    ``find_tables`` (strategy 'lines') can only find something when the page
    has ruling lines, so it is skipped for pages without them (see
    :func:`_may_contain_table`) -- this is what keeps scanned documents and
    pages with a mere header rule fast.  PyMuPDF prints an advisory notice on
    the first call; it is swallowed so it cannot land in the job log.  The
    cells are reported in *displayed* page space (after /Rotate), unlike the
    rawdict char boxes; :func:`extract_page` maps the chars accordingly.
    """
    try:
        if not hasattr(page, "find_tables") or not _may_contain_table(page):
            return _TableIndex([])
        with contextlib.redirect_stdout(io.StringIO()):
            tabs = page.find_tables()
        return _TableIndex(tabs.tables)
    except Exception:  # pragma: no cover - defensive: layout analysis failed
        return _TableIndex([])


_BRACKET_CHARS = frozenset("[]{}")


def _rawdict_has_bracket(raw) -> bool:
    """True when any character of the rawdict page is an opening/closing bracket."""
    for block in raw.get("blocks", ()):
        if block.get("type", 0) != 0:
            continue
        for line in block.get("lines", ()):
            for span in line.get("spans", ()):
                for ch in span.get("chars", ()):
                    if ch.get("c") in _BRACKET_CHARS:
                        return True
    return False


def _median_size(chars: Iterable[Char]) -> float:
    sizes = [c.size for c in chars if not c.is_space and c.size > 0]
    return statistics.median(sizes) if sizes else 0.0


class RawLine(NamedTuple):
    """One rawdict line after normalisation, before clustering."""

    chars: List[Char]
    repeated: bool  # digit-insensitive repeat on REPEAT_LINE_MIN_PAGES pages
    repeated_exact: bool  # the same, digits included
    in_cell: bool  # every char sits in a multi-cell table cell


class _Entry(NamedTuple):
    """A raw line positioned in the layout frame (clustering input)."""

    center: float  # vertical centre (layout frame)
    height: float
    x0: float  # left edge (layout frame)
    block: int  # rawdict block number (tie-breaker)
    raw: RawLine


class _BandLine(NamedTuple):
    """A geometric line inside the header/footer band awaiting its decision."""

    lid: int
    where: str  # 'top' | 'bottom'
    vy0: float
    vy1: float
    candidate: bool  # may be body text (not a running line / page number)
    is_long: bool  # at least BODY_LINE_MIN_CHARS characters


def extract_page(page: fitz.Page, page_number: int, repeated: Optional[RepeatIndex] = None) -> PageData:
    """Extract, normalise and geometrically order the characters of one page.

    ``repeated`` is the running-line index built by
    :func:`collect_line_signatures` over the whole document.
    """
    rot = page.rotation
    urect = _unrotated_page_rect(page)
    raw = page.get_text("rawdict", flags=_RAWDICT_FLAGS)
    # Table detection (get_drawings + find_tables) is the expensive step and
    # only matters for pages that can take part in a bracket group. Scanned
    # drawings / CAD sheets carry thousands of paths and a page label only:
    # without a single bracket character they are skipped at text speed.
    tables = _detect_tables(page) if _rawdict_has_bracket(raw) else _TableIndex([])
    # find_tables reports cells in displayed page space; rawdict boxes are
    # unrotated -- map a char centre into display space before the lookup
    to_display = page.rotation_matrix if rot else None

    def cell_of(c: Char) -> Optional[Tuple[int, int, int]]:
        x, y = _bbox_center(c.bbox)
        if to_display is not None:
            pt = fitz.Point(x, y) * to_display
            x, y = pt.x, pt.y
        return tables.lookup(x, y)

    # --- collect raw lines, grouped by writing direction -----------------------
    # A page is laid out in the frame in which its (dominant) text reads left to
    # right; a minority direction (a sideways table on a portrait page) is laid
    # out in its own frame afterwards.
    by_angle: Dict[int, List[RawLine]] = {}
    frames: Dict[int, Tuple[fitz.Matrix, fitz.Rect]] = {}  # angle -> (layout matrix, layout page rect)
    for block in raw["blocks"]:
        if block.get("type", 0) != 0:
            continue
        bno = block.get("number", -1)
        for line in block["lines"]:
            angle = _line_angle(line.get("dir", (1, 0)))
            if angle not in frames:
                m = _layout_matrix(angle)
                frames[angle] = (m, _layout_rect(urect, m))
            lm, lrect = frames[angle]
            identity = angle == 0
            chars: List[Char] = []
            for span in line["spans"]:
                size = float(span.get("size", 0.0))
                for ch in span["chars"]:
                    c = normalise_char(ch["c"])
                    bbox = tuple(ch["bbox"])
                    vbox = bbox if identity else _transform_bbox(bbox, lm)
                    chars.append(Char(page_number, c, bbox, vbox, bno, size))
            if not chars:
                continue
            in_cell = False
            if tables:
                keys = set()
                for c in chars:
                    c.cell = cell_of(c)
                    if not c.is_space:
                        keys.add(c.cell)
                in_cell = bool(keys) and None not in keys and all(tables.is_grid_cell(k) for k in keys)
            is_rep = is_rep_exact = False
            if repeated is not None and not in_cell:
                key = _line_key(line["bbox"], lm, lrect, "".join(c.c for c in chars))
                if key is not None:
                    is_rep = repeated.repeats(key)
                    is_rep_exact = is_rep and repeated.repeats_exactly(key)
            by_angle.setdefault(angle, []).append(RawLine(chars, is_rep, is_rep_exact, in_cell))

    body_size = _median_size(c for raw_lines in by_angle.values() for rl in raw_lines for c in rl.chars)
    lines: List[List[Char]] = []  # geometric lines in reading order (all directions)
    dropped_lines: Set[int] = set()  # line ids removed as header/footer/running line
    body_left: Dict[int, float] = {}  # line id -> left body margin (layout frame)
    # dominant direction first (most characters)
    for angle in sorted(by_angle, key=lambda a: -sum(len(rl.chars) for rl in by_angle[a])):
        _cluster_lines(by_angle[angle], lines, dropped_lines, body_left, frames[angle][1], body_size)

    # --- page statistics ---------------------------------------------------------
    gaps = []
    for chars in lines:
        gaps.extend(g for g, _, had_space in _word_gaps(chars) if had_space)
    page_median_gap = statistics.median(gaps) if gaps else DEFAULT_SPACE_WIDTH

    # --- margins: paragraph numbers, header/footer/running lines -----------------
    body_chars: List[Char] = []
    para_gap = max(PARA_GAP_FACTOR * page_median_gap, PARA_GAP_MIN_PT)
    for lid, chars in enumerate(lines):
        if lid in dropped_lines:
            continue
        body_chars.extend(_strip_para_tokens(chars, body_left[lid], para_gap))

    # --- table cells --------------------------------------------------------------
    cells: Dict[Tuple[int, int, int], List[Char]] = {}
    for c in body_chars:
        if c.cell is not None:
            cells.setdefault(c.cell, []).append(c)

    return PageData(page_number, rot, body_chars, cells, page_median_gap, body_size)


def _cluster_lines(raw_lines: Sequence[RawLine], lines: List[List[Char]], dropped_lines: Set[int],
                   body_left: Dict[int, float], lrect: fitz.Rect, body_size: float) -> None:
    """Cluster raw lines of one writing direction into geometric lines.

    Appends to ``lines`` (assigning line ids), records in ``dropped_lines``
    the ids of header/footer/running lines and in ``body_left`` the left body
    margin of every line.  ``lrect`` is the page rect in the layout frame,
    ``body_size`` the page's median font size.

    Header/footer decision per geometric line:
      * inside the band: dropped unless it reads like text -- not a repeated
        running line, not a page-number line, and either long body-size text
        or continuing the text above/below at the normal line pitch
        (BODY_CHAIN_DY).  Small-font lines are kept by the chain rule only:
        footnotes legitimately reach into the band, an isolated small
        footer line does not;
      * inside the wider zone: dropped when it is a repeated running line
        (unless it is long body-size text with a bracket) or a short
        page-number line;
      * elsewhere: dropped only when repeated AND short AND without brackets;
      * a line whose chars sit in table cells is never dropped as a running
        line (tables are content), only as a band line.
    """
    entries: List[_Entry] = []
    for rl in raw_lines:
        chars = rl.chars
        vy0 = min(c.vbox[1] for c in chars)
        vy1 = max(c.vbox[3] for c in chars)
        vx0 = min(c.vbox[0] for c in chars)
        entries.append(_Entry((vy0 + vy1) / 2.0, max(vy1 - vy0, 1.0), vx0, chars[0].block, rl))

    # Raw lines whose vertical centres (layout frame) are within half a line
    # height belong to the same geometric line (e.g. a paragraph number in the
    # margin and the body text next to it); inside a geometric line the raw
    # lines are ordered left to right and separated by a synthetic space.
    entries.sort(key=lambda e: (e.center, e.x0, e.block))
    clusters: List[List[_Entry]] = []
    cur_center = None
    cur_height = None
    for entry in entries:
        if cur_center is None or abs(entry.center - cur_center) > LINE_CLUSTER_TOLERANCE * min(entry.height, cur_height):
            clusters.append([])
            cur_center, cur_height = entry.center, entry.height
        clusters[-1].append(entry)

    top_band = lrect.y0 + lrect.height * HEADER_BAND_FRACTION
    bottom_band = lrect.y1 - lrect.height * FOOTER_BAND_FRACTION
    top_zone = lrect.y0 + lrect.height * HEADER_ZONE_FRACTION
    bottom_zone = lrect.y1 - lrect.height * FOOTER_ZONE_FRACTION
    left_margin = lrect.x0 + lrect.width * BODY_LEFT_FRACTION

    # split a cluster where a raw line overprints the text merged so far
    split_clusters: List[List[_Entry]] = []
    for cluster in clusters:
        cluster.sort(key=lambda e: (e.x0, e.block))
        cur: List[_Entry] = []
        cur_x1 = -math.inf
        for entry in cluster:
            vx1 = max(c.vbox[2] for c in entry.raw.chars)
            width = max(vx1 - entry.x0, 1.0)
            if cur and cur_x1 - entry.x0 > LINE_OVERLAP_FRACTION * min(width, cur_x1 - min(e.x0 for e in cur)):
                split_clusters.append(cur)
                cur, cur_x1 = [], -math.inf
            cur.append(entry)
            cur_x1 = max(cur_x1, vx1)
        if cur:
            split_clusters.append(cur)

    first_lid = len(lines)
    band_lines: List[_BandLine] = []
    extent: Dict[int, Tuple[float, float]] = {}
    for cluster in split_clusters:
        merged: List[Char] = []
        repeated_chars = 0
        all_repeated_exact = True
        cell_chars = 0
        page_no = cluster[0].raw.chars[0].page
        for entry in cluster:
            chars = entry.raw.chars
            if merged and not merged[-1].is_space and not chars[0].is_space:
                prev = merged[-1]
                gap_box = (prev.bbox[2], prev.bbox[1], prev.bbox[2], prev.bbox[3])
                vgap_box = (prev.vbox[2], prev.vbox[1], prev.vbox[2], prev.vbox[3])
                merged.append(Char(page_no, " ", gap_box, vgap_box, prev.block, prev.size))
            merged.extend(chars)
            n_visible = sum(1 for c in chars if not c.is_space)
            if entry.raw.repeated:
                repeated_chars += n_visible
            if not entry.raw.repeated_exact:
                all_repeated_exact = False
            if entry.raw.in_cell:
                cell_chars += n_visible
        lid = len(lines)
        for c in merged:
            c.line = lid
        lines.append(merged)
        body_left[lid] = left_margin

        # header / footer decision (content-aware); band lines are decided
        # below because they may depend on their neighbours
        text = normalise_text("".join(c.c for c in merged))
        n_chars = sum(1 for c in merged if not c.is_space)
        has_bracket = any(ch in text for ch in "[]{}")
        in_table = cell_chars * 2 >= n_chars
        vy0 = min(c.vbox[1] for c in merged)
        vy1 = max(c.vbox[3] for c in merged)
        cy = (vy0 + vy1) / 2.0
        in_zone = cy < top_zone or cy > bottom_zone
        # a bracketed line only counts as running text when ALL its raw lines
        # repeat with their digits (a templated table row "1. [Exhibit R-
        # Invoice No. 1001" repeats digit-insensitively but is content) --
        # unless it carries a page-number pattern in the header/footer zone
        is_repeated = repeated_chars > 0 and repeated_chars * 2 >= n_chars and (
            not has_bracket or all_repeated_exact or (in_zone and PAGE_NUMBER_RE.search(text) is not None))
        is_short = len(text) < REPEAT_LINE_MAX_CHARS
        is_pagenum = is_short and not has_bracket and PAGE_NUMBER_RE.search(text) is not None
        size = _median_size(merged)
        is_small = body_size > 0 and size > 0 and size < SMALL_TEXT_FRACTION * body_size
        candidate = not is_repeated and not is_pagenum  # may be body / footnote text
        # a small-font band line (footnote reaching into the band) is kept
        # only when chained to the text above/below, never by length alone
        is_long = n_chars >= BODY_LINE_MIN_CHARS and not is_small
        if cy < top_band:
            band_lines.append(_BandLine(lid, "top", vy0, vy1, candidate, is_long))
        elif cy > bottom_band:
            band_lines.append(_BandLine(lid, "bottom", vy0, vy1, candidate, is_long))
        elif in_table:
            pass
        elif in_zone:
            if is_repeated and (is_short or is_small or not has_bracket):
                dropped_lines.add(lid)
            elif is_pagenum:
                dropped_lines.add(lid)
        elif is_repeated and is_short and not has_bracket:
            dropped_lines.add(lid)
        extent[lid] = (vy0, vy1)

    # band lines: text when long enough, or when chained to a kept line at
    # the normal line pitch (footer band: the line above; header band: the
    # line below).  Everything else in the band is header/footer.
    def chained(lid: int, vy0: float, vy1: float, other: int) -> bool:
        if other < first_lid or other >= len(lines) or other in dropped_lines or other not in extent:
            return False
        oy0, oy1 = extent[other]
        gap = vy0 - oy1 if other < lid else oy0 - vy1
        return gap <= BODY_CHAIN_DY * max(vy1 - vy0, 1.0)

    for bl in sorted(band_lines, key=lambda b: b.lid if b.where == "bottom" else -b.lid):
        keep = bl.candidate and (bl.is_long or chained(bl.lid, bl.vy0, bl.vy1, bl.lid - 1 if bl.where == "bottom" else bl.lid + 1))
        if not keep:
            dropped_lines.add(bl.lid)


def _bbox_center(b: Sequence[float]) -> Tuple[float, float]:
    return ((b[0] + b[2]) / 2.0, (b[1] + b[3]) / 2.0)


def _strip_para_tokens(chars: List[Char], body_left: float, para_gap: float) -> List[Char]:
    """Drop a paragraph number / list marker at the start of the line.

    The token must be the FIRST token of the line, look like a paragraph number
    (``PARA_TOKEN_RE``), end left of ``body_left`` and be followed by a gap of
    at least ``para_gap`` points -- so ordinary words at a 1-inch margin and
    bare numbers followed by a normal space are never removed.
    """
    # locate the first token
    i = 0
    n = len(chars)
    while i < n and chars[i].is_space:
        i += 1
    j = i
    while j < n and not chars[j].is_space:
        j += 1
    if i == j:
        return chars
    token = chars[i:j]
    text = "".join(c.c for c in token)
    if not PARA_TOKEN_RE.match(text):
        return chars
    x1 = max(c.vbox[2] for c in token)
    if x1 >= body_left:
        return chars
    # next non-space char after the token
    k = j
    while k < n and chars[k].is_space:
        k += 1
    if k < n and chars[k].vbox[0] - x1 < para_gap:
        return chars  # followed by a normal space: an ordinary word / number
    return chars[j:]


def _word_gaps(chars: List[Char]) -> List[Tuple[float, int, bool]]:
    """Horizontal gaps between consecutive non-space chars on a line.

    Returns ``(gap, index of the first char after the gap, had_space)``; a
    gap is reported when a space separates the two chars or when it is wide
    enough to be a column break on its own (``COLUMN_GAP_MIN_PT``).
    """
    gaps = []
    prev = None
    saw_space = False
    for i, c in enumerate(chars):
        if c.is_space:
            saw_space = True
            continue
        if prev is not None:
            gap = c.vbox[0] - prev.vbox[2]
            if saw_space or gap > COLUMN_GAP_MIN_PT:
                gaps.append((gap, i, saw_space))
        prev = c
        saw_space = False
    return gaps


# ---------------------------------------------------------------------------
# Step 2: streams
# ---------------------------------------------------------------------------


class _StreamBuilder:
    """Accumulates normalised text + char map applying the join rules."""

    def __init__(self, kind: str):
        self.kind = kind
        self._parts: List[str] = []
        self._chars: List[Optional[Char]] = []
        self._last = ""  # last emitted character
        self._pending_space = False
        self._pending_break = False
        self._join_pos = -1
        self.origin_chars: Optional[set] = None

    def _emit(self, ch: str, c: Optional[Char]):
        self._parts.append(ch)
        self._chars.append(c)
        self._last = ch

    @property
    def text(self) -> str:
        return "".join(self._parts)

    def add_chars(self, chars: Iterable[Char]):
        for c in chars:
            if c.c == "":
                continue  # dropped char (e.g. U+00C2)
            if c.is_space:
                self._pending_space = True
                continue
            if self._pending_break:
                # line end: single space, except after a hyphen -> join directly
                if self._last and self._last not in ("-", COLUMN_BREAK):
                    self._emit(" ", None)
            elif self._pending_space and self._last and self._last not in (" ", COLUMN_BREAK):
                self._emit(" ", None)
            self._pending_space = False
            self._pending_break = False
            self._emit(c.c, c)

    def line_break(self):
        self._pending_break = True
        self._pending_space = False

    def column_break(self):
        if self._last and self._last != COLUMN_BREAK:
            self._emit(COLUMN_BREAK, None)
        self._pending_space = False
        self._pending_break = False

    def soft_break(self):
        """A column break rendered as a plain space (fallback streams)."""
        self._pending_space = True

    def mark_join(self):
        """Record the position where page N+1 text will start (page-join streams)."""
        self._pending_break = True
        self._join_pos = len(self._parts)

    def finish(self) -> Stream:
        return Stream(self.kind, self.text, self._chars, self._join_pos, self.origin_chars)


class _LineExtents:
    """Horizontal extents of the non-space chars of a line, for gap checks."""

    __slots__ = ("x0s", "max_x1")

    def __init__(self, chars: List[Char]):
        boxes = sorted((c.vbox[0], c.vbox[2]) for c in chars if not c.is_space)
        self.x0s = [b[0] for b in boxes]
        self.max_x1 = []  # running maximum of x1 (chars are sorted by x0)
        m = -math.inf
        for _, x1 in boxes:
            m = max(m, x1)
            self.max_x1.append(m)

    def free(self, x0: float, x1: float) -> bool:
        """True when no char overlaps the interval (x0, x1) (after the inset)."""
        lo = x0 + COLUMN_CONFIRM_INSET
        hi = x1 - COLUMN_CONFIRM_INSET
        if hi <= lo:
            return True
        k = bisect.bisect_left(self.x0s, hi)  # chars starting before hi
        return k == 0 or self.max_x1[k - 1] <= lo


def split_fragments(pd: PageData, line_chars: List[Char], neighbours: Sequence[_LineExtents] = ()) -> List[Fragment]:
    """Split one geometric line into fragments at confirmed column-break gaps.

    ``neighbours`` are the char extents of the adjacent lines (within
    COLUMN_CONFIRM_DY line heights); a candidate gap is a column break only
    when every neighbour is free of text next to one edge of the gap.
    """
    if not line_chars:
        return []
    lid = line_chars[0].line
    gaps = _word_gaps(line_chars)
    # Reference space width: the line's own median, but never wider than the
    # page median.  A table row whose cells are far apart has a *large* line
    # median (every gap is a cell gap) which would hide the column breaks;
    # the page median (dominated by body text) keeps the rule honest there,
    # and the neighbour confirmation keeps stretched justified lines whole.
    ref = pd.page_median_gap
    spaced = [g for g, _, had_space in gaps if had_space]
    if len(spaced) >= MIN_GAPS_FOR_LINE_MEDIAN:
        ref = min(ref, statistics.median(spaced))
    threshold = max(COLUMN_GAP_FACTOR * ref, COLUMN_GAP_MIN_PT)
    cut_points = []
    for g, i, _ in gaps:
        if g <= threshold:
            continue
        # gap interval: from the previous non-space char to chars[i]
        j = i - 1
        while j >= 0 and line_chars[j].is_space:
            j -= 1
        gx0 = line_chars[j].vbox[2] if j >= 0 else line_chars[i].vbox[0] - g
        gx1 = line_chars[i].vbox[0]
        w = min(threshold, gx1 - gx0)
        if all(ext.free(gx1 - w, gx1) or ext.free(gx0, gx0 + w) for ext in neighbours):
            cut_points.append(i)

    fragments: List[Fragment] = []
    start = 0
    for cp in cut_points + [len(line_chars)]:
        chunk = line_chars[start:cp]
        # trim whitespace at both ends of the fragment
        a, b = 0, len(chunk)
        while a < b and chunk[a].is_space:
            a += 1
        while b > a and chunk[b - 1].is_space:
            b -= 1
        if b > a:
            fragments.append(Fragment(chunk[a:b], pd.number, lid))
        start = cp
    for f in fragments[:-1]:
        f.col_break_after = True
    return fragments


def body_lines(pd: PageData) -> List[List[Fragment]]:
    """Body (non-cell) chars grouped by geometric line and split into fragments."""
    by_line: Dict[int, List[Char]] = {}
    for c in pd.chars:
        if c.cell is not None:
            continue
        by_line.setdefault(c.line, []).append(c)
    lids = sorted(by_line)
    extents = []
    centres = []
    for lid in lids:
        chars = by_line[lid]
        ys = [c.vbox[1] for c in chars if not c.is_space] or [c.vbox[1] for c in chars]
        ye = [c.vbox[3] for c in chars if not c.is_space] or [c.vbox[3] for c in chars]
        extents.append((min(ys), max(ye)))
        centres.append(_LineExtents(chars))
    out = []
    for idx, lid in enumerate(lids):
        y0, y1 = extents[idx]
        height = max(y1 - y0, 1.0)
        neigh = []
        if idx > 0 and y0 - extents[idx - 1][1] <= COLUMN_CONFIRM_DY * height:
            neigh.append(centres[idx - 1])
        if idx + 1 < len(lids) and extents[idx + 1][0] - y1 <= COLUMN_CONFIRM_DY * height:
            neigh.append(centres[idx + 1])
        frags = split_fragments(pd, by_line[lid], neigh)
        if frags:
            out.append(frags)
    return out


def _x_overlap(a: Fragment, b: Fragment) -> bool:
    return a.vx1 > b.vx0 and b.vx1 > a.vx0


def _add_lines(sb: _StreamBuilder, lines: Sequence[List[Fragment]], prev: Optional[List[Fragment]] = None) -> Optional[List[Fragment]]:
    """Feed fragment lines into ``sb`` applying the line-transition rule.

    Fragments on one line are separated by a hard column break.  Between two
    lines the text is joined (space / hyphen rule) -- except when either line
    was split into columns and the last fragment of the previous line does not
    overlap the first fragment of the next one horizontally: the right column
    must not flow into the next line's left column, so a column break is
    inserted instead.  Returns the last line fed (for chaining).
    """
    for frags in lines:
        if prev is not None and (len(prev) > 1 or len(frags) > 1) and not _x_overlap(prev[-1], frags[0]):
            sb.column_break()
        for f in frags:
            sb.add_chars(f.chars)
            if f.col_break_after:
                sb.column_break()
        sb.line_break()
        prev = frags
    return prev


def build_body_stream(lines: List[List[Fragment]], kind: str = "body",
                      footnotes: Sequence[List[Fragment]] = ()) -> Stream:
    """Join fragments in reading order; column breaks become hard separators.

    ``footnotes`` (the trailing small-font block, see :func:`split_footnotes`)
    are appended after a hard break so that a group left open by the last
    body line can never close inside a footnote.
    """
    sb = _StreamBuilder(kind)
    _add_lines(sb, lines)
    if footnotes:
        sb.column_break()
        _add_lines(sb, footnotes)
    return sb.finish()


def _has_unclosed_opener(text: str) -> bool:
    """True when the text has an opening bracket without a closer after it."""
    last_open = max(text.rfind("["), text.rfind("{"))
    if last_open < 0:
        return False
    return text.find("]", last_open) < 0 and text.find("}", last_open) < 0


def build_column_streams(pd: PageData, lines: List[List[Fragment]]) -> List[Stream]:
    """Column chains for groups opened in a fragment of a line split into columns.

    The continuation is the fragment on a following line whose x-range overlaps
    the column of the opening fragment (from its left edge to the start of the
    next fragment on the line, or its own right edge for the last fragment),
    not the text after the gap on the same line.

    When no chain closes the group, the line itself is retried with the column
    breaks softened to spaces ("soft line" stream): this rescues a reference
    that merely contains an unusually wide inter-word gap on a single line.
    Such a soft group must close on the same line, so table rows can never
    produce a multi-line garbage reference through this fallback.
    """
    streams: List[Stream] = []
    for li, frags in enumerate(lines):
        if len(frags) < 2:
            continue
        for fi, f in enumerate(frags):
            if not _has_unclosed_opener(f.text):
                continue
            col_x0 = f.vx0
            col_x1 = frags[fi + 1].vx0 if fi + 1 < len(frags) else max(f.vx1, f.vx0 + 1.0)
            sb = _StreamBuilder("column")
            sb.add_chars(f.chars)
            sb.origin_chars = {id(c) for c in f.chars}
            last_y1 = f.vy1
            height = max(f.vy1 - f.vy0, 1.0)
            used = 0
            closed = False
            for nxt in lines[li + 1 : li + 1 + MAX_COLUMN_SEARCH_LINES]:
                if used >= MAX_COLUMN_CONTINUATION_LINES or closed:
                    break
                cand = [g for g in nxt if g.vx1 > col_x0 and g.vx0 < col_x1]
                if not cand:
                    continue
                g = cand[0]
                if g.vy0 - last_y1 > MAX_COLUMN_CONTINUATION_DY * height:
                    break
                sb.line_break()
                sb.add_chars(g.chars)
                last_y1 = g.vy1
                used += 1
                if not _has_unclosed_opener(sb.text):
                    closed = True
            if closed:
                streams.append(sb.finish())
                continue
            if not f.col_break_after:
                continue
            # fallback: the same line with soft column breaks (scan_stream only
            # accepts groups whose opener lies inside the opening fragment)
            soft = _StreamBuilder("column")
            for g in frags:
                soft.add_chars(g.chars)
                soft.soft_break()
            soft.origin_chars = {id(c) for c in f.chars}
            streams.append(soft.finish())
    return streams


def build_cell_streams(pd: PageData) -> List[Stream]:
    """One stream per table cell (a cell is a mini page: its lines joined)."""
    streams = []
    for key in sorted(pd.cells):
        chars = pd.cells[key]
        by_line: Dict[int, List[Char]] = {}
        for c in chars:
            by_line.setdefault(c.line, []).append(c)
        sb = _StreamBuilder("cell")
        for lid in sorted(by_line):
            sb.add_chars(sorted(by_line[lid], key=lambda c: c.vbox[0]))
            sb.line_break()
        streams.append(sb.finish())
    return streams


def split_footnotes(pd: PageData, lines: List[List[Fragment]]) -> Tuple[List[List[Fragment]], List[List[Fragment]]]:
    """Split the page's lines into (body lines, trailing footnote lines).

    The footnote block is the run of lines at the page end whose font size is
    smaller than the page's body size by more than FOOTNOTE_SIZE_DELTA (the
    structural footnote criterion: Word sets footnotes 1 pt smaller than the
    body by default).  A page without such a trailing run has no footnotes.
    """
    if pd.body_size <= 0:
        return lines, []
    limit = pd.body_size - FOOTNOTE_SIZE_DELTA
    k = len(lines)
    while k > 0:
        size = _median_size(c for f in lines[k - 1] for c in f.chars)
        if size > 0 and size < limit:
            k -= 1
        else:
            break
    return lines[:k], lines[k:]


def join_lines(pd: PageData, lines: List[List[Fragment]], tail: bool) -> List[List[Fragment]]:
    """Lines of a page that take part in the cross-page join.

    Footnotes and small running text (font size below the body size by more
    than FOOTNOTE_SIZE_DELTA, or below SMALL_TEXT_FRACTION of it) are
    skipped; ``tail`` selects the last lines, otherwise the first ones.
    """
    limit = max(SMALL_TEXT_FRACTION * pd.body_size, pd.body_size - FOOTNOTE_SIZE_DELTA)
    picked: List[List[Fragment]] = []
    order = reversed(lines) if tail else lines
    for frags in order:
        size = _median_size(c for f in frags for c in f.chars)
        if pd.body_size > 0 and size > 0 and size < limit:
            continue
        picked.append(frags)
        if len(picked) >= PAGE_JOIN_LINES:
            break
    if tail:
        picked.reverse()
    return picked


def build_pagejoin_stream(prev_lines: List[List[Fragment]], next_lines: List[List[Fragment]]) -> Optional[Stream]:
    """Last body lines of page N + first body lines of page N+1."""
    if not prev_lines or not next_lines:
        return None
    sb = _StreamBuilder("pagejoin")
    last = _add_lines(sb, prev_lines)
    sb.mark_join()
    _add_lines(sb, next_lines, last)
    return sb.finish()


# ---------------------------------------------------------------------------
# Step 3: scanning streams, segmenting groups, building rects
# ---------------------------------------------------------------------------


def _round(v: float) -> float:
    return round(v, COORD_DECIMALS)


def _char_extent(c: Char) -> float:
    """Short side of the char box (fallback size estimate when the font size is 0)."""
    return min(c.bbox[2] - c.bbox[0], c.bbox[3] - c.bbox[1])


def _line_font_size(cs: Sequence[Char]) -> float:
    """Median font size of the chars (falls back to the char-box extent)."""
    sizes = [c.size for c in cs if c.size > 0]
    if sizes:
        return statistics.median(sizes)
    return statistics.median(_char_extent(c) for c in cs)


def rects_for_chars(chars: Iterable[Char], rotations: Dict[int, int]) -> List[Rect]:
    """Union char boxes per (page, line) -> one rect per line (see APPLY_LEGACY_ROTATE_RECT)."""
    groups: Dict[Tuple[int, int], List[Char]] = {}
    for c in chars:
        if c is None or c.is_space:
            continue
        groups.setdefault((c.page, c.line), []).append(c)
    rects: List[Rect] = []
    for (page, line) in sorted(groups):
        cs = groups[(page, line)]
        r = fitz.Rect(cs[0].bbox)
        for c in cs[1:]:
            r |= fitz.Rect(c.bbox)
        # guard: a union that spans several FONT SIZES across the writing
        # direction merged more than one line of text -- never emit such
        # geometry.  Measured in the layout frame (vbox: text horizontal), so
        # the cross dimension is always the height; compared against the
        # font size (a line box is 1.0-1.4 em tall), never against glyph
        # widths, which would drop narrow fragments ("1", "R-1").
        size = _line_font_size(cs)
        vheight = max(c.vbox[3] for c in cs) - min(c.vbox[1] for c in cs)
        if size > 0 and vheight > MAX_RECT_SIZE_FACTOR * size:
            continue
        rotation = rotations.get(page, 0)
        if APPLY_LEGACY_ROTATE_RECT and rotation != 0:
            center = ((r.x0 + r.x1) / 2.0, (r.y0 + r.y1) / 2.0)
            r = rotate_rect(r, rotation, center)
        rects.append(Rect(page, _round(r.x0), _round(r.y0), _round(r.x1), _round(r.y1)))
    return rects


def _prefix_word(segment: str) -> Optional[str]:
    """Return the singular prefix word if the segment starts with one."""
    first = segment.split(" ", 1)[0].strip(".:;,").lower()
    return PREFIX_SINGULAR.get(first)


def segment_group(inner: str) -> List[Tuple[int, int, str]]:
    """Split a group's inner text into (start, end, emitted_text) segments.

    ``start``/``end`` index into ``inner`` (the chars whose rects belong to the
    segment); ``emitted_text`` may carry a prepended singular prefix.  A later
    segment inherits the first segment's prefix (and the letter part of its
    id for bare numbers) only while the chain of references is unbroken: once
    a non-reference segment such as ``paras 5`` is seen, nothing after it
    inherits (``[Exhibit R-56, paras 5 and 7]`` must not yield ``Exhibit R-7``).
    """
    segments: List[Tuple[int, int]] = []
    pos = 0
    for m in SEGMENT_SEP_RE.finditer(inner):
        if m.start() > pos:
            segments.append((pos, m.start()))
        pos = m.end()
    if pos < len(inner):
        segments.append((pos, len(inner)))

    # split dash ranges between lettered ids ("C-1 - C-3")
    ranged: List[Tuple[int, int]] = []
    for s, e in segments:
        p = s
        for m in ID_RANGE_RE.finditer(inner, s, e):
            ranged.append((p, m.start()))
            p = m.end()
        ranged.append((p, e))

    # trim whitespace, leading "see (also)" / "and" and trailing punctuation
    trimmed: List[Tuple[int, int]] = []
    for s, e in ranged:
        while s < e and inner[s] == " ":
            s += 1
        while e > s and inner[e - 1] == " ":
            e -= 1
        m = SEGMENT_LEAD_RE.match(inner[s:e])  # (a slice: '^' does not anchor at pos)
        if m and s + m.end() < e:
            s += m.end()
        while e > s + 1 and inner[e - 1] in SEGMENT_TRAIL_CHARS:
            e -= 1
        if e > s:
            trimmed.append((s, e))
    if not trimmed:
        return []

    out: List[Tuple[int, int, str]] = []
    cur_prefix = None  # singular prefix word of the latest prefixed segment ("Exhibit")
    cur_id_prefix = ""  # letter part of its id ("R-" in "R-117"), for bare numbers
    prev_was_ref = False
    for i, (s, e) in enumerate(trimmed):
        seg = inner[s:e]
        prefix = _prefix_word(seg)
        is_ref = False
        if prefix is not None:
            # normalise plural prefix to singular (Exhibits -> Exhibit)
            head, _, tail = seg.partition(" ")
            seg = prefix + (" " + tail if tail else "")
            cur_prefix = prefix
            m = ID_PREFIX_RE.match(tail)
            cur_id_prefix = m.group(1) if m else ""
            is_ref = True
        elif cur_prefix and prev_was_ref and REF_ID_RE.match(seg):
            # "Exhibits R-A03.25 to R-A03.36" -> "Exhibit R-A03.36";
            # "Exhibits R-117, 118 and 119"  -> "Exhibit R-118", "Exhibit R-119"
            # but "[Exhibit R-56 and RWS-1]"  -> "RWS-1" (own case term)
            if NO_PREFIX_ID_RE.match(seg):
                is_ref = False
            else:
                if cur_id_prefix and BARE_NUMBER_RE.match(seg):
                    seg = cur_id_prefix + seg
                seg = cur_prefix + " " + seg
                is_ref = True
        elif i > 0 and BARE_NUMBER_RE.match(seg):
            # bare number after a non-reference segment ("paras 5 and 7",
            # "para. 8.30 and 8.31"): neither a reference nor useful on its own
            prev_was_ref = False
            continue
        prev_was_ref = is_ref
        out.append((s, e, seg))
    return out


def _group_matches(stream: Stream):
    """Yield (opener index, inner start, inner end, recovered) for every group.

    Regular ``[..]`` / ``{..}`` groups first; then, when
    RECOVER_OCR_PIPE_OPENER is set, closer-only groups whose opener was OCR'd
    as a vertical bar and whose text is a strict reference (never inside a
    regular group, never in the page-join stream).
    """
    spans = []
    for m in GROUP_RE.finditer(stream.text):
        spans.append((m.start(), m.end()))
        yield m.start(), m.start(1), m.end(1), False
    if not RECOVER_OCR_PIPE_OPENER or stream.kind == "pagejoin":
        return
    for m in OCR_PIPE_GROUP_RE.finditer(stream.text):
        if any(a <= m.start() < b for a, b in spans):
            continue
        yield m.start(), m.start(1), m.end(1), True


def scan_stream(stream: Stream, rotations: Dict[int, int]) -> List[Match]:
    """Run the group regex over one stream and build matches."""
    matches: List[Match] = []
    for opener_pos, inner_start, inner_end, recovered in _group_matches(stream):
        if stream.kind == "pagejoin":
            # accept only groups straddling the join
            if not (opener_pos < stream.join_pos <= inner_end):
                continue
        opener = stream.chars[opener_pos]
        if stream.kind == "column" and stream.origin_chars is not None:
            # accept only groups opened inside the opening fragment
            if opener is None or id(opener) not in stream.origin_chars:
                continue
        inner = stream.text[inner_start:inner_end]
        group_chars = [c for c in stream.chars[inner_start:inner_end] if c is not None and not c.is_space]
        if not group_chars:
            continue
        line_keys = {(c.page, c.line) for c in group_chars}
        if len(line_keys) > MAX_GROUP_LINES:
            continue
        pages = {c.page for c in group_chars}
        group_text = normalise_text(inner)
        if opener is not None:
            group_key = (opener.page, opener.line, round(opener.bbox[0], 1), round(opener.bbox[1], 1))
        else:  # pragma: no cover - the opener is always a real char
            group_key = (group_text, min(pages))
        for s, e, seg_text in segment_group(inner):
            seg_chars = stream.chars[inner_start + s : inner_start + e]
            rects = rects_for_chars(seg_chars, rotations)
            if not rects:
                continue
            matches.append(
                Match(
                    text=seg_text,
                    rects=rects,
                    group_text=group_text,
                    kind=stream.kind,
                    multiline=len(line_keys) > 1,
                    crosspage=len(pages) > 1,
                    group_key=group_key,
                    recovered=recovered,
                )
            )
    return matches


# ---------------------------------------------------------------------------
# Step 4: document driver
# ---------------------------------------------------------------------------


@dataclass
class ScanStats:
    """Counters printed in the summary line.

    ``table`` counts groups found in table streams of either kind:
    ``cells`` = cells detected by ``page.find_tables`` (ruled tables),
    ``columns`` = column chains built with the horizontal-gap rule (unruled /
    OCR'd tables); the summary shows the breakdown after the total.
    """

    pages: int = 0
    groups: int = 0
    rows: int = 0
    multiline: int = 0
    crosspage: int = 0
    table: int = 0
    cells: int = 0
    columns: int = 0
    recovered: int = 0  # groups whose '[' was OCR'd as '|' (see OCR_PIPE_GROUP_RE)

    def summary(self) -> str:
        return (
            f"SMART: pages={self.pages} groups={self.groups} rows={self.rows} "
            f"multiline={self.multiline} crosspage={self.crosspage} table={self.table} "
            f"(cells={self.cells} columns={self.columns} recovered={self.recovered})"
        )


def scan_page(pd: PageData, rotations: Dict[int, int], prev_join: Optional[List[List[Fragment]]]) -> Tuple[List[Match], List[List[Fragment]]]:
    """Scan one extracted page.  Returns its matches and the lines kept for the
    join with the next page."""
    lines = body_lines(pd)
    body, footnotes = split_footnotes(pd, lines)
    streams: List[Stream] = [build_body_stream(body, footnotes=footnotes)]
    streams.extend(build_cell_streams(pd))
    streams.extend(build_column_streams(pd, lines))
    if prev_join:
        pj = build_pagejoin_stream(prev_join, join_lines(pd, body, tail=False))
        if pj is not None:
            streams.append(pj)
    matches: List[Match] = []
    for st in streams:
        matches.extend(scan_stream(st, rotations))
    return matches, join_lines(pd, body, tail=True)


def scan_document(doc: fitz.Document, stats: Optional[ScanStats] = None) -> List[Match]:
    """Scan a whole document; returns de-duplicated matches in page order.

    Two passes: the first collects cheap line signatures (running header /
    footer detection needs to see every page), the second extracts and scans
    one page at a time so that only the current page's characters -- plus the
    few lines kept for the page join -- are alive at any moment.
    """
    stats = stats if stats is not None else ScanStats()
    repeated = collect_line_signatures(doc)
    rotations: Dict[int, int] = {}
    all_matches: List[Match] = []
    prev_join: Optional[List[List[Fragment]]] = None
    n_pages = 0
    for i, page in enumerate(doc):
        n_pages += 1
        pd = extract_page(page, i + 1, repeated)
        rotations[pd.number] = pd.rotation
        matches, prev_join = scan_page(pd, rotations, prev_join)
        all_matches.extend(matches)
        del pd
    stats.pages = n_pages
    return dedupe_matches(all_matches, stats)


def dedupe_matches(matches: List[Match], stats: ScanStats) -> List[Match]:
    """Drop duplicate (text, rect) rows and fill in the statistics."""
    seen_rows = set()
    seen_groups = set()
    out: List[Match] = []
    for mt in matches:
        rects = []
        for r in mt.rects:
            key = (r.page, mt.text, r.x0, r.y0, r.x1, r.y1)
            if key in seen_rows:
                continue
            seen_rows.add(key)
            rects.append(r)
        if not rects:
            continue
        mt.rects = rects
        out.append(mt)
        # count each bracket group once (by the position of its opening bracket)
        gkey = mt.group_key or (mt.group_text, mt.rects[0].page, mt.rects[0].y0)
        if gkey not in seen_groups:
            seen_groups.add(gkey)
            stats.groups += 1
            if mt.multiline:
                stats.multiline += 1
            if mt.crosspage:
                stats.crosspage += 1
            if mt.kind in ("cell", "column"):
                stats.table += 1
                if mt.kind == "cell":
                    stats.cells += 1
                else:
                    stats.columns += 1
            if mt.recovered:
                stats.recovered += 1
        stats.rows += len(rects)
    out.sort(key=lambda mt: (mt.rects[0].page, mt.rects[0].y0, mt.rects[0].x0))
    return out


def matches_to_rows(matches: List[Match]) -> List[Tuple[int, str, float, float, float, float]]:
    """Flatten matches to CSV rows: (page, text, x0, y0, x1, y1)."""
    rows = []
    for mt in matches:
        for r in mt.rects:
            rows.append((r.page, mt.text, r.x0, r.y0, r.x1, r.y1))
    return rows
