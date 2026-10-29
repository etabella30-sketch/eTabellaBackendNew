import os, sys, re, json, time, difflib
from bisect import bisect_left, bisect_right
from pathlib import Path
from sqlconfig import execute_query, execute_single_query
from db_batch import execute_batch_update
from common import load_json_file, save_json_file, parse_timestamp, find_nearest_index
from ssr import refine_by_fuzzy_edges_advanced_with_patch

# Draft-vs-published timestamp tolerance shared by the Mark (issue) and Quick Mark
# (highlight) paths: both funnel into the same et_marks view and PDF-export render.
TIME_GAP_TOLERANCE_SECONDS = 60
# Lines searched on each side of the nearest-by-time published line.
MATCH_WINDOW_LINES = 2
# Rows per UPDATE … FROM (VALUES …) statement in the batched DB write.
BATCH_PAGE_SIZE = 500

# =========================================================
# File and Transcript Utilities
# =========================================================


def generate_paths(sessionid):
    issues_folder = os.path.join('.', str(sessionid))
    highlights_folder = os.path.join('.', f"{sessionid}_H")
    os.makedirs(issues_folder, exist_ok=True)
    os.makedirs(highlights_folder, exist_ok=True)
    return {
        'issues_folder': issues_folder, 'highlights_folder': highlights_folder,
        'raw_issues_file': os.path.join(issues_folder, f'raw_issues_{sessionid}.json'),
        'raw_highlights_file': os.path.join(highlights_folder, f'raw_highlights_{sessionid}.json'),
        'parsed_transcript_file': os.path.join(issues_folder, f'parsed_transcript_{sessionid}.json'),
        'transformed_issues_file': os.path.join(issues_folder, f'transformed_issues_{sessionid}.json'),
        'transformed_highlights_file': os.path.join(highlights_folder, f'transformed_highlights_{sessionid}.json'),
        'output_issues_file': os.path.join(issues_folder, f'output_issues_{sessionid}.json'),
        'sql_issues_file': os.path.join(issues_folder, f'update_script_issues.sql'),
        'output_highlights_file': os.path.join(highlights_folder, f'output_highlights_{sessionid}.json'),
        'sql_highlights_file': os.path.join(highlights_folder, f'update_script_highlights.sql'),
    }

def read_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()



def parse_text(text):
    """Parses transcript text into structured lines with timestamps and page numbers.

    The page of a line is the page the published viewer shows it on. The viewer's
    pages come from assets/pythons/transcript/file.py parse_transcript_text, where a
    page is a form-feed section: pageno = section index + 1 of the raw text. So the
    same rule applies here, else nTPage and the published page disagree.

    The old rule (a new page after every line numbered 25) only counted lines that
    carry a timestamp. A page whose last lines have none (e.g. lines 24-25 left blank
    after "(Lunch break)") never reached 25, so every later page was numbered one low
    and its marks landed a page early on the wrong text (Day - 01, 2026-10-27, p.59).
    A file with no form feed keeps the old rule.
    """
    line_rx = re.compile(r'^\s*(\d+)\s+(\d{2}:\d{2}:\d{2})\s*(.*)')
    parsed_lines = []
    start_index = 0  # running line identity (stored as string)

    def add(match, page_no):
        nonlocal start_index
        start_index += 1
        parsed_lines.append({
            "lineno": int(match.group(1)),
            "timestamp": match.group(2),
            "text": match.group(3).strip(),
            "pageno": page_no,
            "index": int(match.group(1)) - 1,  # 0-based index for matching
            "identity": str(start_index)  # store as string
        })

    if '\f' in text:
        for section_index, section in enumerate(text.split('\f')):
            for line in section.splitlines():
                match = line_rx.match(line)
                if match:
                    add(match, section_index + 1)
        return parsed_lines

    page_no = 1
    for line in text.strip().split('\n'):
        match = line_rx.match(line)
        if match:
            add(match, page_no)
            if int(match.group(1)) % 25 == 0:
                page_no += 1
    return parsed_lines

