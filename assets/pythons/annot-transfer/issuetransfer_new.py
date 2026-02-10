
import json
from sqlconfig import execute_single_query
from utils import find_dynamic_closest_timestamps, find_best_match # type: ignore

from typing import List, Dict, Optional,Tuple
from datetime import datetime, timedelta
from ssr import refine_by_fuzzy_edges_advanced_with_patch

results = []
sql_updates = []

def transfer_issue_detail(annotation_data,search_data,paths,save_Data=False):
    # Process each annotation
    all_results = {}
    for annotation in annotation_data:
        annotid = annotation['annotid']
        try:
            """  if not annotation.get('detail'):  # skip if detail is missing or empty
                raise ValueError("No details found for annotation")
            # Extract first and last timestamps from annotation data
            first_timestamp = annotation['detail'][0]['timestamp']
            last_timestamp = annotation['detail'][-1]['timestamp']

            # Find dynamic closest lower and upper timestamps
            n = 1  # Number of closest timestamps to find
            closest_lowers, closest_uppers = find_dynamic_closest_timestamps(search_data, first_timestamp, last_timestamp, n)

            # Determine extended timestamp range
            extended_start_timestamp = closest_lowers[-1]['timestamp'] if closest_lowers else first_timestamp
            extended_end_timestamp = closest_uppers[-1]['timestamp'] if closest_uppers else last_timestamp
            #print(extended_start_timestamp, extended_end_timestamp)
            # Filter search data based on extended timestamp range
            filtered_search_data = [
                entry for entry in search_data
                if extended_start_timestamp <= entry['timestamp'] <= extended_end_timestamp
            ]
            
            # Get the first 3 and last 3 entries from the filtered data
            first_three_entries = filtered_search_data[:3]
            last_three_entries = filtered_search_data[-3:]
        # print('last_three_entries = ',last_three_entries)
            # Extract originallinetext
            first_detail_text = annotation['detail'][0]['originallinetext']
            last_detail_text = annotation['detail'][-1]['originallinetext']

            # Find best matches
            best_match_start = find_best_match(first_three_entries, first_detail_text)

        # print('searching = ',last_detail_text)
            best_match_end = find_best_match(last_three_entries, last_detail_text)
        # print('best_match_end = ',best_match_end)

            # Function to remove additional fields for comparison
            def remove_additional_fields(entry):
                return {key: entry[key] for key in entry if key not in ['start_index', 'end_index', 'match_ratio']}

            # Handle cases where best matches are None
            if not best_match_start and closest_lowers:
                best_match_start = closest_lowers[0]
            if not best_match_end and closest_uppers:
                best_match_end = closest_uppers[0]

            # Raise an error if both best matches are None
            if not best_match_start and not best_match_end:
                raise ValueError("Both best match start and end are None")
            #print('\n\n',best_match_start)
            # Get indices of best matches in the filtered search data
            start_index = filtered_search_data.index(remove_additional_fields(best_match_start))
            end_index = filtered_search_data.index(remove_additional_fields(best_match_end))
        # print(start_index,end_index)
            # Extract all lines between best matches
            lines_between_best_matches = filtered_search_data[start_index:end_index + 1]
            #print('\n\n',lines_between_best_matches)
            # Update lines_between_best_matches
            
            
            #print('\n\n')
            #print(json.dumps(lines_between_best_matches,indent=4))
        # print('\n\n')
            
            transformed_lines = []

            for line in lines_between_best_matches:
            # print('line = \n\n',line)
                new_line = {
                    't': line.get('timestamp'),
                    'x': 0,
                    'y': 0,
                    'width': 0,
                    'height': 21.5,
                    'p':line.get('pageno')
                }
                if 'lineno' in line:
                    new_line['l'] = line['lineno']
                if 'linetext' in line:
                    new_line['text'] = line['linetext']
                
                # Add the new transformed line to the new array
                transformed_lines.append(new_line)


            #print('\n\n transformed_lines =',transformed_lines)
            if transformed_lines:
                transformed_lines[0].update({
                    'x': annotation['detail'][0]['x'],
                    'y': annotation['detail'][0]['y'],
                    'text': annotation['detail'][0]['originallinetext'],
                })
                if(len(transformed_lines)>1):
                    transformed_lines[-1].update({
                        'x': annotation['detail'][-1]['x'],
                        'y': annotation['detail'][-1]['y'],
                        'text': annotation['detail'][-1]['originallinetext'],
                    })

            results.append({
                "annotid": annotid,
                "lines": transformed_lines,
                
            })
            """
            # print(f"Processing issue {annotid} with {len(annotation['detail'])} details")
            # uuid = annotation['annotid']
            final_annotation = transfer_annotation_with_difflib(annotation['detail'], search_data, annotid)
            # print(f"\n\n\n\n Final annotation for {annotid}: {final_annotation} \n\n\n")
            all_results[annotid] = final_annotation
            # print(f"\n\n\n\n  Processed issue {all_results} matched lines")

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
            # print(f"Transformed lines for {annotid}: {json_lines}")
            jTCordinates = json.dumps(json_lines)
            # cTPageno = json_lines[0]['p']
            # jTCordinates = json.dumps(transformed_lines)
            # Create SQL update statement
            sql_updates.append(f'UPDATE "RIssueDetail" SET "jTCordinates" = \'{jTCordinates}\',"cTPageno"={page_number},"bTrf"={True} WHERE "nIDid" = "{annotid}";')
            if save_Data:
                
                update_query = 'UPDATE "RIssueDetail" SET "jTCordinates" = %s, "cTPageno" = %s, "bTrf" = %s  WHERE "nIDid" = %s;'
                execute_single_query(update_query, (jTCordinates,page_number, True,annotid))
                #print(f"Updated annotation {annotid} with transformed data")
        except Exception as e:
            print(f"Error processing r annotid {annotid}: {e}")

    # Save results to a JSON file
    with open(paths['output_file'], 'w') as outfile:
        json.dump(results, outfile, indent=4)

    # Save SQL update script to a file
    with open(paths['sql_output_file'], 'w') as sql_file:
        sql_file.write('\n'.join(sql_updates))

    print("Issue detail Results saved to", paths['output_file'])
    print("Issue detail SQL update script saved to", paths['sql_output_file'])



