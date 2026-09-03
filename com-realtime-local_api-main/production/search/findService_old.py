from __future__ import annotations
import html, re, string
from concurrent.futures import ThreadPoolExecutor, as_completed
from difflib import SequenceMatcher
from typing import List, Optional, Tuple, Dict

import regex  # fuzzysearch deps
from fuzzysearch import find_near_matches  # type: ignore
from rapidfuzz import fuzz  # type: ignore
import wordninja  # type: ignore

# ----------------------------------------------------------------------------------
# Globals & thresholds
DEFAULT_MAX_SPAN = 2000
DEFAULT_EDGE_MAX_L_DIST = 3
SLIDING_WINDOW_SLACK = 0.2
EDGE_THRESHOLD = 65
TWO_PASS_THRESHOLD = 75
WINDOW_THRESHOLD = 80
BACKTRACK_LIMIT = 400

URL_RE   = re.compile(r"https?://\S+", re.I)
HASH_RE  = re.compile(r"vm[0-9a-f]{10,}", re.I)

# raw = text
# raw = text.replace('"', ' ').replace("“", " ").replace("”", " ")
# raw = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', raw)
# raw = re.sub(r'http[s]?://[^\s]+', ' ', raw)
# #raw = re.sub(r'https?://\S+', '', text)
# raw = re.sub(r'http[s]?://[^\s]+', ' ', raw)  # Clean URLs from source
# raw = re.sub(r'\s+', ' ', raw)  # Collapse whitespace
# phr_clean = clean_phrase_for_matching(normalize(phrase))
# phr_seg = segment_first_last(phr_clean)

def scrub_noise(s: str) -> str:
    """Remove URLs & long meeting‑hash tokens."""
    return HASH_RE.sub(" ", URL_RE.sub(" ", s))


def normalize(s: str) -> str:
    """Lowercase, unescape entities, collapse ellipses & whitespace, strip URLs."""
    s = scrub_noise(s)
    s = regex.sub(r'(?<=[a-z])(?=[A-Z])', ' ', s)
    s = s.lower()
    s = html.unescape(s)
    s = s.replace("…", "...")
    s = regex.sub(r"\.{2,}", ".", s)
    s = regex.sub(r"\s+", " ", s)
    s = s.replace('"', "").replace("“", "").replace("”", "")
    return s.strip()




# ----------------------------------------------------------------------------------
# --------------  Edge‑finding primitives (unchanged except scrubbing) --------------

def clean_phrase_for_matching(phrase: str) -> str:
    cleaned = re.sub(r"\^[\w\-']+\)?\.?", " ", phrase)
    cleaned = re.sub(r"\s*\^.*?(\s|$)", " ", cleaned)
    return " ".join(cleaned.split()).rstrip(string.punctuation + " ")

def get_word_tokens(text: str) -> List[Tuple[str, int, int]]:
    """Tokenise `text` into words and punctuation with positions."""
    tokens: List[Tuple[str, int, int]] = []
    pattern = r"\\b[\\w'-]+\\b|[.,:;!?\\\"']"
    for match in re.finditer(pattern, text):
        tokens.append((match.group(), match.start(), match.end()))
    return tokens












def hybrid_score(snip: str, target: str) -> float:
    """0.6 * token_sort + 0.4 * coverage."""
    sim = fuzz.token_sort_ratio(snip, target)
    tgt_words = set(target.split())
    if not tgt_words:
        return sim
    cov = len(tgt_words & set(snip.split())) / len(tgt_words) * 100
    return 0.6 * sim + 0.4 * cov





def segment_first_last(p: str) -> str:
    words = p.split()
    if not words:
        return p
    seg: List[str] = []
    special = re.compile(r"[^a-zA-Z0-9]")
    for i, word in enumerate(words):
        if i in {0, len(words) - 1} and len(word) >= 8 and word.isalpha() and not special.search(word):
            seg.extend(wordninja.split(word))
        else:
            seg.append(word)
    return " ".join(seg)


