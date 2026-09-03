from __future__ import annotations
import re
from typing import Optional, Tuple, List
from rapidfuzz.fuzz import WRatio as score
from helper import clean_snippet, segment_first_last, refine_span_with_edge_repair

# Edge metrics (module-level)
LAST_EDGE_COUNTS: Optional[dict] = None

def get_last_edge_counts() -> Optional[dict]:
    return LAST_EDGE_COUNTS

# ========== CONFIG (minimal) ==========
VERBOSE = True              # print high-level debug
N_START = 5                 # initial start anchor size (snippet tokens)
N_END = 4                   # initial end anchor size (snippet tokens)
THRESH = 70                 # fuzzy WRatio threshold for anchors
PAD_START = 0               # pad text tokens before start anchor window
PAD_END = 3                 # pad text tokens after end anchor window
# =====================================

def dbg(msg: str):
    if VERBOSE:
        print(msg)

# ---------- Utilities ----------
def tokenize(s: str) -> list:
    # allow words with & and - to stay intact
    return re.findall(r"[\w&-]+", s)

def get_offsets_and_words(text: str) -> tuple:
    pattern = re.compile(r"[\w&-]+")
    offsets = [m.start() for m in pattern.finditer(text)]
    words = [m.group() for m in pattern.finditer(text)]
    return offsets, words

def find_best_anchor(text_words: List[str], anchor: str, length: int, scorer, reverse: bool = False):
    """
    Slide a window of 'length' words across text_words and score "anchor" against the window string.
    Returns best_score, best_index, best_anchor_string, best_window_string
    """
    best_sc, best_i = 0.0, None
    ba, bw = None, None
    indices = range(len(text_words) - length + 1)
    if reverse:
        indices = reversed(list(indices))
    for i in indices:
        window = " ".join(text_words[i : i + length])
        sc = scorer(anchor, window)
        if sc > best_sc:
            best_sc, best_i, ba, bw = sc, i, anchor, window
    return best_sc, best_i, ba, bw

def map_word_indices_to_char_span(start_idx: int, end_idx: int, offsets: List[int], words: List[str], text_length: int):
    if start_idx >= len(offsets):
        return None, None
    span_start = offsets[start_idx]
    # Ensure end_idx is valid before accessing words[end_idx]
    if end_idx >= len(offsets):
        span_end = text_length
    else:
        span_end = offsets[end_idx] + len(words[end_idx])
    return span_start, span_end

def _effective_anchor_sizes(snippet_tokens: int) -> tuple[int, int]:
    if snippet_tokens >= 6:
        return N_START, N_END
    if snippet_tokens >= 4:
        return min(N_START, 2), min(N_END, 2)
    if snippet_tokens == 3:
        return min(N_START, 2), 1
    if snippet_tokens == 2:
        return 1, 1
    return 1, 0

# ---------- Adaptive-only matcher ----------