def _seconds(ts):
    t = parse_timestamp(ts)
    return t.hour * 3600 + t.minute * 60 + t.second


def _norm_words(text):
    """Lower-case words without punctuation or ^-markers (steno flags), for exact-text checks."""
    text = re.sub(r'\^+\S*', ' ', text or '').lower()
    return re.sub(r'[^a-z0-9]+', ' ', text).split()


class TranscriptIndex:
    """The published lines that carry a timestamp and text, built ONCE per run.

    The old code rebuilt this list and scanned it linearly for every Mark (two
    min() passes and two next() passes over ~7,000 lines each). Nearest-by-time is
    now a bisect over a sorted copy. It returns the same line as
    common.find_nearest_index: the smallest distance, and on a tie the earliest
    line in transcript order, also when timestamps run backwards (reporters do
    re-stamp, e.g. Day 2 286:12→13).

    Positions returned are positions in `self.entries`, the same space the ±window
    is cut from. The old code took a GLOBAL transcript index from
    find_nearest_index and then used it as a position in the filtered list, so a
    timestamped line with empty text shifted every later window.
    """

    def __init__(self, transcript_data):
        self.entries = [
            (i, _seconds(entry["timestamp"]), entry)
            for i, entry in enumerate(transcript_data)
            if entry.get("timestamp") and entry.get("text")
        ]
        order = sorted(range(len(self.entries)), key=lambda p: (self.entries[p][1], p))
        self._sorted_secs = [self.entries[p][1] for p in order]
        self._sorted_pos = order
        self._words = None

    def __len__(self):
        return len(self.entries)

    def nearest(self, secs):
        """Position (in self.entries) of the line nearest in time; -1 when empty."""
        if not self.entries:
            return -1
        k = bisect_left(self._sorted_secs, secs)
        best = None
        for cand in (k - 1, k):
            if 0 <= cand < len(self._sorted_secs):
                d = abs(self._sorted_secs[cand] - secs)
                if best is None or d < best:
                    best = d
        hits = []
        for t in {secs - best, secs + best}:
            lo, hi = bisect_left(self._sorted_secs, t), bisect_right(self._sorted_secs, t)
            hits.extend(self._sorted_pos[lo:hi])
        return min(hits)

    def gap(self, pos, secs):
        return abs(self.entries[pos][1] - secs)

    def find_exact_text(self, annotation_lines):
        """Position of the ONE run of consecutive lines whose words equal the Mark's text.

        Used only after the time gate has rejected a Mark: a reporter can re-stamp a
        line far from its live time (Day 2 "(10.00 am)": live 09:20:59, final
        09:11:53 at 1:1) although the words are unchanged. Returns -1 unless the
        match is unique and has at least 3 words, so short replies ("Yes.") and
        repeated phrases never jump.
        """
        target = _norm_words(" ".join(a.get("text") or "" for a in annotation_lines))
        span = len(annotation_lines)
        if len(target) < 3 or span < 1:
            return -1
        if self._words is None:
            self._words = [_norm_words(e[2]["text"]) for e in self.entries]
        found = -1
        for p in range(0, len(self.entries) - span + 1):
            words = [w for q in range(p, p + span) for w in self._words[q]]
            if words == target:
                if found != -1:
                    return -1
                found = p
        return found


def prepare_transcript_for_matching(parsed_transcript):
    normalized_lines = [normalize_text(entry['text']) for entry in parsed_transcript]
    return normalized_lines, parsed_transcript


def prepare_transcript_for_matching_h(parsed_transcript):
    normalized_lines = [normalize_text(entry['text']) for entry in parsed_transcript]
    return normalized_lines, parsed_transcript

def transform_db_highlights(db_result):
    annotations = []
    for row in db_result:
        try:
            if len(row) < 2 or not row[1]: continue
            annotations.append({"annotid": str(row[0]), "search_text": row[1], "start_time": row[5]})
        except (IndexError, TypeError) as e: print(f"Skipping malformed highlight row: {row}. Error: {e}")
    return annotations