def _edge_pos(
    text: str,
    key: str,
    *,
    search_from: int = 0,
    backwards: bool = False,
    max_l_dist: int = DEFAULT_EDGE_MAX_L_DIST,
) -> Optional[Tuple[int, int]]:
    """Find the position of `key` in `text` using exact then fuzzy matching."""
    txt = text.lower()
    k_l = key.lower()
    if backwards:
        idx = txt.rfind(k_l, 0, search_from or len(txt))
    else:
        idx = txt.find(k_l, search_from)
    if idx != -1:
        return idx, idx + len(k_l)
    window = txt[:search_from] if backwards else txt[search_from:]
    matches = find_near_matches(
        k_l,
        window,
        max_l_dist=max_l_dist,
        max_deletions=max_l_dist,
        max_insertions=max_l_dist,
        max_substitutions=max_l_dist,
    )
    if not matches:
        return None
    m = matches[-1] if backwards else matches[0]
    off = 0 if backwards else search_from
    return m.start + off, m.end + off

def two_pass_best_span(text: str, phrase: str, n_start: int = 6, n_end: int = 6, max_span: int = DEFAULT_MAX_SPAN) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    cleaned = phrase
    words = cleaned.split()
    target_norm = normalize(cleaned)
    norm_cache: Dict[Tuple[int, int], str] = {}
    
    # --- Start of refined anchor finding ---
    start_indices: List[int] = []
    # First, try to find anchors from the absolute beginning of the phrase
    for k in range(min(n_start, len(words)), 1, -1): # require at least 2 words
        key = " ".join(words[:k])
        pos = _edge_pos(text, key, max_l_dist=DEFAULT_EDGE_MAX_L_DIST)
        if pos:
            start_indices.append(pos[0])

    # NEW: If the above search yields no good results, try finding an anchor
    # starting a few words into the phrase. This handles truncated text.
    if not start_indices:
        # Try offsetting the start anchor by 1 to 4 words
        for offset in range(1, min(5, len(words) - n_start)):
            for k in range(min(n_start, len(words) - offset), 1, -1):
                key = " ".join(words[offset:offset+k])
                pos = _edge_pos(text, key, max_l_dist=DEFAULT_EDGE_MAX_L_DIST)
                if pos:
                    start_indices.append(pos[0])
            if start_indices:  # As soon as we find any anchors, stop trying more offsets
                break
    # --- End of refined anchor finding ---

    MAX_ANCHORS = 8
    start_indices = sorted(set(start_indices))[:MAX_ANCHORS]
    
    end_indices: List[int] = []
    for k in range(min(n_end, len(words)), 1, -1):
        key = " ".join(words[-k:])
        pos = _edge_pos(text, key, backwards=True, max_l_dist=DEFAULT_EDGE_MAX_L_DIST)
        if pos:
            end_indices.append(pos[1])
            
    end_indices = sorted(set(end_indices))[-MAX_ANCHORS:]
    if not end_indices:
        end_indices = [len(text)] 

    # print(f"[DEBUG] Start indices: {start_indices}")
    # print(f"[DEBUG] End indices: {end_indices}")

    best_score = 0.0
    best_span = None
    
    for s in start_indices:
        for e in end_indices:
            if e > s and (max_span <= 0 or e - s <= max_span):
                key_pair = (s, e)
                n_snip = norm_cache.get(key_pair)
                if n_snip is None:
                    n_snip = normalize(text[s:e])
                    norm_cache[key_pair] = n_snip
                
                # Using the more robust hybrid_score is still recommended
                score = hybrid_score(n_snip, target_norm)
                
                if score > best_score:
                    best_score = score
                    best_span = (s, e)
    if best_span is not None:
        #print(f"[DEBUG] Best span text: {text[best_span[0]:best_span[1]]!r}")
        if best_score >= TWO_PASS_THRESHOLD:
            s, e = best_span
            #print(f"\n\n\n[DEBUG] Best span found: {s}, {e} with score {best_score:.2f}")
            return s, e, text[s:e].strip()
        
    return None, None, None



