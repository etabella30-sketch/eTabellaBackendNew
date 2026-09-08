import re
import html
import regex
from difflib import SequenceMatcher
from typing import List, Optional, Tuple

from fuzzysearch import find_near_matches
from rapidfuzz import fuzz, process
from rapidfuzz.fuzz import token_sort_ratio
from rapidfuzz.utils import default_process
import string
import wordninja
# ──────────────────────────────────────────────────────────────────────────────
#      CONFIGURATION / DEFAULTS
# ──────────────────────────────────────────────────────────────────────────────

DEFAULT_MAX_SPAN        = 2000
DEFAULT_EDGE_MAX_L_DIST = 3
SLIDING_WINDOW_SLACK    = 0.2
EDGE_THRESHOLD          = 65
TWO_PASS_THRESHOLD      = 75
WINDOW_THRESHOLD        = 80


# ──────────────────────────────────────────────────────────────────────────────
#      NORMALIZATION
# ──────────────────────────────────────────────────────────────────────────────

def normalize(s: str) -> str:
    """Lowercase, unescape HTML, unify quotes/ellipses, collapse whitespace/punctuation."""
    s = s.lower()
    s = html.unescape(s)
    s = s.replace('…', '...').replace('"', '"').replace('"', '"')
    s = regex.sub(r'\.{2,}', '.', s)
    s = regex.sub(r'\s+', ' ', s)
    return s.strip()


# ──────────────────────────────────────────────────────────────────────────────
#      EDGE‐SEARCH HELPERS
# ──────────────────────────────────────────────────────────────────────────────

def _edge_pos(
    text: str,
    key: str,
    *,
    search_from: int = 0,
    backwards: bool = False,
    max_l_dist: int = DEFAULT_EDGE_MAX_L_DIST
) -> Optional[Tuple[int, int]]:
    """
    Look for `key` in `text` exactly first, else fuzzy within max_l_dist.
    Returns (start, end) or None.
    """
    txt   = text.lower()
    k_l   = key.lower()
    if backwards:
        idx = txt.rfind(k_l, 0, search_from or len(txt))
    else:
        idx = txt.find(k_l, search_from)
    if idx != -1:
        return idx, idx + len(k_l)

    # fuzzy fallback
    window = txt[:search_from] if backwards else txt[search_from:]
    matches = find_near_matches(
        k_l, window,
        max_l_dist=max_l_dist,
        max_deletions=max_l_dist,
        max_insertions=max_l_dist,
        max_substitutions=max_l_dist
    )
    if not matches:
        return None

    m   = matches[-1] if backwards else matches[0]
    off = 0 if backwards else search_from
    return m.start + off, m.end + off


# ──────────────────────────────────────────────────────────────────────────────
#      TWO‐PASS BEST‐SCORE SPAN (REPLACES FIRST‐FOUND)
# ──────────────────────────────────────────────────────────────────────────────

def two_pass_best_span(
    text: str,
    phrase: str,
    n_start: int   = 6,
    n_end:   int   = 6,
    max_span: int = DEFAULT_MAX_SPAN
) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    """
    Collect *all* viable start/end anchors (fuzzy up to DEFAULT_EDGE_MAX_L_DIST),
    then pick the (s,e) whose token_sort_ratio(snippet, phrase) is highest.
    Returns (best_start, best_end, result)
    """
    cleaned = phrase
    words   = cleaned.split()

    start_indices: List[int] = []
    for k in range(min(n_start, len(words)), 0, -1):
        key = " ".join(words[:k])
        pos = _edge_pos(text, key, max_l_dist=DEFAULT_EDGE_MAX_L_DIST)
        if pos:
            start_indices.append(pos[0])

    end_indices: List[int] = []
    for k in range(min(n_end, len(words)), 0, -1):
        key = " ".join(words[-k:])
        pos = _edge_pos(text, key, backwards=True, max_l_dist=DEFAULT_EDGE_MAX_L_DIST)
        if pos:
            end_indices.append(pos[1])

    start_indices = list(dict.fromkeys(start_indices))
    end_indices   = list(dict.fromkeys(end_indices))
    start_indices = sorted(set(start_indices))
    end_indices   = sorted(set(end_indices))
    best_score = 0
    best_span  = None

    for s in start_indices:
        for e in end_indices:
            if e > s and (max_span <= 0 or e - s <= max_span):
                snippet = text[s:e]
                score   = token_sort_ratio(normalize(snippet), cleaned)
                if score > best_score:
                    best_score = score
                    best_span  = (s, e)

    if best_span and best_score >= TWO_PASS_THRESHOLD:
        s, e = best_span
        return s, e, text[s:e].strip()
    return None, None, None


# ──────────────────────────────────────────────────────────────────────────────
#      TRIM‐USING‐START/END RELAXED (BACKPORT of original, but iteratively)
# ──────────────────────────────────────────────────────────────────────────────