def find_best_match(search_block, transcript_lines):
    best_match_ratio, best_match_index = -1.0, -1
    matcher = difflib.SequenceMatcher(None, autojunk=False)
    matcher.set_seq1(search_block)
    for i in range(len(transcript_lines) - len(search_block) + 1):
        window = transcript_lines[i : i + len(search_block)]
        matcher.set_seq2(window)
        current_ratio = matcher.ratio()
        if current_ratio > best_match_ratio:
            best_match_ratio, best_match_index = current_ratio, i
            if best_match_ratio == 1.0: break
    return best_match_ratio, best_match_index

def flatten_transcript(transcript):
    """Flatten transcript lines into a single text and positional mapping"""
    word_list, position_list, char_spans = [], [], []
    char_index = 0

    for line_index, entry in enumerate(transcript):
        words = entry['text'].split()
        for word_index, word in enumerate(words):
            word_list.append(word)
            position_list.append((line_index, word_index))
            start = char_index
            end = start + len(word)
            char_spans.append((start, end))
            char_index = end + 1  # +1 for space

    return " ".join(word_list), word_list, position_list, char_spans

def transfer_annotation_with_difflib(annotation, transcript_data, uuid, debug=False, index=None, window=None):
    """Transfers a single annotation to the parsed transcript using fuzzy matching (with page numbers).

    Returns an empty list if the draft annotation's timestamps fall outside the
    published feed's time range (> TIME_GAP_TOLERANCE_SECONDS from any
    published line) AND its words do not appear verbatim, exactly once, in the
    published copy. This guard prevents orphan annotations — whose draft
    source content was edited out during publish — from being snapped onto
    unrelated early pages just because that's where the nearest time lands.

    `index` is the TranscriptIndex of `transcript_data`; main() builds it once for
    the whole run. Callers that pass only `transcript_data` still work.
    """
    if not annotation:
        return []
    if index is None:
        index = TranscriptIndex(transcript_data)
    if not len(index):
        return []
    window = MATCH_WINDOW_LINES if window is None else window

    # Step 1-2: nearest published line to the Mark's first and last timestamps
    start_secs = _seconds(annotation[0]["timestamp"])
    end_secs = _seconds(annotation[-1]["timestamp"])
    start_pos = index.nearest(start_secs)
    end_pos = index.nearest(end_secs)
    start_gap = index.gap(start_pos, start_secs)
    end_gap = index.gap(end_pos, end_secs)
    if start_pos > end_pos:
        start_pos, end_pos = end_pos, start_pos

    # Orphan guard: if BOTH start and end are outside the published range,
    # the annotation's source content was removed during publish — unless the
    # same words are in the published copy once (re-stamped line). Returning
    # [] here routes into the caller's orphan branch, which clears the
    # transferred-coord columns and stamps cTransferStatus='O'.
    if start_gap > TIME_GAP_TOLERANCE_SECONDS and end_gap > TIME_GAP_TOLERANCE_SECONDS:
        exact_pos = index.find_exact_text(annotation)
        if exact_pos == -1:
            print(f"  ORPHAN (time gap): annotation {uuid} draft span "
                  f"{annotation[0]['timestamp']}->{annotation[-1]['timestamp']} "
                  f"is outside published range (start_gap={int(start_gap)}s, "
                  f"end_gap={int(end_gap)}s, tolerance={TIME_GAP_TOLERANCE_SECONDS}s)")
            return []
        start_pos, end_pos = exact_pos, exact_pos + len(annotation) - 1

    final_start = max(start_pos - window, 0)
    final_end = min(end_pos + window, len(index) - 1)
    transcript_indexed = index.entries
    matched_block = [transcript_indexed[i][2] for i in range(final_start, final_end + 1)]

    # Step 3: Fuzzy match
    search_phrase = " ".join([entry["text"] for entry in annotation if entry.get("text")])
    flat_text, word_list, position_list, char_spans = flatten_transcript(matched_block)

    start, end, res = refine_by_fuzzy_edges_advanced_with_patch(flat_text, search_phrase)
    if start is None or end is None:
        return []

    matched_words = [i for i, (w_start, w_end) in enumerate(char_spans) if w_start < end and w_end > start]
    if not matched_words:
        return []

    # Step 4: Map matched words back to transcript lines
    line_map = {}
    for word_idx in matched_words:
        line_index, word_index = position_list[word_idx]
        word = word_list[word_idx]
        line_map.setdefault(line_index, []).append((word_index, word))

    matched_lines = []
    for line_index in sorted(line_map.keys()):
        true_line_index = transcript_indexed[final_start + line_index][0]
        original_line = transcript_data[true_line_index]
        word_indices = sorted(line_map[line_index])
        words = original_line["text"].split()

        reconstructed_text = " ".join(
            words[i] for i, _ in word_indices if 0 <= i < len(words)
        )

        matched_lines.append({
            "timestamp": original_line["timestamp"],
            "index": original_line["index"],
            "pageno": original_line.get("pageno", 0),  # ✅ include page number
            "identity":original_line["identity"],  # ✅ include page number
            "text": reconstructed_text
        })
    print(f"Matched {len(matched_lines)} lines for annotation {uuid}.")
    return matched_lines