def get_precise_fuzzy_span(text: str, needle: str, max_l_dist: int = DEFAULT_EDGE_MAX_L_DIST) -> Tuple[Optional[int], Optional[int]]:
    if not needle:
        return None, None
    matches = find_near_matches(
        needle.lower(), text.lower(),
        max_l_dist=max_l_dist,
        max_deletions=max_l_dist,
        max_insertions=max_l_dist,
        max_substitutions=max_l_dist
    )
    if not matches:
        return None, None
    best = min(matches, key=lambda m: (m.dist, m.end - m.start))
    return best.start, best.end


def trim_using_start_end_fuzzy_relaxed(
    text: str,
    phrase: str,
    max_start_words: int = 6,
    max_end_words: int = 8,
) -> Tuple[Optional[int], Optional[int], str]:
    """Trim the search window around the phrase by fuzzily locating the beginning and end."""
    words = phrase.strip().split()
    s_start = s_end = None
    for k in range(min(max_start_words, len(words)), 0, -1):
        start_part = " ".join(words[:k])
#        s = get_precise_fuzzy_span(text, start_part, threshold=EDGE_THRESHOLD)
        s = get_precise_fuzzy_span(text, start_part, max_l_dist=DEFAULT_EDGE_MAX_L_DIST)

        if None not in s:
            s_start, s_end = s
            break
    if s_start is None:
        return None, None, "❌ start edge not found"
    e_start = e_end = None
    for k in range(min(max_end_words, len(words)), 0, -1):
        end_part = " ".join(words[-k:])
        e = get_precise_fuzzy_span(text, end_part, max_l_dist=DEFAULT_EDGE_MAX_L_DIST)
        if None not in e:
            e_start, e_end = e
            break
    if e_start is None:
        return None, None, "❌ end edge not found"
    start = min(s_start, e_start)
    end = max(s_end, e_end)
    return start, end, text[start:end].strip()




def find_best_match_with_tokens(
    tokens: List[Tuple[str, int, int]],
    target_words: List[str],
    max_word_dist: int = 2,
) -> Optional[Tuple[int, int]]:
    """Find the best alignment of `target_words` within `tokens`."""
    if not tokens or not target_words:
        return None
    target = [w.lower() for w in target_words]
    best: Optional[Tuple[int, int]] = None
    best_score: float = 0.0
    for i in range(len(tokens) - len(target) + 1):
        window = [tokens[j][0].lower() for j in range(i, min(i + len(target) + max_word_dist, len(tokens)))]
        score = 0.0
        matches: List[int] = []
        for tw in target:
            best_word_score: float = 0.0
            best_idx: Optional[int] = None
            for wi, ww in enumerate(window):
                if wi in matches:
                    continue
                ws = fuzz.ratio(ww, tw)
                if ws > best_word_score:
                    best_word_score = ws
                    best_idx = wi
            if best_idx is not None and best_word_score >= 80:
                matches.append(best_idx)
                score += best_word_score
        if matches:
            avg = score / len(target)
            if avg > best_score:
                best_score = avg
                start_pos = tokens[i][1]
                end_token = i + max(matches)
                end_pos = tokens[min(end_token, len(tokens) - 1)][2]
                best = (start_pos, end_pos)
    return best


def expand_to_punctuation(text: str, start: int, end: int) -> Tuple[int, int]:
    """Extend `end` through trailing punctuation marks."""
    while end < len(text) and text[end] in ".!?\\\"')":
        end += 1
    return start, end


def refine_by_progressive_matching(
    text: str,
    phrase: str,
    coarse: str,
    coarse_start: int = 0,
) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    """Refine a coarse span by aligning its tokens to the phrase."""
    
    cleaned = clean_phrase_for_matching(phrase)
    tokens = get_word_tokens(coarse)
    words = cleaned.split()
    for start_n in range(min(10, len(words)), 2, -1):
        for end_n in range(min(10, len(words)), 2, -1):
            s_match = find_best_match_with_tokens(tokens, words[:start_n])
            e_match = find_best_match_with_tokens(tokens, words[-end_n:])
            if s_match and e_match:
                s0, _ = s_match
                _, e1 = e_match
                if s0 < e1:
                    s0, e1 = expand_to_punctuation(coarse, s0, e1)
                    abs_start = coarse_start + s0
                    abs_end = coarse_start + e1
                    return abs_start, abs_end, coarse[s0:e1].strip()
    full = find_best_match_with_tokens(tokens, words, max_word_dist=3)
    if full:
        s0, e1 = expand_to_punctuation(coarse, full[0], full[1])
        abs_start = coarse_start + s0
        abs_end = coarse_start + e1
        return abs_start, abs_end, coarse[s0:e1].strip()
    return None, None, None


