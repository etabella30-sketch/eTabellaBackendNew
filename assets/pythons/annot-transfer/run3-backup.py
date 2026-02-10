import os, sys, re, json, time, difflib
from pathlib import Path
from sqlconfig import execute_query, execute_single_query
from common import load_json_file, save_json_file, parse_timestamp, find_nearest_index
from ssr import refine_by_fuzzy_edges_advanced_with_patch

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
    """Parses transcript text into structured lines with timestamps and page numbers"""
    lines, parsed_lines, page_no = text.strip().split('\n'), [], 1
    start_index = 0  # starting point for index (as string later)
    for line in lines:
        match = re.match(r'^\s*(\d+)\s+(\d{2}:\d{2}:\d{2})\s*(.*)', line)
        if match:
            start_index += 1
            parsed_lines.append({
                "lineno": int(match.group(1)),
                "timestamp": match.group(2),
                "text": match.group(3).strip(),
                "pageno": page_no,
                "index": int(match.group(1)) - 1,  # 0-based index for matching
                "identity": str(start_index)  # store as string
            })
            if int(match.group(1)) % 25 == 0:
                page_no += 1
    return parsed_lines

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

def transfer_annotation_with_difflib(annotation, transcript_data, uuid, debug=False):
    """Transfers a single annotation to the parsed transcript using fuzzy matching (with page numbers)."""
    if not annotation:
        return []

    # Step 1: Index transcript by timestamp
    transcript_indexed = [
        (i, parse_timestamp(entry["timestamp"]), entry)
        for i, entry in enumerate(transcript_data)
        if entry.get("timestamp") and entry.get("text")
    ]
    if not transcript_indexed:
        return []
    print(f"Indexed {len(transcript_indexed)} transcript lines.")
    # Step 2: Determine annotation span
    start_ts = parse_timestamp(annotation[0]["timestamp"])
    end_ts = parse_timestamp(annotation[-1]["timestamp"])

    start_idx = find_nearest_index(start_ts, transcript_indexed)
    end_idx = find_nearest_index(end_ts, transcript_indexed)
    if start_idx > end_idx:
        start_idx, end_idx = end_idx, start_idx

    final_start = max(start_idx - 2, 0)
    final_end = min(end_idx + 2, len(transcript_indexed) - 1)
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
            nIDid, _, jCordinates, _ = str(row[0]), row[1], row[2], row[3]
            if not jCordinates:
                continue
            details = [{"timestamp": d.get("t"), "text": d.get("text", "").strip()} for d in jCordinates]
            annotations.append({"annotid": nIDid, "detail": details})
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
    raw_issues = execute_query('et_realtime_get_annotation_by_session', f'{{"nSessionid":"{sessionid}"}}')
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
    all_results = {}
    sql_updates = []

    for issue in issues_to_transfer:
        uuid = issue['annotid']
        try:
            final_annotation = transfer_annotation_with_difflib(issue['detail'], parsed_transcript, uuid)
            all_results[uuid] = final_annotation

            # Determine page number (from first matched line if exists)
            page_number = final_annotation[0]['pageno'] if final_annotation else 0

            # Build JSON coordinates for SQL update (including page number)
            json_lines = [
                {
                    "t": line["timestamp"],
                    "p": line["pageno"],  # now using real page number
                    "l": line["index"] + 1,
                    "text": line["text"],
                    "identity":line["identity"],  # ✅ include page number
                    "x": 0, "y": 0, "width": 0, "height": 21.5
                }
                for line in final_annotation
            ]
            
            jTCordinates = json.dumps(json_lines)
            
            # Generate SQL statement
            sql_out = f"""UPDATE "RIssueDetail" 
                        SET "jTCordinates" = '{jTCordinates.replace("'", "''")}', 
                            "cTPageno" = {page_number}, 
                            "bTrf" = {True} 
                        WHERE "nIDid" = '{uuid}';"""
            sql_updates.append(sql_out)

            # Optional: Update DB directly
            if final_annotation:  # only update if something matched
                execute_single_query(
                    'UPDATE "RIssueDetail" SET "jTCordinates" = %s, "cTPageno" = %s, "bTrf" = %s WHERE "nIDid" = %s;',
                    (jTCordinates, page_number, True, uuid)
                )
            # print(f"Processed annotation {uuid} → {len(final_annotation)} matched lines, page {page_number}")

            # Step 4: Save combined JSON and SQL file
            save_json_file(paths['output_issues_file'], all_results)
            with open(paths['sql_issues_file'], 'w', encoding='utf-8') as f:
                f.write("\n".join(sql_updates))

            print(f"\ All issues processed.")
            print(f"JSON output: {paths['output_issues_file']}")
            print(f"SQL script: {paths['sql_issues_file']}")
            print(" Database has been updated as well.")
        except Exception as e:
                print(f"Error processing issue {uuid}: {e}")
                continue


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
    all_results_json, all_sql_updates = [], []

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

        if start_time_str:
            try:
                start_ts = parse_timestamp(start_time_str)
            except Exception:
                start_ts = None

            if start_ts is not None and transcript_indexed:
                # nearest idx in transcript_indexed (this returns an index INTO transcript_indexed)
                start_idx_in_idxed = find_nearest_index(start_ts, transcript_indexed)

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
        if best_ratio < HIGHLIGHT_MATCH_THRESHOLD:
            for global_i, norm_line in enumerate(normalized_transcript_lines):
                r = difflib.SequenceMatcher(None, normalized_search_text, norm_line).ratio()
                if r > best_ratio:
                    best_ratio = r
                    best_global_idx = global_i

        # -------- emit if above threshold --------
        if best_ratio > HIGHLIGHT_MATCH_THRESHOLD and best_global_idx != -1:
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
                f'SET "cTPageno" = {cTPageno}, "cTLineno" = {cTLineno}, "cTTime" = \'{cTTime}\' ,"tidentity" = {identity}'
                f'WHERE "nHid" = \'{annotid}\';'
            )

            all_results_json.append(json_out)
            all_sql_updates.append(sql_out)
            # save_to_db=True
            if save_to_db:
                execute_single_query(
                    'UPDATE "RHighlights" SET "cTPageno"=%s, "cTLineno"=%s, "cTTime"=%s,"tidentity" = %s WHERE "nHid" = %s;',
                    (cTPageno, cTLineno, cTTime,identity, annotid)
                )

            print(f"  SUCCESS: Highlight {annotid} matched "
                  f"(ratio {best_ratio:.2f}, {'±2 window' if used_local_window else 'global'})")
        else:
            print(f"  FAILURE: Highlight {annotid} match failed. Best ratio: {best_ratio:.2f}")

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