def parse_timestamp(ts: str) -> datetime:
    try:
        """Parses HH:MM:SS:FF → datetime(HH, MM, SS), ignores frame."""
        h, m, s = map(int, ts.split(":")[:3])
        return datetime(1900, 1, 1, h, m, s)
    except ValueError as e:
        print(f"Error parsing timestamp {ts}: {e}")
        return datetime(1900, 1, 1, 0, 0, 0)

def normalize_timestamp(ts: str) -> str:
    """
    Ensures timestamp is HH:MM:SS:FF (adds :00 if only 3 parts).
    """
    parts = ts.split(":")
    if len(parts) == 3:  # HH:MM:SS
        return ts + ":00"
    return ts  # Already HH:MM:SS:FF


def transfer_annotation_with_difflib(annotation, transcript_data, uuid, debug=False):
    """Transfers a single annotation to the parsed transcript using fuzzy matching (with page numbers)."""
    if not annotation:
        return []
    # print(f"Transferring annotation {uuid} with {annotation[0]} details {transcript_data[0]}")
    # Step 1: Index transcript by timestamp
    transcript_indexed = [
        (i, parse_timestamp(normalize_timestamp(entry["timestamp"])), entry)
        for i, entry in enumerate(transcript_data)
        if entry.get("timestamp") and entry.get("linetext")
    ]
    if not transcript_indexed:
        return []
    # Step 2: Determine annotation span
    start_ts = parse_timestamp(annotation[0]["timestamp"])
    end_ts = parse_timestamp(annotation[-1]["timestamp"])
    # end_ts = parse_timestamp(annotation[len(annotation)-1]["timestamp"])
    # print(f"Annotation {uuid} spans from {start_ts} to {end_ts}")

    start_idx = find_nearest_index(start_ts, transcript_indexed)
    end_idx = find_nearest_index(end_ts, transcript_indexed)
    # print(f"Start index: {start_idx}, End index: {end_idx}")
    if start_idx > end_idx:
        start_idx, end_idx = end_idx, start_idx

    final_start = max(start_idx - 2, 0)
    final_end = min(end_idx + 2, len(transcript_indexed) - 1)
    matched_block = [transcript_indexed[i][2] for i in range(final_start, final_end + 1)]

    # Step 3: Fuzzy match
    # print(f"Matched block size\n\n\n: {len(matched_block)} {annotation[0]}")
    search_phrase = " ".join([entry["text"] for entry in annotation if entry.get("text")])
    flat_text, word_list, position_list, char_spans = flatten_transcript(matched_block)

    start, end, res = refine_by_fuzzy_edges_advanced_with_patch(flat_text, search_phrase)
    if start is None or end is None:
        return []

    matched_words = [i for i, (w_start, w_end) in enumerate(char_spans) if w_start < end and w_end > start]
    if not matched_words:
        return []
    # print(f"Matched words: {matched_words} for search phrase '{search_phrase}'")
    # Step 4: Map matched words back to transcript lines
    line_map = {}
    for word_idx in matched_words:
        line_index, word_index = position_list[word_idx]
        word = word_list[word_idx]
        line_map.setdefault(line_index, []).append((word_index, word))
    
    matched_lines = []
    try:
        for line_index in sorted(line_map.keys()):
            true_line_index = transcript_indexed[final_start + line_index][0]
            # print(f" \n\n\n Processing line {line_index} (true index {true_line_index})")
            original_line = transcript_data[true_line_index]
            word_indices = sorted(line_map[line_index])
            # print(f"\n Matched words indices: {word_indices}")
            words = original_line["linetext"].split()
            # print(f"\n Line {line_index} (true index {true_line_index}) matched words: {word_indices}")
            reconstructed_text = " ".join(
                words[i] for i, _ in word_indices if 0 <= i < len(words)
            )

            matched_lines.append({
                "timestamp": original_line["timestamp"],
                "index": original_line["lineno"],
                "pageno": original_line.get("pageno", 0),  # ✅ include page number
                "text": reconstructed_text
            })
    except Exception as e:
        print(f"Error reconstructing matched lines: {e}")
        return []

    return matched_lines



def find_nearest_index(ts: datetime, candidates: List[Tuple[int, datetime]]) -> int:
    """Returns index of refresh line with nearest timestamp to `ts`."""
    return min(candidates, key=lambda item: abs((item[1] - ts).total_seconds()))[0]



def flatten_transcript(transcript):    
    try:
        
        """Flatten transcript lines into a single text and positional mapping"""
        word_list, position_list, char_spans = [], [], []
        char_index = 0

        for line_index, entry in enumerate(transcript):
            words = entry['linetext'].split()
            for word_index, word in enumerate(words):
                word_list.append(word)
                position_list.append((line_index, word_index))
                start = char_index
                end = start + len(word)
                char_spans.append((start, end))
                char_index = end + 1  # +1 for space

        return " ".join(word_list), word_list, position_list, char_spans
    except Exception as e:
        print(f"Error flattening transcript: \n\n\n {e}")
        return "", [], [], []