def refine_with_alignment(
    text: str,
    phrase: str,
    coarse: str,
    coarse_start: int = 0,
) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    """Refine a coarse span using sequence alignment."""
    #print(f"\n\n\nRefining with alignment funcall: {coarse_start}, {coarse}")
    #print(f"phrase: {phrase}")
    cleaned = clean_phrase_for_matching(phrase).lower()
    matcher = SequenceMatcher(None, coarse.lower(), cleaned)
    blocks = matcher.get_matching_blocks()
    if not blocks:
        return None, None, None
    best_block = max(blocks, key=lambda b: b.size)
    if best_block.size < len(cleaned) * 0.5:
        return None, None, None
    s = best_block.a
    e = best_block.a + best_block.size
    while s > 0 and coarse[s - 1].isalnum():
        s -= 1
    while e < len(coarse) and coarse[e].isalnum():
        e += 1
    abs_start = coarse_start + s
    abs_end = coarse_start + e
    return abs_start, abs_end, coarse[s:e].strip()


def best_window_match(text: str, phrase: str, slack: float = SLIDING_WINDOW_SLACK) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    t = normalize(phrase)
    L = len(t)
    if L == 0:
        return None, None, None
    span = max(1, int(L * (1 + slack)))
    best_score = 0.0
    best_start = None
    STEP = 20
    for i in range(0, len(text) - span + 1, STEP):
        snippet = normalize(text[i:i + span])
        score = fuzz.partial_ratio(snippet, t)
        if score > best_score:
            best_score = score
            best_start = i
            if best_score == 100:
                break
    if best_score >= WINDOW_THRESHOLD and best_start is not None:
        return best_start, best_start + span, text[best_start:best_start + span].strip()
    return None, None, None


def trim_after_last_keyword(snippet: str, phrase: str, start_offset: int) -> Tuple[str, int]:
    sn = normalize(snippet)
    ph = normalize(phrase).replace("''", "'")
    # print(f"[DEBUG] Trimming after last keyword in snippet: {repr(snippet)}")
    # print(f"[DEBUG] Phrase: {phrase}, Start Offset: {start_offset}")
    # print(f"[DEBUG] Snippet Length: {snippet.strip() == phrase.strip()}")
    # print("SNIPPET repr:", clean_phrase_for_matching(normalize(snippet)))
    # print("PHRASE  repr:", normalize(phrase))
    if sn.strip().lower() == ph.strip().lower():
        #print("[DEBUG] Snippet matches phrase exactly, returning as is.",snippet, start_offset + len(snippet))
        return snippet, start_offset + len(snippet)
    last_kw = None
    # find the last substantive word in the phrase (≥4 letters)
    for word in reversed(phrase.split()):
        alphas = re.sub(r'[^A-Za-z]', '', word)
        if len(alphas) >= 3:
            last_kw = alphas.lower()
            break
    if not last_kw:
        #print("\n\n\n[DEBUG] No substantive keyword found, returning original snippet.")
        return snippet, start_offset + len(snippet)

    snippet_lower = snippet.lower()
    pos = snippet_lower.rfind(last_kw)
    if pos == -1:
        # ←––––– Insert your ALL-CAPS‐stripping fallback here
        m = re.search(r'(.*?)(?:\s+[A-Z]{2,}\s*)$', snippet)
        if m:
            trimmed = m.group(1).rstrip()
            new_end = start_offset + len(trimmed)
            return trimmed, new_end
        # if no ALL-CAPS tag found, fall back to untouched snippet
        #print(f"\n\n\n[DEBUG2] Last keyword '{last_kw}' not found in snippet, returning original snippet. {snippet_lower}")
        return snippet, start_offset + len(snippet)

    search_start = pos + len(last_kw)
    for rel_idx, ch in enumerate(snippet[search_start:], start=search_start):
        if ch in '.?!^':
            # cut at the delimiter and return
            trimmed = snippet[:rel_idx].rstrip()
            new_end = start_offset + rel_idx
            return trimmed, new_end
    #print(f"\n\n\[DEBUG] Found last keyword '{last_kw}' at position {pos}, continuing search for end delimiter.")
    return snippet, start_offset + len(snippet)