# def get_precise_fuzzy_span(
#     text: str,
#     needle: str,
#     threshold: float = EDGE_THRESHOLD
# ) -> Tuple[Optional[int], Optional[int]]:
#     """
#     Simple fuzzy sliding‐window over processed text to find the best (i,j).
#     Returns (None, None) if best_score < threshold.
#     """
#     proc_text   = default_process(text)
#     proc_needle = default_process(needle)
#     best_score  = -1
#     best_span   = (0, len(proc_text))
#     n, m        = len(proc_text), len(proc_needle)
#     for i in range(n):
#         for j in range(i + m, n + 1):
#             score = fuzz.partial_ratio(proc_text[i:j], proc_needle)
#             if score > best_score:
#                 best_score = score
#                 best_span  = (i, j)
#     if best_score < threshold:
#         return None, None
#     # build exact raw→proc mapping for accurate position tracking
#     proc_to_raw: List[int] = []
#     proc_idx = 0
#     for raw_idx, ch in enumerate(text):
#         processed_ch = default_process(ch)
#         if processed_ch:  # Only if character produces processed output
#             for _ in processed_ch:
#                 if proc_idx < len(proc_text):
#                     proc_to_raw.append(raw_idx)
#                     proc_idx += 1
#     # Ensure we have enough mappings
#     while len(proc_to_raw) < len(proc_text):
#         proc_to_raw.append(len(text) - 1)
#     # Map processed positions back to raw positions
#     i_proc = best_span[0]
#     j_proc = best_span[1] - 1
#     j_proc = max(0, min(j_proc, len(proc_to_raw) - 1))

#     i_raw = proc_to_raw[i_proc] if i_proc < len(proc_to_raw) else 0
#     j_raw = proc_to_raw[j_proc] + 1 if j_proc < len(proc_to_raw) else len(text)
#     # extend to end of word if needed
#     m = re.match(r'[^\w\s]*', text[j_raw:])
#     if m:
#         j_raw += m.end()
#     return i_raw, j_raw

def get_precise_fuzzy_span(
    text: str,
    needle: str,
    threshold: float = EDGE_THRESHOLD
) -> Tuple[Optional[int], Optional[int]]:
    """
    Faster fuzzy substring search with raw->processed mapping.
    Uses a limited sliding window based on needle length.
    """
    proc_text   = default_process(text)
    proc_needle = default_process(needle)
    n, m        = len(proc_text), len(proc_needle)

    if m == 0 or n == 0:
        return None, None

    # Limit window sizes to around the needle length
    tolerance = max(3, int(m * 0.3))  # 30% size variation
    min_len = max(1, m - tolerance)
    max_len = min(n, m + tolerance)

    best_score = -1
    best_span  = (0, 0)

    for i in range(n - min_len + 1):
        for length in range(min_len, max_len + 1):
            j = i + length
            if j > n:
                break
            score = fuzz.partial_ratio(proc_text[i:j], proc_needle)
            if score > best_score:
                best_score = score
                best_span = (i, j)

    if best_score < threshold:
        return None, None

    # --- raw → processed mapping ---
    proc_to_raw: List[int] = []
    proc_idx = 0
    for raw_idx, ch in enumerate(text):
        processed_ch = default_process(ch)
        if processed_ch:
            for _ in processed_ch:
                if proc_idx < len(proc_text):
                    proc_to_raw.append(raw_idx)
                    proc_idx += 1

    while len(proc_to_raw) < len(proc_text):
        proc_to_raw.append(len(text) - 1)

    i_proc, j_proc = best_span[0], best_span[1] - 1
    j_proc = max(0, min(j_proc, len(proc_to_raw) - 1))

    i_raw = proc_to_raw[i_proc] if i_proc < len(proc_to_raw) else 0
    j_raw = proc_to_raw[j_proc] + 1 if j_proc < len(proc_to_raw) else len(text)

    # Extend to include trailing punctuation
    m = re.match(r'[^\w\s]*', text[j_raw:])
    if m:
        j_raw += m.end()

    return i_raw, j_raw

def trim_using_start_end_fuzzy_relaxed(
    text: str,
    phrase: str,
    max_start_words: int = 6,
    max_end_words:   int = 8
) -> Tuple[Optional[int], Optional[int], str]:
    """
    Iteratively drop front words until a fuzzy‐start matches, then
    drop back words until a fuzzy‐end matches, then stitch.
    Returns (best_start, best_end, result)
    """
    words = phrase.strip().split()
    # find start
    s_start = s_end = None
    for k in range(min(max_start_words, len(words)), 0, -1):
        start_part = " ".join(words[:k])
        s = get_precise_fuzzy_span(text, start_part, threshold=EDGE_THRESHOLD)
        if None not in s:
            s_start, s_end = s
            break
    if s_start is None:
        return None, None, "❌ start edge not found"
    # find end
    e_start = e_end = None
    for k in range(min(max_end_words, len(words)), 0, -1):
        end_part = " ".join(words[-k:])
        e = get_precise_fuzzy_span(text, end_part, threshold=EDGE_THRESHOLD)
        if None not in e:
            e_start, e_end = e
            break
    if e_start is None:
        return None, None, "❌ end edge not found"

    start = min(s_start, e_start)
    end   = max(s_end,   e_end)
    return start, end, text[start:end].strip()


