from __future__ import annotations
import re
import string
from typing import Optional, Tuple, List
from fuzzysearch import find_near_matches
import itertools
from difflib import SequenceMatcher

# Optional dependency: word segmentation
try:
    import wordninja
except Exception:
    wordninja = None

def snap_to_word_boundary(text: str, pos: int) -> int:
    """
    Move pos left until it sits on a word boundary (between non-letters or at start).
    """
    while pos > 0 and pos < len(text) and text[pos - 1].isalpha() and text[pos].isalpha():
        pos -= 1
    return pos

def is_word_boundary(text: str, idx: int) -> bool:
    if idx <= 0:
        return True
    return text[idx - 1] in (string.whitespace + string.punctuation)

def clean_snippet(s: str) -> str:
    """
    Remove caret-annotated noise (e.g., ^reading...) and collapse spaces.
    Trim trailing punctuation to make literal matching easier.
    """
    s = re.sub(r"\^(?:[\w\-']+\)?\.?)", " ", s)
    s = re.sub(r"\^.*?(?=\s|$)", " ", s)
    s = " ".join(s.split())
    return s.rstrip(string.punctuation)

def strip_punct(t: str) -> str:
    return re.sub(r"[^\w\s]", "", t)

def segment_first_last(p: str) -> str:
    """
    Segment only the first and last word using wordninja; skip if special chars present.
    Simpler variant: split on whitespace; do not preserve original spacing.
    """
    if not p:
        return p

    words = p.split()
    if not words:
        return p

    special = re.compile(r"[^a-zA-Z0-9]")

    # First word
    w0 = words[0]
    if wordninja and len(w0) >= 8 and w0.isalpha() and not special.search(w0):
        try:
            words[0] = " ".join(wordninja.split(w0))
        except Exception:
            pass

    # Last word (if different from first)
    if len(words) > 1:
        wl = words[-1]
        if wordninja and len(wl) >= 8 and wl.isalpha() and not special.search(wl):
            try:
                words[-1] = " ".join(wordninja.split(wl))
            except Exception:
                pass

    return " ".join(words)

def split_if_fused(token: str):
    """
    Split fused alpha tokens using wordninja under a strict gate.
    Returns list of parts if valid, else None.
    Gate:
      - wordninja available
      - len(token) >= 8
      - token.isalpha()
      - no special characters
      - parts must concatenate back to token (case-insensitive)
    """
    if not token or not isinstance(token, str):
        return None
    if not wordninja:
        return None
    t = token.strip()
    if len(t) < 8 or not t.isalpha():
        return None
    # No special characters
    if re.search(r"[^a-zA-Z0-9]", t):
        return None
    try:
        parts = wordninja.split(t)
    except Exception:
        return None
    if not parts or len(parts) < 2:
        return None
    if "".join(parts).lower() != t.lower():
        return None
    return parts

def compute_edge_diffs(expected: str, found: str) -> dict:
    """
    Edge-only token diffs between expected and found.
    Returns counts and token lists for missing/extra at start/end.
    """
    E = re.findall(r"[\w&-]+", (expected or "").lower())
    F = re.findall(r"[\w&-]+", (found or "").lower())

    sm = SequenceMatcher(a=E, b=F, autojunk=False)
    blocks = [b for b in sm.get_matching_blocks() if b.size > 0]

    if not blocks:
        return {
            "missing_start": len(E),
            "extra_start": len(F),
            "missing_end": 0,
            "extra_end": 0,
            "missing_start_tokens": E,
            "extra_start_tokens": F,
            "missing_end_tokens": [],
            "extra_end_tokens": [],
        }

    first, last = blocks[0], blocks[-1]

    # Heuristic: avoid anchoring the END edge on a low-information terminal block
    # (e.g., stopword-only tails like "on the" or very short fragments). This prevents
    # snapping to far-right occurrences of low-information tokens in unrelated trailing text.
    try:
        STOPWORDS = {
            "the", "of", "in", "on", "to", "a", "an", "and", "or", "for", "with",
            "is", "are", "was", "were", "be", "been", "being", "that", "which",
            "who", "whom", "this", "these", "those", "as", "at", "by", "from", "it",
            "its", "their", "they", "them", "he", "she", "we", "you", "i", "but",
            "if", "not", "no", "do", "does", "did", "so", "such", "than", "then",
            "there", "here", "what", "when", "where", "why", "how", "only"
        }
        # consider a terminal block low-information if all tokens are stopwords or very short (<=2 chars)
        toks_last = [E[last.a + k] for k in range(last.size) if 0 <= last.a + k < len(E)]
        low_info_last = toks_last and all((t in STOPWORDS) or (len(t) <= 2) for t in toks_last)

        # Guard: if the low-information block already aligns to the true ends of BOTH sequences,
        # do not discard it (protects expected suffixes like "for those").
        endings_aligned = ((last.a + last.size) == len(E)) and ((last.b + last.size) == len(F))

        if (not endings_aligned) and last.size <= 3 and low_info_last:
            # pick the rightmost prior block that is informative (any token not stopword and len>=3) or size > 1
            for b in reversed(blocks[:-1]):
                toks_b = [E[b.a + k] for k in range(b.size) if 0 <= b.a + k < len(E)]
                has_informative = any((t not in STOPWORDS) and (len(t) >= 3) for t in toks_b)
                if has_informative or b.size > 1:
                    last = b
                    break
    except Exception:
        # On any issue, fall back to original 'last'
        pass

    miss_s = first.a
    extra_s = first.b
    miss_e = len(E) - (last.a + last.size)
    extra_e = len(F) - (last.b + last.size)

    return {
        "missing_start": miss_s,
        "extra_start": extra_s,
        "missing_end": miss_e,
        "extra_end": extra_e,
        "missing_start_tokens": E[:miss_s],
        "extra_start_tokens": F[:extra_s],
        "missing_end_tokens": E[last.a + last.size:],
        "extra_end_tokens": F[last.b + last.size:],
    }