def refine_by_fuzzy_edges_advanced_with_patch(text: str, phrase: str) -> Tuple[Optional[int], Optional[int], str]:
    #print(f"\n\n[DEBUG] Starting refine_by_fuzzy_edges_advanced_with_patch with phrase: {phrase!r}")
    #print(f"[DEBUG] Text length: {text}")
    raw = text
    raw = text.replace('"', ' ').replace("“", " ").replace("”", " ")
    raw = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', raw)
    raw = re.sub(r'http[s]?://[^\s]+', ' ', raw)
    #raw = re.sub(r'https?://\S+', '', text)
    raw = re.sub(r'http[s]?://[^\s]+', ' ', raw)  # Clean URLs from source
    raw = re.sub(r'\s+', ' ', raw)  # Collapse whitespace
    phr_clean = clean_phrase_for_matching(normalize(phrase))
    phr_seg = segment_first_last(phr_clean)
    #print(f"[DEBUG] segment: {phr_seg}")
    candidates: List[Tuple[float, int, int, str]] = []

    #print(f"\n[DEBUG] Phrase: {phrase}")
    #print(f"[DEBUG] Normalized Phrase: {phr_seg}")
    #print(f"[DEBUG] Raw Text : {raw}")
    #print(f"[DEBUG] Raw Text Length: {len(raw)}")

    def two_pass_strategy():
        res = []
        two_start, two_end, two_snip = two_pass_best_span(raw, phr_seg)
        #print(f"\n\n\n[DEBUG][Two-Pass] Span: {two_start}, {two_end}, Snip: {repr(two_snip)}")
        if two_snip:
            score = fuzz.token_sort_ratio(normalize(two_snip), phr_seg)
         #   print(f"[DEBUG][Two-Pass] Score: {score}")
            res.append((score, two_start or 0, two_end or 0, two_snip.strip()))
            if two_start is not None and two_end is not None:
                p_start, p_end, p_snip = refine_by_progressive_matching(raw, phr_seg, two_snip, two_start)
          #      print(f"[DEBUG][Two-Pass->Progressive] {p_start}, {p_end}, {repr(p_snip)}")
                if p_snip:
                    score = fuzz.token_sort_ratio(normalize(p_snip), phr_seg)
           #         print(f"[DEBUG][Two-Pass->Progressive] Score: {score}")
                    res.append((score, p_start or 0, p_end or 0, p_snip.strip()))
                a_start, a_end, a_snip = refine_with_alignment(raw, phr_seg, two_snip, two_start)
           #     print(f"[DEBUG][Two-Pass->Alignment] {a_start}, {a_end}, {repr(a_snip)}")
                if a_snip:
                    score = fuzz.token_sort_ratio(normalize(a_snip), phr_seg)
           #         print(f"[DEBUG][Two-Pass->Alignment] Score: {score}")
                    res.append((score, a_start or 0, a_end or 0, a_snip.strip()))
        return res

    def relaxed_strategy():
        res = []
        coarse_start, coarse_end, coarse = trim_using_start_end_fuzzy_relaxed(raw, phr_seg)
        #print(f"[DEBUG][Relaxed] Span: {coarse_start}, {coarse_end}, Snip: {repr(coarse)}")
        if coarse and not coarse.startswith('❌'):
            score = fuzz.token_sort_ratio(normalize(coarse), phr_seg)
         #   print(f"[DEBUG][Relaxed] Score: {score}")
            res.append((score, coarse_start or 0, coarse_end or 0, coarse.strip()))
            if coarse_start is not None and coarse_end is not None:
                p_start, p_end, p_snip = refine_by_progressive_matching(raw, phr_seg, coarse, coarse_start)
          #      print(f"[DEBUG][Relaxed->Progressive] {p_start}, {p_end}, {repr(p_snip)}")
                if p_snip:
                    score = fuzz.token_sort_ratio(normalize(p_snip), phr_seg)
           #         print(f"[DEBUG][Relaxed->Progressive] Score: {score}")
                    res.append((score, p_start or 0, p_end or 0, p_snip.strip()))
                a_start, a_end, a_snip = refine_with_alignment(raw, phr_seg, coarse, coarse_start)
           #     print(f"[DEBUG][Relaxed->Alignment] {a_start}, {a_end}, {repr(a_snip)}")
                if a_snip:
                    score = fuzz.token_sort_ratio(normalize(a_snip), phr_seg)
            #        print(f"[DEBUG][Relaxed->Alignment] Score: {score}")
                    res.append((score, a_start or 0, a_end or 0, a_snip.strip()))
        return res

    def sliding_window_strategy():
        res = []
        win_start, win_end, win_snip = best_window_match(raw, phr_seg)
        #print(f"[DEBUG][Sliding-Window] Span: {win_start}, {win_end}, Snip: {repr(win_snip)}")
        if win_snip:
            score = fuzz.token_sort_ratio(normalize(win_snip), phr_seg)
         #   print(f"[DEBUG][Sliding-Window] Score: {score}")
            res.append((score, win_start or 0, win_end or 0, win_snip.strip()))
        return res

    # Execute strategies sequentially
    candidates.extend(two_pass_strategy())
    candidates.extend(relaxed_strategy())
    candidates.extend(sliding_window_strategy())

    #print(f"[DEBUG] Total Candidates: {len(candidates)}")

    # Same filtering and selection logic
    if candidates:
        target_len = max(1, len(phr_seg))
        filtered = [
            (score, s, e, snip)
            for score, s, e, snip in candidates
            if len(snip) > 0 and 0.6 <= len(snip) / target_len <= 2.5
        ]
        pool = filtered if filtered else candidates
        pool.sort(key=lambda t: (t[0], -abs(len(t[3]) - target_len)), reverse=True)

        # print("[DEBUG] Candidate Scores (sorted):")
        # for sc, s, e, sn in pool:
        #     print(f"    Score={sc}, Span=({s},{e}), Snip={repr(sn)}")

        best_score, best_start, best_end, best_snip = pool[0]

        if best_score >= EDGE_THRESHOLD:
            # anchor backtracking logic
            anchor = None
            for tok in re.findall(r"[A-Za-z][A-Za-z']*", phr_seg):
                if len(tok) >= 4:
                    anchor = tok.lower()
                    break
            if anchor and anchor not in best_snip.lower():
        # find the next candidate that does include the anchor
                for cand in pool[1:]:
                    _, s, e, snip = cand
                    if anchor in snip.lower():
                        best_start, best_end, best_snip = s, e, snip
                        break
            final_start, final_end = best_start, best_end
            final_snip = best_snip

            if anchor and anchor not in best_snip.lower():
                BACKTRACK_LIMIT = 400
                search_start = max(0, best_start - BACKTRACK_LIMIT)
                idx = raw.lower().rfind(anchor, search_start, best_start)
                #print(f"[DEBUG] Anchor: {anchor}, Backtrack idx: {idx}")
                if idx != -1:
                    final_start = idx
                    final_snip = raw[final_start:best_end].strip()
                    final_end = best_end
            # print(f"[DEBUG] Final Selection before: ({final_start}, {final_end}) -> {repr(final_snip)}")
            # print(f"[DEBUG] Final phr_seg: {repr(phr_seg)}")
            final_snip, final_end = trim_after_last_keyword(final_snip, phr_seg, final_start)
          #  print(f"[DEBUG] Final Selection: ({final_start}, {final_end}) -> {repr(final_snip)}")
            return final_start, final_end, final_snip.strip()

    # Fallback
    fallback_length = len(phrase) + 50
    print("[DEBUG] Fallback triggered")
    return 0, min(len(raw), fallback_length), raw[: fallback_length].strip()