def transform_db_issues(db_result):
    """Convert DB issue rows to annotation format"""
    annotations = []
    for row in db_result:
        try:
            nId, _, jCordinates, cType = str(row[0]), row[1], row[2], row[3]
            if not jCordinates:
                continue
            details = [{"timestamp": d.get("t"), "text": d.get("text", "").strip()} for d in jCordinates]
            # cType ('F' / 'QF' from FactMaster, 'D' for DocMaster) names the table to update.
            annotations.append({"annotid": nId, "detail": details, "type": (cType or '').strip() or None})
        except (IndexError, TypeError) as e:
            print(f"Skipping malformed issue row: {row}. Error: {e}")
    return annotations

# =========================================================
# Sequential Main Pipeline
# =========================================================

def main(sessionid):
    # sessionid = "744448df-5e94-4471-bb1e-f348073f8860"
    draft_path = f'assets/realtime-transcripts/s_{sessionid}.TXT'
    paths = generate_paths(sessionid)

    # Step 1: Fetch DB issues
    print("Fetching issues from DB...")
    raw_issues = execute_query('et_realtime_get_annotation_by_session_v2', f'{{"nSessionid":"{sessionid}"}}')
    raw_highlights = execute_query('et_realtime_get_rhighlights_by_session', f'{{"nSessionid":"{sessionid}"}}')
    save_json_file(paths['raw_issues_file'], raw_issues)
    save_json_file(paths['raw_highlights_file'], raw_highlights)

    # Step 2: Parse single transcript
    print("Parsing transcript file...{draft_path}")

    transcript_text = read_file(draft_path)
    parsed_transcript = parse_text(transcript_text)
    normalized_lines, full_data_lines = prepare_transcript_for_matching(parsed_transcript)
    highlights_to_transfer = transform_db_highlights(raw_highlights)

    if not highlights_to_transfer:
        print("No valid highlights found to transfer.")
    else:
        save_json_file(paths['transformed_highlights_file'], highlights_to_transfer)
        normalized_lines_h, full_data_lines_h = prepare_transcript_for_matching_h(parsed_transcript)
        process_and_transfer_highlights(highlights_to_transfer, normalized_lines_h, full_data_lines_h, paths, True)

    # Step 3: Transform and Transfer Issues
    print("Processing Issues...")
    issues_to_transfer = transform_db_issues(raw_issues)
    print(f"Found {len(issues_to_transfer)} issues to transfer.")
    started = time.perf_counter()
    all_results, fact_rows, doc_rows = transfer_issues(issues_to_transfer, parsed_transcript)
    print(f"Matched {len(issues_to_transfer)} issues in {time.perf_counter() - started:.1f}s.")

    # Step 4: one transaction for every row (was 2 UPDATE + 2 COMMIT round trips per
    # Mark), then the replay files once (they were rewritten after every Mark, so
    # the bytes written grew with the square of the Mark count).
    if not write_issue_rows(fact_rows, doc_rows):
        print("Error: transferred coordinates were not saved; the publish must not continue.")
        sys.exit(1)

    save_json_file(paths['output_issues_file'], all_results)
    with open(paths['sql_issues_file'], 'w', encoding='utf-8') as f:
        f.write("\n".join(issue_sql_replay(fact_rows, doc_rows)))
    print("All issues processed.")
    print(f"JSON output: {paths['output_issues_file']}")
    print(f"SQL script: {paths['sql_issues_file']}")
    print(" Database has been updated as well.")