def build_char_map(orig: str, norm_func):
    """
    Create a mapping from normalized-string indices back to the original string.
    Returns (normalized_string, norm2orig_index_map).
    """
    normed = []
    map_idx = []
    for i, ch in enumerate(orig):
        nch = norm_func(ch)
        if nch:  # keep this character (possibly lowercased)
            normed.append(nch)
            map_idx.append(i)
    return "".join(normed), map_idx

def near_smart(
    text_sub: str,
    anchor_tok: str,
    max_dist: int = 3,
    min_tokens_kept: int = 2,
    max_token_drop_frac: float = 0.5,
    dist_penalty: int = 3,
):
    """
    Robust fuzzy matcher that:
      - normalizes case and strips punctuation
      - tries dropping up to max_token_drop_frac of tokens (but keeps >= min_tokens_kept)
      - uses fuzzysearch.find_near_matches on the kept tokens joined by spaces
      - prefers more tokens kept, then lower edit distance, then earlier matches

    Returns a match-like object with .start/.end in ORIGINAL text_sub coordinates.
    """
    norm = lambda s: "".join(ch for ch in s.lower() if ch not in string.punctuation)
    text_norm, char_map = build_char_map(text_sub, lambda ch: ch.lower() if ch not in string.punctuation else "")

    # Token normalize the anchor
    words = [norm(w) for w in anchor_tok.split()]
    words = [w for w in words if w]
    n_words = len(words)
    if n_words < min_tokens_kept:
        return None

    max_drop = min(int(n_words * max_token_drop_frac), n_words - min_tokens_kept)

    best_candidate = None
    best_score = None

    for drop_count in range(0, max_drop + 1):
        for drop_idxs in itertools.combinations(range(n_words), drop_count):
            kept_words = [w for i, w in enumerate(words) if i not in drop_idxs]
            if len(kept_words) < min_tokens_kept:
                continue

            part_to_search = " ".join(kept_words)
            if not part_to_search:
                continue

            matches = find_near_matches(part_to_search, text_norm, max_l_dist=max_dist)
            for m in matches:
                # score: more kept tokens is better; lower distance is better; earlier is better
                primary_score = len(kept_words) - (m.dist * dist_penalty)
                sc = (primary_score, -m.dist, len(kept_words), -m.start)
                if best_score is None or sc > best_score:
                    best_score = sc
                    best_candidate = m

    if best_candidate is None:
        return None

    # Map back to original coordinates
    start = char_map[best_candidate.start] if best_candidate.start < len(char_map) else len(text_sub)
    end = char_map[best_candidate.end - 1] + 1 if (best_candidate.end - 1) < len(char_map) else len(text_sub)
    matched_orig = text_sub[start:end]

    # Recreate a similar object with original coordinates
    return type(best_candidate)(
        start=start,
        end=end,
        dist=best_candidate.dist,
        matched=matched_orig,
    )

def tokenize_with_offsets(text: str) -> Tuple[List[int], List[str]]:
    """
    Tokenize with the same regex as matcher and return (offsets, words).
    """
    pat = re.compile(r"[\w&-]+")
    offs = [m.start() for m in pat.finditer(text)]
    words = [m.group() for m in pat.finditer(text)]
    return offs, words

def char_span_to_token_span(text: str, s: int, e: int) -> Tuple[int, int]:
    """
    Map a character span [s, e) to inclusive token indices (ti, tj).
    If invalid/empty, returns (0, -1).
    """
    offs, words = tokenize_with_offsets(text)
    if not offs:
        return 0, -1

    s = 0 if s is None else max(0, min(s, len(text)))
    e = 0 if e is None else max(0, min(e, len(text)))
    if e <= s:
        return 0, -1

    # ti: rightmost token with start <= s
    ti = 0
    for i, o in enumerate(offs):
        if o <= s:
            ti = i
        else:
            break

    # tj: leftmost token whose end >= e
    tj = len(offs) - 1
    for i, o in enumerate(offs):
        if o + len(words[i]) >= e:
            tj = i
            break

    if tj < ti:
        tj = ti
    return ti, tj