def fuzzy_anchor_edges_only(
    text: str,
    snippet: str,
) -> Optional[Tuple[int, int]]:
    """
    Edges-only matcher:
    - Use ONLY the adaptive start/end anchor loops to locate token indices.
    - Map raw token indices directly to character span with NO padding and NO trimming.
    - Ignore middle words entirely; only starting and ending edges matter.
    """
    global LAST_EDGE_COUNTS
    snippet = segment_first_last(snippet)
    tw = tokenize(text)
    sw = tokenize(clean_snippet(snippet))
    dbg(f"[edges-only:init] text_tokens={len(tw)} snippet_tokens={len(sw)}")


    if not sw:
        dbg("[edges-only:init] empty snippet after cleaning")
        return None

    n_start_eff, n_end_eff = _effective_anchor_sizes(len(sw))
    dbg(f"[edges-only:init] effective anchors: n_start={n_start_eff}, n_end={n_end_eff}")

    step = 1
    max_retries = 6
    threshold = THRESH

    # --- Start anchor adaptive (record accepted window size) ---
    n_start = n_start_eff
    ps = None
    accepted_n_start = None
    accepted_start_drop = None
    for retry in range(max_retries):
        if len(sw) < n_start or n_start == 0:
            break
        drop_words = min(retry, len(sw) - n_start)
        anchor_words = sw[drop_words : drop_words + n_start]
        starts_phrase = " ".join(anchor_words)
        bs, ps_raw, _, _ = find_best_anchor(tw, starts_phrase, n_start, score)
        dbg(f"[edges-only:start] try={retry} n_start={n_start} drop={drop_words} score={bs:.1f} ps_raw={ps_raw} anchor={starts_phrase!r}")
        if ps_raw is not None:
            ps = max(0, ps_raw - drop_words)
        if bs >= threshold and ps is not None:
            accepted_n_start = n_start
            accepted_start_drop = drop_words
            dbg(f"[edges-only:start] anchored at token {ps} (n_start={n_start})")
            break
        n_start += step
    else:
        dbg("[edges-only:start] failed to reach threshold")
        ps = None

    # Fallback: wide-drop scan with fixed window when start-anchor fails
    if ps is None:
        anchor_len = max(1, n_start_eff)
        max_drop = min(64, max(0, len(sw) - anchor_len))
        dbg(f"[edges-only:start-fallback] scanning drop in [0..{max_drop}] with anchor_len={anchor_len}")
        for drop in range(0, max_drop + 1):
            anchor_words = sw[drop : drop + anchor_len]
            if not anchor_words:
                break
            starts_phrase = " ".join(anchor_words)
            bs, ps_raw, _, _ = find_best_anchor(tw, starts_phrase, anchor_len, score)
            dbg(f"[edges-only:start-fallback] drop={drop} score={bs:.1f} ps_raw={ps_raw} anchor={starts_phrase!r}")
            if ps_raw is not None and bs >= threshold:
                ps = max(0, ps_raw - drop)
                accepted_n_start = anchor_len
                accepted_start_drop = drop
                dbg(f"[edges-only:start-fallback] anchored at token {ps} (drop={drop})")
                break

    # --- End anchor adaptive (record accepted window size) ---
    n_end = n_end_eff
    pe = None
    accepted_n_end = None
    if n_end > 0:
        for retry in range(max_retries):
            if len(sw) < n_end:
                break
            end_anchor_words = sw[-n_end:]
            ends_phrase = " ".join(end_anchor_words)
            be, pe_raw, _, _ = find_best_anchor(tw, ends_phrase, n_end, score, reverse=True)
            dbg(f"[edges-only:end] try={retry} n_end={n_end} score={be:.1f} pe_raw={pe_raw} anchor={ends_phrase!r}")
            if be >= threshold and pe_raw is not None:
                pe = pe_raw
                accepted_n_end = n_end
                dbg(f"[edges-only:end] anchored ending at token index {pe} (n_end={n_end})")
                break
            n_end += step
        else:
            dbg("[edges-only:end] failed to reach threshold")

    # Fallback: wide-drop scan over expected suffix when end-anchor fails (bounded)
    if pe is None and n_end_eff > 0:
        anchor_len_end = max(1, n_end_eff)
        max_drop_end = min(8, max(0, len(sw) - anchor_len_end))
        dbg(f"[edges-only:end-fallback] scanning drop_end in [0..{max_drop_end}] with anchor_len={anchor_len_end}")
        for drop in range(0, max_drop_end + 1):
            start_idx2 = max(0, len(sw) - (drop + anchor_len_end))
            end_idx2 = len(sw) - drop
            end_anchor_words2 = sw[start_idx2:end_idx2]
            if not end_anchor_words2:
                break
            ends_phrase2 = " ".join(end_anchor_words2)
            be2, pe_raw2, _, _ = find_best_anchor(tw, ends_phrase2, anchor_len_end, score, reverse=True)
            dbg(f"[edges-only:end-fallback] drop={drop} score={be2:.1f} pe_raw={pe_raw2} anchor={ends_phrase2!r}")
            if pe_raw2 is not None and be2 >= threshold:
                pe = pe_raw2
                accepted_n_end = anchor_len_end
                dbg(f"[edges-only:end-fallback] anchored ending at token index {pe} (drop={drop})")
                break

    if ps is None and pe is None:
        dbg("[edges-only:result] no anchors found")
        return None

    # Guard: if both anchors found but end-window starts before start anchor, re-anchor end ≥ ps
    if ps is not None and pe is not None and accepted_n_end is not None and pe < ps:
        ends_phrase_guard = " ".join(sw[-accepted_n_end:]) if accepted_n_end > 0 else None
        if ends_phrase_guard:
            best_sc2, best_i2 = 0.0, None
            # constrain end-window starts to indices ≥ ps
            limit = len(tw) - accepted_n_end + 1
            for i in range(ps, max(ps, limit)):
                window = " ".join(tw[i : i + accepted_n_end])
                sc2 = score(ends_phrase_guard, window)
                if sc2 > best_sc2:
                    best_sc2, best_i2 = sc2, i
            if best_i2 is not None and best_sc2 >= threshold:
                dbg(f"[edges-only:guard] re-anchored end at token index {best_i2} (n_end={accepted_n_end}, score={best_sc2:.1f})")
                pe = best_i2
            else:
                # Conflict: end anchor starts before start. Decide which anchor to prefer.
                s_ok = (accepted_n_start is not None) and (accepted_start_drop is not None) and (ps is not None)
                e_ok = (accepted_n_end is not None) and (pe is not None)
                prefer_end = False
                if s_ok and e_ok:
                    starts_phrase_guard = " ".join(sw[accepted_start_drop : accepted_start_drop + accepted_n_start])
                    window_start = " ".join(tw[ps : ps + accepted_n_start])
                    window_end = " ".join(tw[pe : pe + accepted_n_end])
                    try:
                        sscore = score(starts_phrase_guard, window_start)
                    except Exception:
                        sscore = 0.0
                    try:
                        escore = score(ends_phrase_guard, window_end)
                    except Exception:
                        escore = 0.0
                    if escore >= threshold and (escore - sscore >= 8 or escore >= 90):
                        prefer_end = True
                if prefer_end:
                    dbg("[edges-only:guard] prefer END anchor (higher confidence); dropping start")
                    ps = None
                else:
                    dbg("[edges-only:guard] dropping end anchor (no valid end ≥ start)")
                    pe = None
                    accepted_n_end = None

    # --- Map raw token indices directly to char span (no padding) ---
    offsets, text_words = get_offsets_and_words(text)
    text_len = len(text)

    # Determine token start index
    if ps is not None:
        start_idx = max(0, ps)
    else:
        # If only end is available, start at the beginning of the end-phrase window
        start_idx = max(0, pe)

    # Determine token end index (index of the last word included)
    if pe is not None:
        last_word_idx = min(len(offsets) - 1, pe + max(accepted_n_end or 1, 1) - 1)
    else:
        # If only start is available, end at the end of the start-phrase window
        last_word_idx = min(len(offsets) - 1, start_idx + max(accepted_n_start or 1, 1) - 1)

    span_start, span_end = map_word_indices_to_char_span(start_idx, last_word_idx, offsets, text_words, text_len)
    if span_start is None:
        return None
    if span_end <= span_start:
        span_end = min(text_len, span_start + 1)

    # Compute edge counts: missing/extra at start/end (edges-only semantics)
    if ps is not None and accepted_start_drop is not None:
        missing_start = accepted_start_drop
    else:
        missing_start = len(sw)
    extra_start = 0
    missing_end = 0 if pe is not None else n_end_eff
    extra_end = 0
    LAST_EDGE_COUNTS = {
        "missing_start": int(missing_start),
        "extra_start": int(extra_start),
        "missing_end": int(missing_end),
        "extra_end": int(extra_end),
    }

    dbg(f"[edges-only:final] token_span=({start_idx},{last_word_idx}) -> chars ({span_start},{span_end}) → {text[span_start:span_end]!r}")
    return span_start, span_end