# ──────────────────────────────────────────────────────────────────────────────
#      PROGRESSIVE / ALIGNMENT FALLBACKS (from original)
# ──────────────────────────────────────────────────────────────────────────────

def clean_phrase_for_matching_old(phrase: str) -> str:
    cleaned = re.sub(r'\s*\^\^?\s*', ' ', phrase)
    cleaned = re.sub(r'\^+\s*', ' ', phrase)
    return ' '.join(cleaned.split())

def clean_phrase_for_matching(phrase: str) -> str:
    """
    Remove inline ‘^word’ annotations, collapse whitespace,
    and trim trailing punctuation.
    """
    cleaned = re.sub(r'\^[\w\-\']+\)?\.?', ' ', phrase)   # ← NEW
    cleaned = re.sub(r'\s*\^\^?\s*', ' ', cleaned)        # existing rule
    cleaned = ' '.join(cleaned.split())
    return cleaned.rstrip(string.punctuation + ' ')



def get_word_tokens(text: str) -> List[Tuple[str,int,int]]:
    tokens = []
    pattern = r"\b[\w'-]+\b|[.,:;!?\"']"
    for match in re.finditer(pattern, text):
        tokens.append((match.group(), match.start(), match.end()))
    return tokens

def find_best_match_with_tokens(
    tokens: List[Tuple[str,int,int]],
    target_words: List[str],
    max_word_dist: int = 2
) -> Optional[Tuple[int,int]]:
    if not tokens or not target_words:
        return None
    target = [w.lower() for w in target_words]
    best = None
    best_score = 0.0

    for i in range(len(tokens) - len(target) + 1):
        window = [tokens[j][0].lower() for j in range(i, min(i + len(target) + max_word_dist, len(tokens)))]
        score, matches = 0.0, []
        for ti, tw in enumerate(target):
            best_word_score, best_idx = 0, None
            for wi, ww in enumerate(window):
                if wi in matches: continue
                ws = fuzz.ratio(ww, tw)
                if ws > best_word_score:
                    best_word_score, best_idx = ws, wi
            if best_idx is not None and best_word_score >= 80:
                matches.append(best_idx)
                score += best_word_score
        if matches:
            avg = score / len(target)
            if avg > best_score:
                best_score = avg
                start_pos = tokens[i][1]
                end_token = i + max(matches)
                end_pos = tokens[min(end_token, len(tokens)-1)][2]
                best = (start_pos, end_pos)
    return best

def expand_to_punctuation(text: str, start: int, end: int) -> Tuple[int,int]:
    while end < len(text) and text[end] in '.!?"\')':
        end += 1
    return start, end

def refine_by_progressive_matching(text: str, phrase: str, coarse: str, coarse_start: int = 0) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    """
    Returns (best_start, best_end, result)
    """
    cleaned = clean_phrase_for_matching(phrase)
    tokens  = get_word_tokens(coarse)
    words   = cleaned.split()
    # try various start/end splits...
    for start_n in range(min(10, len(words)), 2, -1):
        for end_n in range(min(10, len(words)), 2, -1):
            s_match = find_best_match_with_tokens(tokens, words[:start_n])
            e_match = find_best_match_with_tokens(tokens, words[-end_n:])
            if s_match and e_match:
                s0, _ = s_match
                _, e1 = e_match
                if s0 < e1:
                    s0,e1 = expand_to_punctuation(coarse, s0,e1)
                    # Adjust positions relative to original text
                    abs_start = coarse_start + s0
                    abs_end = coarse_start + e1
                    return abs_start, abs_end, coarse[s0:e1].strip()
    full = find_best_match_with_tokens(tokens, words, max_word_dist=3)
    if full:
        s0,e1 = expand_to_punctuation(coarse, full[0], full[1])
        abs_start = coarse_start + s0
        abs_end = coarse_start + e1
        return abs_start, abs_end, coarse[s0:e1].strip()
    return None, None, None

