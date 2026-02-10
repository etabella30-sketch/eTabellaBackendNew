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
    os.makedirs(issues_folder, exist_ok=True)
    return {
        'issues_folder': issues_folder,
        'raw_issues_file': os.path.join(issues_folder, f'raw_issues_{sessionid}.json'),
        'parsed_transcript_file': os.path.join(issues_folder, f'parsed_transcript_{sessionid}.json'),
        'output_issues_file': os.path.join(issues_folder, f'output_issues_{sessionid}.json'),
        'sql_issues_file': os.path.join(issues_folder, f'update_script_issues.sql'),
    }

def read_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def parse_text(text):
    """Parses transcript text into structured lines with timestamps and page numbers"""
    lines, parsed_lines, page_no = text.strip().split('\n'), [], 1
    for line in lines:
        match = re.match(r'^\s*(\d+)\s+(\d{2}:\d{2}:\d{2})\s*(.*)', line)
        if match:
            parsed_lines.append({
                "lineno": int(match.group(1)),
                "timestamp": match.group(2),
                "text": match.group(3).strip(),
                "pageno": page_no,
                "index": int(match.group(1)) - 1  # 0-based index for matching
            })
            if int(match.group(1)) % 25 == 0:
                page_no += 1
    return parsed_lines

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
            "text": reconstructed_text
        })

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

# def main():
    
def transfer_issue(draft_path,sessionid):
    # sessionid = "744448df-5e94-4471-bb1e-f348073f8860"
    # draft_path = f's_{sessionid}.TXT'
    paths = generate_paths(sessionid)

    # Step 1: Fetch DB issues
    print("Fetching issues from DB...")
    raw_issues = execute_query('et_realtime_get_annotation_by_session', f'{{"nSessionid":"{sessionid}"}}')
    save_json_file(paths['raw_issues_file'], raw_issues)

    # Step 2: Parse single transcript
    print("Parsing transcript file...")
    transcript_text = read_file(draft_path)
    parsed_transcript = parse_text(transcript_text)
    save_json_file(paths['parsed_transcript_file'], parsed_transcript)
    

    # Step 3: Transform and Transfer Issues
    print("Processing Issues...")
    issues_to_transfer = transform_db_issues(raw_issues)
    print(f"Found {len(issues_to_transfer)} issues to transfer.")
    all_results = {}
    sql_updates = []

    for issue in issues_to_transfer:
        uuid = issue['annotid']
        final_annotation = transfer_annotation_with_difflib(issue['detail'], parsed_transcript, uuid)
        all_results[uuid] = final_annotation
        print(f"Processed issue {uuid} → {len(final_annotation)} matched lines")

        # Determine page number (from first matched line if exists)
        page_number = final_annotation[0]['pageno'] if final_annotation else 0

        # Build JSON coordinates for SQL update (including page number)
        json_lines = [
            {
                "t": line["timestamp"],
                "p": line["pageno"],  # now using real page number
                "l": line["index"] + 1,
                "text": line["text"],
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
        # if final_annotation:  # only update if something matched
        #     execute_single_query(
        #         'UPDATE "RIssueDetail" SET "jTCordinates" = %s, "cTPageno" = %s, "bTrf" = %s WHERE "nIDid" = %s;',
        #         (jTCordinates, page_number, True, uuid)
        #     )

        print(f"Processed annotation {uuid} → {len(final_annotation)} matched lines, page {page_number}")

    # Step 4: Save combined JSON and SQL file
    save_json_file(paths['output_issues_file'], all_results)
    with open(paths['sql_issues_file'], 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_updates))

    print(f"\n✅ All issues processed.")
    print(f"JSON output: {paths['output_issues_file']}")
    print(f"SQL script: {paths['sql_issues_file']}")
    print("✅ Database has been updated as well.")

if __name__ == "__main__":
    main()