def refine_by_fuzzy_edges_advanced_with_patch(text: str, snippet: str, *, window: int = 12, silent: bool = True) -> Tuple[Optional[int], Optional[int], str]:
    """
    Pure helper that returns (final_start, final_end, final_snip.strip()).
    Uses edges-only anchoring + edge repair. No prints or file I/O.
    Mirrors run_usecases afterremove semantics, including no-anchors.
    """
    global VERBOSE
    prev_verbose = VERBOSE
    try:
        if silent:
            VERBOSE = False
        res = fuzzy_anchor_edges_only(text, snippet)
    finally:
        VERBOSE = prev_verbose

    if not res:
        repair = refine_span_with_edge_repair(text, snippet, None, None, window=window)
        span = repair.get("afterremove_span") or [None, None]
        s2 = span[0] if isinstance(span, (list, tuple)) and len(span) == 2 else None
        e2 = span[1] if isinstance(span, (list, tuple)) and len(span) == 2 else None
        final_snip = repair.get("afterremove", "") or ""
        return s2, e2, final_snip.strip()

    s, e = res
    repair = refine_span_with_edge_repair(text, snippet, s, e, window=window)
    span = repair.get("afterremove_span") or [s, e]
    s2 = int(span[0]) if isinstance(span, (list, tuple)) and len(span) == 2 else s
    e2 = int(span[1]) if isinstance(span, (list, tuple)) and len(span) == 2 else e
    final_snip = repair.get("afterremove", text[s2:e2]) or ""
    return s2, e2, final_snip.strip()
