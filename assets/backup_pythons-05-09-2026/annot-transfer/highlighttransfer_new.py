import json
from sqlconfig import execute_single_query
from utils import find_dynamic_closest_timestamps, find_best_match # type: ignore

from datetime import datetime, timedelta
from typing import List, Dict, Optional,Tuple
from mark import FuzzyMatcher

fuzzy_Matcher = FuzzyMatcher()

results = []
sql_updates = []

def transfer_r_highlights(annotation_data,search_data,paths,save_Data=False):
    for annotation in annotation_data:
        annotid = annotation['annotid']
        try:
            
            final_annotation = transfer_annotation_with_difflib(annotation['detail'], search_data, annotid)

            # Determine page number (from first matched line if exists)
            cTPageno = final_annotation[0]['pageno'] if final_annotation else 0        
            cTTime = final_annotation[0]['timestamp'] if final_annotation else ''
            cTLineno = final_annotation[0]['index'] if final_annotation else 0
            
            # Create SQL update statement
            sql_updates.append(f'UPDATE "RHighlights" SET "cTPageno" = \'{cTPageno}\',"cTLineno"=\'{cTLineno}\',"cTTime"=\'{cTTime}\' WHERE "nHid" = "{annotid}";')
            #if len(data)>1:
        #  #   print('\n\n',annotid)
            if save_Data:
                update_query = 'UPDATE "RHighlights" SET "cTPageno"=%s,"cTLineno" = %s,"cTTime"= %s  WHERE "nHid" = %s;'
                execute_single_query(update_query, (cTPageno,cTLineno,cTTime, annotid))
                #cursor.execute(update_query, (cTPageno,cTLineno,cTTime, annotid))
                #conn.commit()

        except Exception as e:
            print(f"\n\n\n\n \nError processing highlight annotid {annotid}: {e}")

    # Save results to a JSON file
    with open(paths['output_file'], 'w') as outfile:
        json.dump(results, outfile, indent=4)

    # Save SQL update script to a file
    with open(paths['sql_output_file'], 'w') as sql_file:
        sql_file.write('\n'.join(sql_updates))
    
    print("RHighlights Results saved to", paths['output_file'])
    print("RHighlights SQL update script saved to", paths['sql_output_file'])
    
    
    
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

    start_idx = find_nearest_index(start_ts, transcript_indexed)

    final_start = max(start_idx - 1, 0)
    final_end = min(start_idx + 1, len(transcript_indexed) - 1)
    print(f"Final start: {final_start}, Final end: {final_end}")
    matched_block = [transcript_indexed[i][2] for i in range(final_start, final_end + 1)]
    print(f"Matched block size: {matched_block}")

    # Step 3: Fuzzy match
    search_phrase = " ".join([entry["text"] for entry in annotation if entry.get("text")])
    word_list = [entry["linetext"] for entry in matched_block]
    print(f"Searching for phrase: '{search_phrase}' in {len(word_list)} words")
    res,lineno = fuzzy_Matcher.find_best_match_index_difflib(word_list, search_phrase)
    print(f"\n\n\n Fuzzy match result: {res}, Line number: {matched_block} \n\n\n")
    matched_lines = []

    matched_lines.append({
        "timestamp": matched_block[lineno]["timestamp"],
        "index": matched_block[lineno]["lineno"],
        "pageno": matched_block[lineno].get("pageno", 0),  # ✅ include page number
    })
    print(f"Matched line: {matched_lines}")

    return matched_lines


def find_nearest_index(ts: datetime, candidates: List[Tuple[int, datetime]]) -> int:
    """Returns index of refresh line with nearest timestamp to `ts`."""
    return min(candidates, key=lambda item: abs((item[1] - ts).total_seconds()))[0]