def transfer_issues(issues_to_transfer, parsed_transcript, window=None):
    """Match every Mark against the published lines. No DB or file I/O.

    Returns (all_results, fact_rows, doc_rows). A row is
    (uuid, jTCordinates JSON or None, nTPage, nTLine, cTransferStatus):
    'T' = transferred, 'O' = orphan with the transferred-coord columns cleared
    (the export renders off jTCordinates presence, not cTransferStatus, so stale
    coords from an earlier publish must not survive). A Mark goes to the table its
    cType names ('D' = DocDetail, else FactDetail); an unknown type goes to both,
    as before (rows that don't exist are no-ops).
    """
    index = TranscriptIndex(parsed_transcript)
    all_results, fact_rows, doc_rows = {}, [], []
    for issue in issues_to_transfer:
        uuid = issue['annotid']
        try:
            final_annotation = transfer_annotation_with_difflib(issue['detail'], parsed_transcript, uuid,
                                                                index=index, window=window)
        except Exception as e:
            print(f"Error processing issue {uuid}: {e}")
            continue
        all_results[uuid] = final_annotation

        # Page + line from the first matched line. line_number mirrors jTCordinates[*].l
        # so consumer SPs that read either source see the same published position.
        if final_annotation:
            json_lines = [
                {
                    "t": line["timestamp"],
                    "p": line["pageno"],
                    "l": line["index"] + 1,
                    "text": line["text"],
                    "identity": line["identity"],
                    "x": 0, "y": 0, "width": 0, "height": 21.5
                }
                for line in final_annotation
            ]
            row = (uuid, json.dumps(json_lines), final_annotation[0]['pageno'],
                   final_annotation[0]['index'] + 1, 'T')
        else:
            row = (uuid, None, None, None, 'O')

        kind = issue.get('type')
        if kind != 'D':
            fact_rows.append(row)
        if kind not in ('F', 'QF'):
            doc_rows.append(row)
    return all_results, fact_rows, doc_rows


ISSUE_UPDATE_SQL = '''UPDATE "{table}" AS d
SET "jTCordinates" = v.j::jsonb, "nTPage" = v.p::integer, "nTLine" = v.l::integer, "cTransferStatus" = v.s
FROM (VALUES %s) AS v(id, j, p, l, s)
WHERE d."{key}" = v.id::uuid'''


def write_issue_rows(fact_rows, doc_rows):
    """All FactDetail and DocDetail updates in ONE transaction."""
    statements = []
    if fact_rows:
        statements.append((ISSUE_UPDATE_SQL.format(table='FactDetail', key='nFSid'), fact_rows))
    if doc_rows:
        statements.append((ISSUE_UPDATE_SQL.format(table='DocDetail', key='nDocid'), doc_rows))
    if not statements:
        return True
    return execute_batch_update(statements, page_size=BATCH_PAGE_SIZE)


def issue_sql_replay(fact_rows, doc_rows):
    """The same updates as literal SQL, for the replay file next to the JSON output."""
    def lit(v):
        return 'NULL' if v is None else ("'" + str(v).replace("'", "''") + "'" if isinstance(v, str) else str(v))
    out = []
    for table, key, rows in (('FactDetail', 'nFSid', fact_rows), ('DocDetail', 'nDocid', doc_rows)):
        for uuid, j, p, l, s in rows:
            out.append(f'UPDATE "{table}" SET "jTCordinates" = {lit(j)}, "nTPage" = {lit(p)}, '
                       f'"nTLine" = {lit(l)}, "cTransferStatus" = {lit(s)} WHERE "{key}" = {lit(uuid)};')
    return out