def refine_span_with_edge_repair(
    text: str,
    expected: str,
    s: int,
    e: int,
    window: int = 12,
    fuzz: bool = False,  # reserved; only exact adjacency used
) -> dict:
    """
    Post-pass that keeps 'found' and 'expected' unchanged and produces 'afterremove':
      - Trim extras at start/end by shifting token indices inward
      - Add missings only if the missing sequences are immediately adjacent
        (or within 'window' but still contiguous with the edge; no middle edits)
    Returns:
      {
        "afterremove_span": [s2, e2],
        "afterremove": text[s2:e2],
        "edge_diff_refined": compute_edge_diffs(expected, text[s2:e2])
      }
    """
    offs, words = tokenize_with_offsets(text)
    exp_clean = clean_snippet(expected or "")
    if s is None or e is None or s >= e or not words:
        frag = text[s:e] if (s is not None and e is not None) else ""
        return {
            "afterremove_span": [s, e],
            "afterremove": frag,
            "edge_diff_refined": compute_edge_diffs(exp_clean, frag),
            "afterremove_pretty": frag,
            "edge_diff_pretty": compute_edge_diffs(exp_clean, frag),
        }

    ti, tj = char_span_to_token_span(text, s, e)
    ti = max(0, min(ti, len(words) - 1))
    tj = max(ti, min(tj, len(words) - 1))
    # Lowercased view for case-insensitive adjacency checks
    words_lower = [w.lower() for w in words]

    def tok_end(idx: int) -> int:
        return offs[idx] + len(words[idx])

    # Raw found for edge diff
    found_raw = text[offs[ti]:tok_end(tj)]
    ed = compute_edge_diffs(exp_clean, found_raw)

    # 1) Trim extras at edges
    extra_s = int(ed.get("extra_start", 0) or 0)
    extra_e = int(ed.get("extra_end", 0) or 0)
    if extra_s > 0:
        ti = min(len(words) - 1, ti + extra_s)
    if extra_e > 0:
        tj = max(ti, tj - extra_e)

    # 1b) Gated left-edge de-noise for "(time) SPEAKER:" headers
    # Only when:
    #  - no extra_start to trim (post-trim view),
    #  - many expected tokens missing at the start,
    #  - head tokens look like [digits, digits, am/pm] optionally followed by UPPERCASE label.
    try:
        found_after_trim = text[offs[ti]:tok_end(tj)]
        ed2 = compute_edge_diffs(exp_clean, found_after_trim)
        extra_s2 = int(ed2.get("extra_start", 0) or 0)
        ms2 = int(ed2.get("missing_start", 0) or 0)
        if extra_s2 == 0 and ms2 >= 2 and (ti + 2) < len(words):
            w0 = words[ti]
            w1 = words[ti + 1]
            w2 = words_lower[ti + 2]
            # detect "2 05 pm" style time triple
            if w0.isdigit() and w1.isdigit() and w2 in ("am", "pm"):
                k = ti + 3
                # optional uppercase speaker label token (e.g., "PRESIDENT")
                label_tok_lc = None
                if k < len(words) and words[k].isalpha() and words[k].isupper():
                    label_tok_lc = words[k].lower()
                    k += 1

                # guard: avoid trimming if expected's suffix itself begins with that label/time
                exp_l = re.findall(r"[\w&-]+", clean_snippet(expected).lower())
                exp_suffix = exp_l[ms2: ms2 + 6]
                if (label_tok_lc is None) or (label_tok_lc not in exp_suffix):
                    ti = min(k, len(words) - 1)
    except Exception:
        pass

    # 2) Add missings if contiguous adjacency exists
    miss_s_tokens = ed.get("missing_start_tokens", []) or []
    miss_e_tokens = ed.get("missing_end_tokens", []) or []

    ms = len(miss_s_tokens)
    if ms > 0 and ti - ms >= 0:
        # immediate adjacency (strict)
        if words_lower[ti - ms:ti] == miss_s_tokens:
            ti = ti - ms
        else:
            # Optional scan up to 'window' left, but still require adjacency ending at ti
            start_k = max(0, ti - window - ms)
            for k in range(ti - ms - 1, start_k - 1, -1):
                if k < 0:
                    break
                if words_lower[k:k + ms] == miss_s_tokens and (k + ms) == ti:
                    ti = k
                    break

    # Refresh edge state before relaxed start-edge adjacency
    found_after_adj = text[offs[ti]:tok_end(tj)]
    ed = compute_edge_diffs(exp_clean, found_after_adj)
    miss_s_tokens = ed.get("missing_start_tokens", []) or []
    ms = len(miss_s_tokens)

    # Relaxed start-edge adjacency: allow dropping just the first missing token
    # if the remaining sequence is immediately adjacent (case-insensitive).
    apply_relaxed = not (ms > 0 and ti > 0 and words_lower[ti - 1] == (miss_s_tokens[0] or ""))
    if apply_relaxed and ms > 1 and ti - (ms - 1) >= 0:
        if words_lower[ti - (ms - 1):ti] == miss_s_tokens[1:]:
            ti = ti - (ms - 1)
        else:
            start_k2 = max(0, ti - window - (ms - 1))
            for k in range(ti - (ms - 1) - 1, start_k2 - 1, -1):
                if k < 0:
                    break
                if words_lower[k:k + (ms - 1)] == miss_s_tokens[1:] and (k + (ms - 1)) == ti:
                    ti = k
                    break

    # Refresh edge state before greedy start-edge consumption
    found_after = text[offs[ti]:tok_end(tj)]
    ed = compute_edge_diffs(exp_clean, found_after)
    miss_s_tokens = ed.get("missing_start_tokens", []) or []
    ms = len(miss_s_tokens)

    # START edge: greedy adjacent suffix consumption (strict adjacency, window-bounded)
    # Consume as many of the trailing missing_start_tokens as are immediately adjacent to ti.
    if ms > 0 and ti > 0:
        p = ms - 1
        k = ti - 1
        # Strictly-adjacent consumption: lift window cap to allow full contiguous suffix
        while p >= 0 and k >= 0:
            if words_lower[k] == (miss_s_tokens[p] or ""):
                ti = k
                p -= 1
                k -= 1
            else:
                break

    # START edge: greedy fused/fragment recovery for multi-token missing prefixes
    # - Handles fused plural like ["creditor","s"] -> "creditors"
    # - Handles short suffix fragment like "nded" inside "attended" (len ≤ 4)
    if ms > 0 and ti > 0:
        k2 = ti - 1
        p2 = ms - 1
        consumed_words = 0
        while p2 >= 0 and k2 >= 0 and consumed_words < window:
            lw = words_lower[k2]

            # Try 2-token fuse (e.g., "creditor","s" -> "creditors")
            if p2 >= 1:
                fused = (miss_s_tokens[p2 - 1] or "") + (miss_s_tokens[p2] or "")
                if lw == fused:
                    ti = k2
                    p2 -= 2
                    k2 -= 1
                    consumed_words += 1
                    continue

            # Try single-token suffix fragment inside left word (e.g., "nded" in "attended")
            frag = (miss_s_tokens[p2] or "")
            if frag:
                if len(frag) <= 4 and lw.endswith(frag):
                    ti = k2
                    # include only the fragment at the start edge
                    s2_override = offs[k2] + (len(words[k2]) - len(frag))
                    p2 -= 1
                    k2 -= 1
                    consumed_words += 1
                    continue

            break

    # Tail-locked extended left expansion (tolerant, capped)
    # Gate: strong right edge (missing_end==0), sizeable missing_start, and no extra_start.
    try:
        curr = text[offs[ti]:tok_end(tj)]
        ed_cur = compute_edge_diffs(exp_clean, curr)
        ms_cur = int(ed_cur.get("missing_start", 0) or 0)
        me_cur = int(ed_cur.get("missing_end", 0) or 0)
        xs_cur = int(ed_cur.get("extra_start", 0) or 0)
        miss_s_tokens_cur = ed_cur.get("missing_start_tokens", []) or []
        if me_cur <= 1 and xs_cur == 0 and ms_cur >= 2 and ti > 0 and miss_s_tokens_cur:
            # allow extended consumption beyond 'window' but hard-cap growth
            ext_cap = min(128, max(window * 3, ms_cur + 24))
            # local window cap (tighter) for tolerant scan; allow modestly larger traversal under strict gates
            win = min(ext_cap, max(64, min(96, window + ms_cur)))
            ignorable = {"by", "and", "or", "&", "the", "a", "an", "of", "to", "in", "for"}  # tiny bridge/stop tokens allowed to skip
            skip_max = 6
            min_match = min(4, max(2, int(ms_cur * 0.15)))  # global: allow smaller matched runs under tight gates

            # how many of the missing suffix are already consumed just to the right of 'ti'
            consumed_prev = 0
            while consumed_prev < ms_cur:
                c = consumed_prev + 1
                if (ti + c) <= len(words) and miss_s_tokens_cur[ms_cur - c: ms_cur] == words_lower[ti: ti + c]:
                    consumed_prev = c
                else:
                    break

            i = ti - 1
            p = ms_cur - consumed_prev - 1  # next missing token to include on the left
            steps = 0
            matched = 0
            skipped = 0  # text skips (incl. ignorable + strong)
            morph_used = False
            ti_candidate = ti
            drop_miss = 0
            drop_miss_max = min(64, max(12, ms_cur - 1))  # allow dropping more noisy missing tokens under strict gates
            skip_strong_budget = 4      # allow skipping up to four non-ignorable text tokens (global bridges)

            def tok_eq(a: str, b: str) -> bool:
                if a == b:
                    return True
                # small affix tolerance (prefix/suffix deltas up to 3)
                if a.startswith(b) and (len(a) - len(b)) <= 3:
                    return True
                if b.startswith(a) and (len(b) - len(a)) <= 3:
                    return True
                if len(a) >= 6 and len(b) >= 6:
                    try:
                        return SequenceMatcher(a=a, b=b, autojunk=False).ratio() >= 0.84
                    except Exception:
                        return False
                return False

            while i >= 0 and p >= 0 and steps < ext_cap and steps < win:
                w = words_lower[i]
                target = (miss_s_tokens_cur[p] or "")
                if tok_eq(w, target):
                    ti_candidate = i
                    i -= 1
                    p -= 1
                    matched += 1
                else:
                    # Targeted lookahead: try to reach current target within a tiny left window
                    # before dropping the expected token. This helps stitch phrases like
                    # "... english statements , or the audit statements ..." where a non-ignorable
                    # bridge token (e.g., "audit") sits between expected neighbors.
                    la_win = 5
                    found_at = -1
                    j = i - 1
                    ign_skips_needed = 0
                    strong_skips_needed = 0
                    while j >= 0 and (i - j) <= la_win:
                        wj = words_lower[j]
                        if tok_eq(wj, target):
                            found_at = j
                            break
                        if wj in ignorable or len(wj) <= 2:
                            ign_skips_needed += 1
                        else:
                            strong_skips_needed += 1
                        j -= 1

                    if found_at != -1 and strong_skips_needed <= skip_strong_budget and ign_skips_needed <= max(0, skip_max - skipped):
                        # Commit the skips and match target at found_at
                        skip_strong_budget -= strong_skips_needed
                        skipped += (ign_skips_needed + strong_skips_needed)
                        ti_candidate = found_at
                        i = found_at - 1
                        p -= 1
                        matched += 1
                        steps += 1
                        continue
                    elif drop_miss < drop_miss_max:
                        # drop a mismatching missing token (e.g., transcription noise) and keep searching
                        p -= 1
                        drop_miss += 1
                    elif w in ignorable or len(w) <= 2:
                        if skipped < skip_max:
                            skipped += 1
                            i -= 1
                        else:
                            break
                    elif skip_strong_budget > 0:
                        # skip one non-ignorable token from text to reach a matching run
                        skip_strong_budget -= 1
                        skipped += 1
                        i -= 1
                    elif (not morph_used) and len(w) >= 6 and len(target) >= 6:
                        try:
                            if SequenceMatcher(a=w, b=target, autojunk=False).ratio() >= 0.84:
                                ti_candidate = i
                                i -= 1
                                p -= 1
                                matched += 1
                                morph_used = True
                            else:
                                break
                        except Exception:
                            break
                    else:
                        break
                steps += 1

            if matched >= min_match:
                ti = ti_candidate
            else:
                # Contiguous n-gram fallback under strict tail lock:
                # Find the rightmost long subsequence of missing_start_tokens in the left window and snap ti to it.
                Lmax = min(10, len(miss_s_tokens_cur))
                Lmin = 5
                left_start = max(0, ti - win - 8)
                found_ngram = False
                for L in range(Lmax, Lmin - 1, -1):
                    for j in range(0, len(miss_s_tokens_cur) - L + 1):
                        seq = miss_s_tokens_cur[j:j + L]
                        # scan the text tokens to the left of current ti to find the rightmost occurrence
                        for i2 in range(ti - 1, left_start + L - 2, -1):
                            if words_lower[i2 - L + 1:i2 + 1] == seq:
                                ti = i2 - L + 1
                                found_ngram = True
                                break
                        if found_ngram:
                            break
                    if found_ngram:
                        break
    except Exception:
        pass


    me = len(miss_e_tokens)
    if me > 0:
        # Greedy adjacent prefix with tiny skip allowance for pronoun/contraction tokens
        # This permits crossing over minimal "he's" split as ["he","s"] without requiring it in expected.
        ignorable = {"he", "s"}
        p = 0
        k = tj + 1
        skipped = 0
        skip_max = 2
        # ensure override var exists in locals if we set it below
        e2_override = locals().get("e2_override", None)

        # Stage 1: immediate adjacency consumption (with tolerant comparator)
        def tok_eq_end(a: str, b: str) -> bool:
            if a == b:
                return True
            # small affix tolerance (prefix/suffix deltas up to 3)
            if a.startswith(b) and (len(a) - len(b)) <= 3:
                return True
            if b.startswith(a) and (len(b) - len(a)) <= 3:
                return True
            if len(a) >= 6 and len(b) >= 6:
                try:
                    return SequenceMatcher(a=a, b=b, autojunk=False).ratio() >= 0.84
                except Exception:
                    return False
            return False

        # End-duplication skip: if the first missing token equals the current tail token,
        # skip it to avoid re-consuming the same token (e.g., "... will | be will ..." vs expected "... will be ...").
        try:
            if me >= 1 and tj >= 0 and words_lower[tj] == (miss_e_tokens[0] or ""):
                p = 1  # start consuming from the next expected token
                # k already points to tj+1 (the next text token)
        except Exception:
            pass

        morph_used = False
        while p < me and k < len(words):
            target = (miss_e_tokens[p] or "")
            w = words_lower[k]
            # Optional-article skip: if expected token is an article missing in text but next expected matches current text, skip the article
            try:
                ARTICLES = {"the", "a", "an"}
                if target in ARTICLES and (p + 1) < me and w == (miss_e_tokens[p + 1] or ""):
                    p += 1
                    continue
            except Exception:
                pass
            # Stopword bridge inclusion: include a single bridging stopword between current end and next expected token.
            # Example: "... will | be for those ..." when expected suffix is "... be those ..."
            try:
                BRIDGE_STOPS = {"for", "to", "of", "in", "on", "at", "by", "and", "or", "&", "the", "a", "an", "this", "that", "these", "those", "all"}
                if w in BRIDGE_STOPS and (k + 1) < len(words) and words_lower[k + 1] == target:
                    # include the bridge token and the expected target token
                    k += 2
                    p += 1
                    continue
            except Exception:
                pass
            # Two-fragment fusion at END (e.g., 'gan' + 'sha' -> 'ganesha')
            if p <= me - 2:
                a = (miss_e_tokens[p] or "")
                b = (miss_e_tokens[p + 1] or "")
                if a.isalpha() and b.isalpha() and len(a) <= 4 and len(b) <= 4:
                    if w.startswith(a) and w.endswith(b):
                        mid_len = len(w) - (len(a) + len(b))
                        if 0 <= mid_len <= 2:
                            e2_override = max(e2_override or 0, offs[k] + len(words[k]))
                            p += 2
                            break
                # Fallback: include first fragment when two short tokens remain and right word starts with it (at least 'gan')
                # Only when the NEXT word does not start with the next fragment; otherwise let normal flow handle across-word match.
                if a and a.isalpha() and 3 <= len(a) <= 4 and b and b.isalpha() and len(b) <= 4 and w.startswith(a):
                    next_b = (miss_e_tokens[p + 1] or "") if (p + 1) < me else ""
                    next_starts_b = ((k + 1) < len(words)) and next_b and words_lower[k + 1].startswith(next_b)
                    if not next_starts_b:
                        e2_override = max(e2_override or 0, offs[k] + len(a))
                        p += 1
                        k += 1
                        continue
            # Tiny terminal fragment promotion: include the whole right word (e.g., 'th' -> 'third')
            if p == me - 1 and target and len(target) <= 2 and w.startswith(target):
                e2_override = max(e2_override or 0, offs[k] + len(words[k]))
                p += 1
                break
            if w == target:
                p += 1
                k += 1
                continue
            if (not morph_used) and tok_eq_end(w, target):
                morph_used = True
                p += 1
                k += 1
                continue
            if skipped < skip_max and w in ignorable:
                skipped += 1
                k += 1
                continue
            break

        if p > 0:
            # Extend through last compared token (includes any tiny ignorable bridge tokens)
            tj = min(len(words) - 1, k - 1)
        else:
            # Stage 2: windowed jump to first expected end token, then continue greedy consumption.
            k0 = None
            limit = min(len(words), tj + 1 + window)
            for j in range(tj + 1, limit):
                if words_lower[j] == (miss_e_tokens[0] or ""):
                    k0 = j
                    break
            if k0 is not None:
                # include intervening tokens AND the first expected token at k0 (ensure suffix like "those" is included)
                if k0 >= tj:
                    tj = min(len(words) - 1, k0)
                # now consume from k0+1 onward (we've already included miss_e_tokens[0])
                p = 1
                k = k0 + 1
                morph_used2 = False
                def tok_eq_end(a: str, b: str) -> bool:
                    if a == b:
                        return True
                    if a.startswith(b) and (len(a) - len(b)) <= 3:
                        return True
                    if b.startswith(a) and (len(b) - len(a)) <= 3:
                        return True
                    if len(a) >= 6 and len(b) >= 6:
                        try:
                            return SequenceMatcher(a=a, b=b, autojunk=False).ratio() >= 0.84
                        except Exception:
                            return False
                    return False
                while p < me and k < len(words):
                    target = (miss_e_tokens[p] or "")
                    w = words_lower[k]
                    # Optional-article skip: if expected token is an article missing in text but next expected matches current text, skip the article
                    try:
                        ARTICLES = {"the", "a", "an"}
                        if target in ARTICLES and (p + 1) < me and w == (miss_e_tokens[p + 1] or ""):
                            p += 1
                            continue
                    except Exception:
                        pass
                    # Stopword bridge inclusion: include a single bridging stopword between current end and next expected token.
                    # Example: "... will | be for those ..." when expected suffix is "... be those ..."
                    try:
                        BRIDGE_STOPS = {"for", "to", "of", "in", "on", "at", "by", "and", "or", "&", "the", "a", "an", "this", "that", "these", "those", "all"}
                        if w in BRIDGE_STOPS and (k + 1) < len(words) and words_lower[k + 1] == target:
                            # include the bridge token and the expected target token
                            k += 2
                            p += 1
                            continue
                    except Exception:
                        pass
                    # Two-fragment fusion at END (e.g., 'gan' + 'sha' -> 'ganesha')
                    if p <= me - 2:
                        a = (miss_e_tokens[p] or "")
                        b = (miss_e_tokens[p + 1] or "")
                        if a.isalpha() and b.isalpha() and len(a) <= 4 and len(b) <= 4:
                            if w.startswith(a) and w.endswith(b):
                                mid_len = len(w) - (len(a) + len(b))
                                if 0 <= mid_len <= 2:
                                    e2_override = max(e2_override or 0, offs[k] + len(words[k]))
                                    p += 2
                                    break
                        # Fallback: include first fragment when two short tokens remain and right word starts with it (at least 'gan')
                        # Only when the NEXT word does not start with the next fragment; otherwise let normal flow handle across-word match.
                        if a and a.isalpha() and 3 <= len(a) <= 4 and b and b.isalpha() and len(b) <= 4 and w.startswith(a):
                            next_b = (miss_e_tokens[p + 1] or "") if (p + 1) < me else ""
                            next_starts_b = ((k + 1) < len(words)) and next_b and words_lower[k + 1].startswith(next_b)
                            if not next_starts_b:
                                e2_override = max(e2_override or 0, offs[k] + len(a))
                                p += 1
                                k += 1
                                continue
                    # Tiny terminal fragment promotion (e.g., 'th' -> include whole 'third')
                    if p == me - 1 and target and len(target) <= 2 and w.startswith(target):
                        e2_override = max(e2_override or 0, offs[k] + len(words[k]))
                        p += 1
                        break
                    if w == target:
                        p += 1
                        k += 1
                    elif (not morph_used2) and tok_eq_end(w, target):
                        morph_used2 = True
                        p += 1
                        k += 1
                    elif p == me - 1 and len(target) >= 4 and w.startswith(target):
                        # final-token prefix match (include only the fragment at end)
                        e2_override = offs[k] + len(target)
                        p += 1
                        break
                    else:
                        break
                if p > 0 and e2_override is None:
                    tj = min(len(words) - 1, k - 1)

    # 2b) Segmentation-aware expansion for fused tokens at edges (using wordninja)
    connectors = {"and", "&", "-"}
    # START edge fused expansion (scan left)
    if len(miss_s_tokens) == 1:
        parts = split_if_fused((miss_s_tokens[0] or ""))
        if parts:
            k = ti - 1
            ok = True
            consumed = 0
            for pi in range(len(parts) - 1, -1, -1):
                if k < 0 or words[k].lower() != parts[pi].lower():
                    ok = False
                    break
                k -= 1
                consumed += 1
                if pi > 0:
                    if k >= 0 and words[k].lower() in connectors:
                        k -= 1
                        consumed += 1
            if ok and consumed <= window:
                ti = max(0, k + 1)

    # END edge fused expansion (scan right)
    if len(miss_e_tokens) == 1:
        parts = split_if_fused((miss_e_tokens[0] or ""))
        if parts:
            k = tj + 1
            ok = True
            consumed = 0
            for pi, part in enumerate(parts):
                if k >= len(words) or words[k].lower() != part.lower():
                    ok = False
                    break
                k += 1
                consumed += 1
                if pi < len(parts) - 1:
                    if k < len(words) and words[k].lower() in connectors:
                        k += 1
                        consumed += 1
            if ok and consumed <= window:
                tj = min(len(words) - 1, k - 1)

    # 3) Micro-snap heuristics for tiny/fragment tokens and fused words (edges only)
    s2_override = locals().get("s2_override", None)
    e2_override = locals().get("e2_override", None)

    # START edge: if single tiny/fragment missing token (e.g., "ars"), include whole left word
    # if fragment length is small or it appears as a substring; otherwise, include just the fragment inside the left word.
    if len(miss_s_tokens) == 1:
        frag_s_orig = miss_s_tokens[0] or ""
        frag_s = frag_s_orig.lower()
        left_idx = ti - 1
        if frag_s and left_idx >= 0:
            w_left = words[left_idx]
            wl = w_left.lower()
            if len(frag_s) <= 3 and (wl.endswith(frag_s) or (frag_s in wl)):
                # include the entire left word (e.g., "ars" -> "years")
                ti = left_idx
            else:
                pos = wl.find(frag_s)
                if pos != -1:
                    # include only the fragment inside the left word
                    s2_override = offs[left_idx] + pos

    # END edge: if single tiny/fragment missing token (e.g., "i", "gen"), prefer whole right word
    # for very short fragments; otherwise, include just the fragment inside the right word.
    if len(miss_e_tokens) == 1:
        frag_e_orig = miss_e_tokens[0] or ""
        frag_e = frag_e_orig.lower()
        right_idx = tj + 1
        if frag_e and right_idx < len(words):
            w_right = words[right_idx]
            wr = w_right.lower()
            if len(frag_e) <= 2 and (wr.startswith(frag_e) or (frag_e in wr)):
                # include the entire right word (e.g., "i" -> "is")
                tj = right_idx
            else:
                pos = wr.find(frag_e)
                if pos != -1:
                    # include only the fragment inside the right word (e.g., "alsowill" -> include "... will")
                    e2_override = offs[right_idx] + pos + len(frag_e_orig)

    s2 = offs[ti]
    e2 = tok_end(tj)
    if s2_override is not None:
        s2 = max(0, min(s2_override, e2))
    if e2_override is not None:
        e2 = max(e2, e2_override)

    # Final start-trim: eliminate any reintroduced extra_start after expansions
    try:
        ed_final = compute_edge_diffs(exp_clean, text[s2:e2])
        xs_final = int(ed_final.get("extra_start", 0) or 0)
        if xs_final > 0:
            ti2, tj2 = char_span_to_token_span(text, s2, e2)
            if ti2 + xs_final <= tj2:
                ti2 = ti2 + xs_final
                s2 = offs[ti2]
    except Exception:
        pass

    # Start-snap: if start still has extras, snap to earliest contiguous expected prefix (K=6..4) within current span
    try:
        ed_final2 = compute_edge_diffs(exp_clean, text[s2:e2])
        xs2 = int(ed_final2.get("extra_start", 0) or 0)
        if xs2 > 0:
            E_tokens = re.findall(r"[\w&-]+", (exp_clean or "").lower())
            if len(E_tokens) >= 4:
                ti2, tj2 = char_span_to_token_span(text, s2, e2)
                start_idx = max(0, ti2)
                end_idx = max(start_idx, tj2)
                Kmax = min(6, len(E_tokens))
                found_u = None
                for K in range(Kmax, 3, -1):
                    target = E_tokens[:K]
                    u = start_idx
                    while u + K - 1 <= end_idx:
                        if words_lower[u:u + K] == target:
                            found_u = u
                            break
                        u += 1
                    if found_u is not None:
                        break
                if found_u is not None:
                    s2 = max(s2, offs[found_u])
    except Exception:
        pass

    # End-snap: align to latest contiguous expected suffix (K=6..4) within current span
    try:
        ed_end_snap = compute_edge_diffs(exp_clean, text[s2:e2])
        E_tokens_all = re.findall(r"[\w&-]+", (exp_clean or "").lower())
        if E_tokens_all:
            offs2, words2 = tokenize_with_offsets(text)
            words_lower2 = [w.lower() for w in words2]
            ti2, tj2 = char_span_to_token_span(text, s2, e2)
            start_idx2 = max(0, ti2)
            end_idx2 = max(start_idx2, tj2)
            Kmax = min(6, len(E_tokens_all))
            found_end = None
            for K in range(Kmax, 3, -1):
                target = E_tokens_all[-K:]
                j = end_idx2 - K + 1
                while j >= start_idx2:
                    if words_lower2[j:j + K] == target:
                        found_end = j + K - 1  # index of last token in match
                        break
                    j -= 1
                if found_end is not None:
                    break
            if found_end is not None:
                e2 = max(s2, offs2[found_end] + len(words2[found_end]))
    except Exception:
        pass

    # Intra-token right-edge shrink for fused last word (conservative)
    try:
        ed_curr = compute_edge_diffs(exp_clean, text[offs[ti]:tok_end(tj)])
        xs_curr = int(ed_curr.get("extra_start", 0) or 0)
        # Only when no extra at start; allow tiny end noise inside the last word
        if xs_curr == 0 and 0 <= tj < len(words_lower):
            E_tokens = re.findall(r"[\w&-]+", exp_clean.lower())
            if E_tokens:
                lastE = E_tokens[-1]
                wlast = words_lower[tj]
                pos = wlast.find(lastE)
                if pos != -1 and pos <= 1:
                    suffix_extra = len(wlast) - (pos + len(lastE))
                    if 0 <= suffix_extra <= 2:
                        e2_shrink = offs[tj] + pos + len(lastE)
                        if e2_shrink < e2:
                            e2 = max(s2, e2_shrink)
    except Exception:
        pass

    # Conservative end stopword prune (global, non-hardcoded)
    try:
        offs3, words3 = tokenize_with_offsets(text)
        words_lower3 = [w.lower() for w in words3]
        ti3, tj3 = char_span_to_token_span(text, s2, e2)
        STOPWORDS2 = {
            "the", "of", "in", "on", "to", "a", "an", "and", "or", "for", "with",
            "is", "are", "was", "were", "be", "been", "being", "that", "which",
            "who", "whom", "this", "these", "those", "as", "at", "by", "from", "it",
            "its", "their", "they", "them", "he", "she", "we", "you", "i", "but",
            "if", "not", "no", "do", "does", "did", "so", "such", "than", "then",
            "there", "here", "what", "when", "where", "why", "how", "only"
        }
        E_tokens2 = re.findall(r"[\w&-]+", (exp_clean or "").lower())
        right_inform = None
        for t in reversed(E_tokens2):
            if (t not in STOPWORDS2) and len(t) >= 3:
                right_inform = t
                break
        # Baseline missing_end before pruning and protect exact expected last token
        try:
            ed_before = compute_edge_diffs(exp_clean, text[s2:e2])
            me_before = int(ed_before.get("missing_end", 0) or 0)
        except Exception:
            me_before = 0
        exp_last = E_tokens2[-1] if E_tokens2 else None
        while tj3 > ti3 and words_lower3[tj3] in STOPWORDS2:
            # Do not prune if current tail token equals the expected last token
            if exp_last and words_lower3[tj3] == exp_last:
                break
            cand_e2 = offs3[tj3 - 1] + len(words3[tj3 - 1])
            ed_tmp = compute_edge_diffs(exp_clean, text[s2:cand_e2])
            me_tmp = int(ed_tmp.get("missing_end", 0) or 0)
            # Only accept prune if it does not increase missing_end and preserves informative tail
            if me_tmp <= me_before and (right_inform is None or right_inform in text[s2:cand_e2].lower()):
                tj3 -= 1
                e2 = offs3[tj3] + len(words3[tj3])
                me_before = me_tmp
            else:
                break
    except Exception:
        pass

    # Force-snap to last informative expected token when trailing tail is only stopwords (len ≤ 3) — GATED to protect expected suffix
    try:
        offs4, words4 = tokenize_with_offsets(text)
        words_lower4 = [w.lower() for w in words4]
        ti4, tj4 = char_span_to_token_span(text, s2, e2)
        STOPWORDS3 = {
            "the", "of", "in", "on", "to", "a", "an", "and", "or", "for", "with",
            "is", "are", "was", "were", "be", "been", "being", "that", "which",
            "who", "whom", "this", "these", "those", "as", "at", "by", "from", "it",
            "its", "their", "they", "them", "he", "she", "we", "you", "i", "but",
            "if", "not", "no", "do", "does", "did", "so", "such", "than", "then",
            "there", "here", "what", "when", "where", "why", "how", "only"
        }
        # count trailing stopword run length (cap 3)
        run = 0
        k = tj4
        while k >= ti4 and words_lower4[k] in STOPWORDS3 and run < 3:
            run += 1
            k -= 1
        if 1 <= run <= 3:
            E_tokens3 = re.findall(r"[\w&-]+", (exp_clean or "").lower())
            exp_last = E_tokens3[-1] if E_tokens3 else None
            # Gate: never force-snap if expected last token is already within the current span
            skip_force = False
            if exp_last and tj4 >= ti4 and words_lower4[tj4] == exp_last:
                skip_force = True
            elif exp_last and exp_last in words_lower4[ti4:tj4 + 1]:
                skip_force = True
            if not skip_force:
                # rightmost informative expected token (non-stopword)
                right_inf = None
                for t in reversed(E_tokens3):
                    if (t not in STOPWORDS3) and len(t) >= 3:
                        right_inf = t
                        break
                if right_inf is not None:
                    # find rightmost occurrence of right_inf within [ti4, tj4 - run]
                    end_search = max(ti4, tj4 - run)
                    rpos = -1
                    for j in range(end_search, ti4 - 1, -1):
                        if words_lower4[j] == right_inf:
                            rpos = j
                            break
                    if rpos != -1 and rpos < tj4:
                        e2 = max(s2, offs4[rpos] + len(words4[rpos]))
    except Exception:
        pass

    # Final right-edge near-token inclusion: include first missing end token if it appears shortly to the right,
    # optionally crossing a single stopword bridge (e.g., 'be for those' when expected starts with 'those').
    try:
        ed_fix = compute_edge_diffs(exp_clean, text[s2:e2])
        miss_e_fix = ed_fix.get("missing_end_tokens", []) or []
        if miss_e_fix:
            ti5, tj5 = char_span_to_token_span(text, s2, e2)
            j_start = max(0, tj5 + 1)
            j_limit = min(len(words), j_start + 8)
            target0 = (miss_e_fix[0] or "")
            found_idx = None
            # direct search for the first missing token
            for j in range(j_start, j_limit):
                if words_lower[j] == target0:
                    found_idx = j
                    break
            if found_idx is None:
                # allow a single bridging stopword before the target
                BRIDGE_STOPS2 = {"for", "to", "of", "in", "on", "at", "by", "and", "or", "&", "the", "a", "an", "this", "that", "these", "all"}
                for j in range(j_start, max(j_start, j_limit - 1)):
                    if words_lower[j] in BRIDGE_STOPS2 and words_lower[j + 1] == target0:
                        found_idx = j + 1
                        break
            if found_idx is not None:
                e2 = max(e2, offs[found_idx] + len(words[found_idx]))
    except Exception:
        pass

    after = text[s2:e2]

    # Presentation-only: build a 'pretty' afterremove for fused words at END edge (e.g., 'alsowill' -> ' will')
    after_pretty = after
    try:
        if len(miss_e_tokens) == 1 and (tj + 1) < len(words):
            frag_e_orig = miss_e_tokens[0] or ""
            if frag_e_orig:
                w_right = words[tj + 1]
                wr = w_right.lower()
                pos = wr.find(frag_e_orig.lower())
                if pos != -1:
                    prefix = text[s2:offs[tj + 1]]
                    spacer = "" if (not prefix or prefix.endswith(" ")) else " "
                    # Construct pretty string that shows just the missing fragment at the edge
                    after_pretty = f"{prefix}{spacer}{frag_e_orig}"
    except Exception:
        after_pretty = after

    return {
        "afterremove_span": [s2, e2],
        "afterremove": after,
        "edge_diff_refined": compute_edge_diffs(exp_clean, after),
        "afterremove_pretty": after_pretty,
        "edge_diff_pretty": compute_edge_diffs(exp_clean, after_pretty),
    }