def refine_with_alignment(text: str, phrase: str, coarse: str, coarse_start: int = 0) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    """
    Returns (best_start, best_end, result)
    """
    cleaned = clean_phrase_for_matching(phrase).lower()
    matcher = SequenceMatcher(None, coarse.lower(), cleaned)
    blocks  = matcher.get_matching_blocks()
    if not blocks:
        return None, None, None
    best_block = max(blocks, key=lambda b: b.size)
    if best_block.size < len(cleaned)*0.5:
        return None, None, None
    s = best_block.a
    e = best_block.a + best_block.size
    while s > 0 and coarse[s-1].isalnum():
        s -= 1
    while e < len(coarse) and coarse[e].isalnum():
        e += 1
    # Adjust positions relative to original text
    abs_start = coarse_start + s
    abs_end = coarse_start + e
    return abs_start, abs_end, coarse[s:e].strip()


# ──────────────────────────────────────────────────────────────────────────────
#      SLIDING‑WINDOW FALLBACK
# ──────────────────────────────────────────────────────────────────────────────

def best_window_match(text: str, phrase: str, slack: float = SLIDING_WINDOW_SLACK) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    """
    Returns (best_start, best_end, result)
    """
    t = normalize(phrase)
    L = len(t)
    lo = int(L*(1-slack))
    hi = int(L*(1+slack))
    best = (0, None, None, None)  # (score, start, end, text)
    for i in range(0, len(text) - lo):
        for length in (lo, hi):
            j = i + length
            if j > len(text):
                continue
            snippet = normalize(text[i:j])
            score   = fuzz.partial_ratio(snippet, t)
            if score > best[0]:
                best = (score, i, j, text[i:j])
    if best[0] >= WINDOW_THRESHOLD:
        return best[1], best[2], best[3].strip()
    return None, None, None


# ──────────────────────────────────────────────────────────────────────────────
#      MAIN INTEGRATED PIPELINE
# ──────────────────────────────────────────────────────────────────────────────

def refine_by_fuzzy_edges_advanced_with_patch(text: str, phrase: str) -> Tuple[Optional[int], Optional[int], str]:
    """
    Main function that returns (best_start, best_end, result)
    """
    # Work with original text for position accuracy, normalize only for matching
    raw = text
    phr_n = clean_phrase_for_matching(normalize(phrase))
    phr_n = segment_first_last(phr_n)
    # 2) try robust two‑pass scoring on original text
    two_start, two_end, two_result = two_pass_best_span(raw, phr_n)
    if two_result:
        return two_start, two_end, two_result
    # 3) try start/end relaxed on original text  
    coarse_start, coarse_end, coarse = trim_using_start_end_fuzzy_relaxed(raw, phr_n)
    if not coarse.startswith("❌"):
        # 4) progressive + alignment refinements
        out1_start, out1_end, out1 = refine_by_progressive_matching(raw, phr_n, coarse, coarse_start or 0)
        out2_start, out2_end, out2 = refine_with_alignment(raw, phr_n, coarse, coarse_start or 0)
        candidates = []
        if out1:
            candidates.append((fuzz.ratio(normalize(out1), phr_n), len(out1), out1_start, out1_end, out1))
        if out2:
            candidates.append((fuzz.ratio(normalize(out2), phr_n), len(out2), out2_start, out2_end, out2))
        if coarse_start is not None and coarse_end is not None:
            candidates.append((fuzz.ratio(normalize(coarse), phr_n), len(coarse), coarse_start, coarse_end, coarse))
        if candidates:
            candidates.sort(key=lambda t: (t[0], -abs(t[1] - len(phr_n))), reverse=True)
            best = candidates[0]
            return best[2], best[3], best[4].strip()
    # 5) sliding‑window final fallback on original text
    win_start, win_end, win_result = best_window_match(raw, phr_n)
    if win_result:
        return win_start, win_end, win_result
    # 6) absolute fallback
    fallback_result = coarse if coarse else raw[: len(phrase) + 50].strip()
    if coarse_start is not None and coarse_end is not None:
        return coarse_start, coarse_end, fallback_result
    else:
        return 0, len(phrase) + 50, fallback_result
    
    
def segment_first_last(p: str) -> str:
    """
    Segment only the first and last word of a phrase using wordninja,
    preserving spaces. 
    Skip segmentation if the word has special characters.
    """
    words = p.split()
    if not words:
        return p  # Return original if empty

    segmented = []

    # Regex to detect special characters (non-alphanumeric)
    special_char_pattern = re.compile(r'[^a-zA-Z0-9]')

    for i, word in enumerate(words):
        # Check if first or last word
        if i == 0 or i == len(words) - 1:
            # Skip if contains special char
            if special_char_pattern.search(word):
                segmented.append(word)
            # Otherwise, segment long alphabetic words
            elif len(word) >= 8 and word.isalpha():
                segmented.extend(wordninja.split(word))
            else:
                segmented.append(word)
        else:
            # Middle words remain unchanged
            segmented.append(word)

    return " ".join(segmented)