def process_and_transfer_highlights(highlights_data,
                                    normalized_transcript_lines,
                                    full_transcript_data,
                                    paths,
                                    save_to_db=False):
    """
    Find nearest-by-time index, search in a ±2 window using fuzzy ratio, and map
    the local best back to the GLOBAL transcript index before writing results.
    Falls back to a global scan if time is missing.
    """
    HIGHLIGHT_MATCH_THRESHOLD = 0.70
    # Maximum time gap (seconds) between a draft highlight's anchor timestamp
    # and the nearest published-feed timestamp to even consider a fuzzy match.
    # If the gap is larger than this, the draft anchor is outside the published
    # feed's time range entirely (typical case: mic-check / pre-record content
    # was edited out during publish, so draft ts like 08:17 has no counterpart
    # when the published feed starts at 08:43). Without this guard,
    # find_nearest_index returns the edge line (page 1 line 1) and the global
    # fuzzy fallback then finds enough word-overlap with that page 1 content
    # to score > 0.70 — dumping orphan highlights on "(9.00 am)" /
    # "Introductions..." / "PRESIDENT: Good morning..." which is the bug
    # you're seeing on Day 1 page 1.
    all_results_json, all_sql_updates, db_rows = [], [], []

    # Build (global_idx, ts_in_seconds, entry_dict) for time anchoring
    transcript_indexed = [
        (i, parse_timestamp(entry.get("timestamp")), entry)
        for i, entry in enumerate(full_transcript_data)
        if entry.get("timestamp")
    ]

    for highlight in highlights_data:
        annotid = highlight['annotid']
        search_text = highlight.get('search_text', '')
        normalized_search_text = normalize_text(search_text)

        best_ratio = -1.0
        best_global_idx = -1

        # -------- anchor by time if we have one --------
        start_time_str = highlight.get("start_time")  # can be None
        used_local_window = False
        outside_time_range = False

        if start_time_str:
            try:
                start_ts = parse_timestamp(start_time_str)
            except Exception:
                start_ts = None

            if start_ts is not None and transcript_indexed:
                # nearest idx in transcript_indexed (this returns an index INTO transcript_indexed)
                start_idx_in_idxed = find_nearest_index(start_ts, transcript_indexed)

                # Orphan guard: if the nearest published timestamp is more
                # than TIME_GAP_TOLERANCE_SECONDS away from the draft anchor,
                # the draft content this highlight referenced doesn't exist
                # in the published feed at all. Skip matching and short-circuit
                # to the orphan branch below.
                nearest_entry_ts = None
                for idx_tuple in transcript_indexed:
                    if idx_tuple[0] == start_idx_in_idxed:
                        nearest_entry_ts = idx_tuple[1]
                        break
                if nearest_entry_ts is not None:
                    gap = abs((nearest_entry_ts - start_ts).total_seconds())
                    if gap > TIME_GAP_TOLERANCE_SECONDS:
                        outside_time_range = True
                        print(f"  ORPHAN (time gap): Highlight {annotid} draft ts={start_time_str} "
                              f"is {int(gap)}s away from nearest published ts — source content "
                              f"was edited out during publish")

                if not outside_time_range:
                    # make a ±2 local window IN transcript_indexed space
                    final_start = max(start_idx_in_idxed - 4, 0)
                    final_end = min(start_idx_in_idxed + 4, len(transcript_indexed) - 1)

                    for local_i in range(final_start, final_end + 1):
                        _, _, entry = transcript_indexed[local_i]
                        # compare against normalized transcript text
                        curr_ratio = difflib.SequenceMatcher(
                            None,
                            normalized_search_text,
                            normalize_text(entry.get("text", ""))
                        ).ratio()

                        if curr_ratio > best_ratio:
                            best_ratio = curr_ratio
                            # map LOCAL -> GLOBAL index
                            best_global_idx = transcript_indexed[local_i][0]

                    used_local_window = True

        # -------- fallback: global scan over all lines --------
        # Skip the global fallback when the time-anchor was outside the
        # published range. Global scan gave enough false-positive matches
        # (any line with "Good morning" was scoring > 0.70 against draft
        # mic-check highlights) that orphans were landing on page 1
        # line 1-3 despite being unrelated content.
        if not outside_time_range and best_ratio < HIGHLIGHT_MATCH_THRESHOLD:
            for global_i, norm_line in enumerate(normalized_transcript_lines):
                r = difflib.SequenceMatcher(None, normalized_search_text, norm_line).ratio()
                if r > best_ratio:
                    best_ratio = r
                    best_global_idx = global_i

        # -------- emit if above threshold --------
        if not outside_time_range and best_ratio > HIGHLIGHT_MATCH_THRESHOLD and best_global_idx != -1:
            transferred_line = full_transcript_data[best_global_idx]
            cTPageno = transferred_line.get('pageno')
            cTLineno = transferred_line.get('lineno')
            cTTime   = transferred_line.get('timestamp')
            identity = transferred_line.get('identity')
        #"identity" = {identity}

            json_out = {
                "annotid": annotid,
                "new_location": {"pageno": cTPageno, "lineno": cTLineno, "timestamp": cTTime,"tidentity":identity}
            }
            sql_out = (
                'UPDATE "RHighlights" '
                f'SET "cTPageno" = {cTPageno}, "cTLineno" = {cTLineno}, "cTTime" = \'{cTTime}\' ,"tidentity" = {identity}, '
                f'"cTransferStatus" = \'T\' '
                f'WHERE "nHid" = \'{annotid}\';'
            )

            all_results_json.append(json_out)
            all_sql_updates.append(sql_out)
            db_rows.append((annotid, cTPageno, cTLineno, cTTime, identity, 'T'))

            print(f"  SUCCESS: Highlight {annotid} matched "
                  f"(ratio {best_ratio:.2f}, {'±2 window' if used_local_window else 'global'})")
        else:
            # Below-threshold match = orphan. CLEAR the transferred-coord
            # columns (cTPageno / cTLineno / cTTime / tidentity) and stamp
            # cTransferStatus='O'. Clearing is required because:
            #
            #   1. et_marks (view) filters on cTransferStatus='O' → hidden.
            #      The 'O' stamp alone is enough here.
            #
            #   2. The export render path (transcript_publish.service.ts
            #      around line 404 / ref2 in the export SP) historically
            #      rendered highlights based on cTPageno/cTLineno being
            #      NOT NULL, not on cTransferStatus. Without clearing, the
            #      old (wrong) coords from a previous publish run still
            #      render on the exported PDF — the exact "(9.00 am)"
            #      mic-check-snapped-to-page-1 bug the user is seeing on
            #      the Day 1 export.
            all_sql_updates.append(
                f'UPDATE "RHighlights" SET "cTPageno" = NULL, "cTLineno" = NULL, "cTTime" = NULL, "tidentity" = NULL, "cTransferStatus" = \'O\' WHERE "nHid" = \'{annotid}\';'
            )
            db_rows.append((annotid, None, None, None, None, 'O'))
            print(f"  FAILURE: Highlight {annotid} match failed. Best ratio: {best_ratio:.2f} — marked orphan")

    # One transaction for every Quick Mark (was one UPDATE + COMMIT round trip each).
    if save_to_db and db_rows:
        ok = execute_batch_update([(
            '''UPDATE "RHighlights" AS h
SET "cTPageno" = v.p, "cTLineno" = v.l, "cTTime" = v.t, "tidentity" = v.i, "cTransferStatus" = v.s
FROM (VALUES %s) AS v(id, p, l, t, i, s)
WHERE h."nHid" = v.id::uuid''',
            [(a, None if p is None else str(p), None if l is None else str(l), t,
              None if i is None else str(i), s) for a, p, l, t, i, s in db_rows]
        )], page_size=BATCH_PAGE_SIZE)
        if not ok:
            print("Error: Quick Mark coordinates were not saved; the publish must not continue.")
            sys.exit(1)

    save_json_file(paths['output_highlights_file'], all_results_json)
    with open(paths['sql_highlights_file'], 'w', encoding='utf-8') as f:
        f.write('\n'.join(all_sql_updates))
    print(f"Highlight processing complete. SQL updates saved to {paths['sql_highlights_file']}")



def process_and_transfer_highlights_old(highlights_data, normalized_transcript_lines, full_transcript_data, paths, save_to_db=True):
    """
    Handles the full lifecycle for transferring highlights with enhanced debugging.
    """
    HIGHLIGHT_MATCH_THRESHOLD = 0.70  # Lenient threshold for single, possibly noisy lines
    all_results_json, all_sql_updates = [], []

    for highlight in highlights_data:
        annotid = highlight['annotid']
        
        # --- Start of new, more direct logic ---
        # 1. Prepare the single line we are searching for
        normalized_search_text = normalize_text(highlight['search_text'])
        
        best_ratio_for_this_highlight = -1.0
        best_index_for_this_highlight = -1

        # 2. Manually slide the window and compare
        for i, transcript_line in enumerate(normalized_transcript_lines):
            # We compare the strings directly now
            current_ratio = difflib.SequenceMatcher(None, normalized_search_text, transcript_line).ratio()

            if current_ratio > best_ratio_for_this_highlight:
                best_ratio_for_this_highlight = current_ratio
                best_index_for_this_highlight = i

        # 3. Add a specific debug print for the failing case
        if annotid == "7269b75c-e2c8-44a1-8b8a-b5267e02ccaf":
            print("\n--- DEBUG FOR FAILING HIGHLIGHT ---")
            print(f"Search Text: '{normalized_search_text}'")
            # Find the target line in the transcript it *should* match
            target_line_for_debug = normalize_text("this and it means this means the reservoir is not like")
            print(f"Target Text: '{target_line_for_debug}'")
            manual_ratio = difflib.SequenceMatcher(None, normalized_search_text, target_line_for_debug).ratio()
            print(f"Manually Calculated Ratio should be: {manual_ratio:.2f}")
            print(f"The script found the best ratio to be: {best_ratio_for_this_highlight:.2f} at index {best_index_for_this_highlight}")
            print("-------------------------------------\n")

        # 4. Check if the best found ratio passes the threshold
        if best_ratio_for_this_highlight > HIGHLIGHT_MATCH_THRESHOLD:
            transferred_line = full_transcript_data[best_index_for_this_highlight]
            cTPageno, cTLineno, cTTime, identity = transferred_line.get('pageno'), transferred_line.get('lineno'), transferred_line.get('timestamp'), transferred_line.get('identity')
            
            json_out = {"annotid": annotid, "new_location": {"pageno": cTPageno, "lineno": cTLineno, "timestamp": cTTime}}
            sql_out = f"""UPDATE "RHighlights" SET "cTPageno" = {cTPageno}, "cTLineno" = {cTLineno}, "cTTime" = '{cTTime}', "tidentity" = {identity} WHERE "nHid" = '{annotid}';"""
            
            all_results_json.append(json_out)
            all_sql_updates.append(sql_out)
            
            if save_to_db:
                execute_single_query('UPDATE "RHighlights" SET "cTPageno"=%s, "cTLineno"=%s, "cTTime"=%s WHERE "nHid" = %s;', (cTPageno, cTLineno, cTTime, annotid))
            print(f"  SUCCESS: Highlight {annotid} matched with ratio {best_ratio_for_this_highlight:.2f}")
        else:
            print(f"  FAILURE: Highlight {annotid} match failed. Best ratio: {best_ratio_for_this_highlight:.2f}")

    save_json_file(paths['output_highlights_file'], all_results_json)
    with open(paths['sql_highlights_file'], 'w') as f:
        f.write('\n'.join(all_sql_updates))
    print(f"Highlight processing complete. SQL updates saved to {paths['sql_highlights_file']}")


def normalize_text(text):
    if not isinstance(text, str): return ""
    text = re.sub(r'\s*\^+\S*', '', text)
    return text.strip()

if __name__ == "__main__":
    main()
