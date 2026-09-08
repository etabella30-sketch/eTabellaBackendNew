import os
import re
import json
from pathlib import Path
#from edge_finder import get_best_span
from typing import List, Dict, Optional
from common import load_json_file, save_json_file,parse_timestamp, find_nearest_index
from searchlog import log_match_result,delete_log_files
from findService import refine_by_fuzzy_edges_advanced_with_patch
from concurrent.futures import ThreadPoolExecutor

import sys, io

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except AttributeError:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


def tokenize(text: str):
    """
    Split into tokens where punctuation is separated.
    'them.' -> ['them', '.']
    "It's" -> ["It", "'s"]
    """
    clean_text = text.replace("^", "")
    return re.findall(r"\w+|[^\w\s]", clean_text)


def flatten_transcript(transcript):
    word_list = []
    position_list = []
    char_spans = []
    char_index = 0

    for line_index, entry in enumerate(transcript):
        words = entry['text'].split()
        # Remove all '^' from the text before splitting
        # clean_text = entry['text'].replace("^", "")
        # words = clean_text.split()
        # words = tokenize(entry['text'])
        for word_index, word in enumerate(words):
            word_list.append(word)
            position_list.append((line_index, word_index))
            start = char_index
            end = start + len(word)
            char_spans.append((start, end))
            char_index = end + 1  # +1 for space

    flat_text = " ".join(word_list)
    return flat_text, word_list, position_list, char_spans


def clean_refresh_data(refresh_data):
    cleaned = []
    skip_next = False
    
    for i, obj in enumerate(refresh_data):
        text = obj["text"].strip()

        # If the line itself is an HTTP link, skip it and mark next for potential skip
        if text.startswith("http"):
            skip_next = True
            continue

        # If previous line was a link and this line is likely a continuation:
        #   - No spaces
        #   - Length > 20
        #   - Alphanumeric or token-like
        if skip_next and (len(text) > 20 and " " not in text):
            continue
        else:
            skip_next = False

        cleaned.append(obj)

    return cleaned


def transfer_annotation_with_difflib(annotation, refresh_data_row, refresh_number, **matcher_kwargs):
    if not annotation:
        return []

    # for idx, obj in enumerate(refresh_data_row):
    #     if "index" not in obj:
    #         obj["index"] = idx

    refresh_data = clean_refresh_data(refresh_data_row)
    # Parse and clean refresh data
    refresh_indexed = [
        (i, parse_timestamp(entry["timestamp"]), entry)
        for i, entry in enumerate(refresh_data)
        if entry.get("timestamp") and entry.get("text")
    ]
    if not refresh_indexed:
        return []

    # Parse annotation timestamps (first & last only)
    start_ts = parse_timestamp(annotation[0]["timestamp"])
    end_ts   = parse_timestamp(annotation[-1]["timestamp"])

    # Find nearest refresh index to start and end
    start_idx = find_nearest_index(start_ts, refresh_indexed)
    end_idx   = find_nearest_index(end_ts, refresh_indexed)

    # Ensure start ≤ end
    if start_idx > end_idx:
        start_idx, end_idx = end_idx, start_idx

    # Extend 2 lines above and below
    final_start = max(start_idx - 2, 0)
    final_end   = min(end_idx + 2, len(refresh_indexed) - 1)
    
    matched_block = [refresh_indexed[i][2] for i in range(final_start, final_end + 1)]
    
    search_phrase = " ".join([entry["text"] for entry in annotation if entry.get("text")])
    
    flat_text, word_list, position_list, char_spans = flatten_transcript(matched_block)
    #print(f"search_phrase word count: {len(search_phrase.split())}, flat_text word count: {len(word_list)}")
    # flat_text = flat_text.replace("^", "")
    # search_phrase = search_phrase.replace("^", "")
    # if len(search_phrase.split()) <=5 :
    #     match = locate_span_flat(flat_text, search_phrase, max_extra=80)
    #     start,end = (match.start, match.end) if match else (None, None)
    # else:
    #     start, end = get_best_span(flat_text, search_phrase)
    res=""
    start, end,res = refine_by_fuzzy_edges_advanced_with_patch(flat_text, search_phrase)
    #print(f"search_phrase: {search_phrase}, flat_text length: {flat_text}")
    #start, end = find_span_edges_v4(flat_text, search_phrase)
    # if debug:
    #     log_match_result(
    #         uuid=uuid,
    #         refresh_number=refresh_number,
    #         search_phrase=search_phrase,
    #         flat_text=flat_text,
    #         start=start,
    #         end=end
    #     )
    #print(f"search_phrase: {search_phrase}, start: {start}, end: {end}")
    if start is None or end is None:
        return []

    matched_words = []
    for i, (w_start, w_end) in enumerate(char_spans):
        if w_end <= start:
            continue
        if w_start >= end:
            break
        matched_words.append(i)

    if not matched_words:
        return []

    # Step 5: Map word indexes to lines and reconstruct
    line_map = {}
    for word_idx in matched_words:
        line_index, word_index = position_list[word_idx]
        word = word_list[word_idx]
        line_map.setdefault(line_index, []).append((word_index, word))

    matched_lines = []
    for line_index in sorted(line_map.keys()):
        # true_line_index = final_start + line_index
        true_line_index = refresh_indexed[final_start + line_index][0]
        original_line = refresh_data[true_line_index]
        word_indices = sorted(line_map[line_index])
        words = original_line["text"].split()
        # words = tokenize(original_line["text"])
        try:
            safe_words = []
            for i, _ in word_indices:
                if 0 <= i < len(words):
                    safe_words.append(words[i])
                else:
                    # Optionally log this for debugging
                    print(f"[WARN] Out-of-range index {i} for line {true_line_index} -> {words}")
            reconstructed_text = " ".join(safe_words)

            # reconstructed_text = " ".join(words[i] for i, _ in word_indices)
        except IndexError:
            print(f"❌ IndexError at line {true_line_index} with word_indices {word_indices}")
            continue
        matched_lines.append({
            "timestamp": original_line["timestamp"],
            "index": original_line["index"],
            "text": reconstructed_text
        })

    return matched_lines
    

def find_end_edge(
    haystack: str,
    needle: str,
    **kwargs
) -> int | None:
    return None


# def annotSearch(original_annotation,refresh_data,refresh_number):
#     current_annotation = original_annotation
#     result = transfer_annotation_with_difflib(current_annotation, refresh_data, refresh_number)
#     return result

def annotSearch(original_annotation, refresh_data, refresh_number):
    """
    Search annotation in refresh_data using same logic as main:
    - If <=4 lines -> direct search
    - If >4 lines -> split start/end, merge into flat list
    """
    current_annotation = original_annotation


    # Decide if we split
    is_short = len(current_annotation) <= 4
    if not is_short:
        startAlgo = current_annotation[:4]
        endAlgo   = current_annotation[-4:]
        parts_to_process = [("startAlgo", startAlgo), ("endAlgo", endAlgo)]
    else:
        parts_to_process = [("shortAlgo", current_annotation)]

    combined_results = {}

    # Process each part
    for part_name, part_data in parts_to_process:
        result = transfer_annotation_with_difflib(part_data, refresh_data, refresh_number)
        combined_results[part_name] = result

    # Build flat annotation
    if not is_short and combined_results.get("startAlgo") and combined_results.get("endAlgo"):
        
        print("LONG RESULT")
        start_res = combined_results["startAlgo"]
        end_res   = combined_results["endAlgo"]

        if start_res and end_res:
            # Take first match from startAlgo and last from endAlgo
            first_line = start_res[0]
            last_line  = end_res[-1]
            first_idx  = first_line["index"]
            last_idx   = last_line["index"]

            # All lines strictly between
            between_lines = [
                obj for obj in refresh_data
                if first_idx < obj["index"] < last_idx
            ]

            final_annotation = [first_line] + between_lines + [last_line]
            return final_annotation

        else:
            # Fallback: return whichever part has result
            return start_res or end_res or []

    else:
        print("SHORT RESULT")
        # Short annotation → return directly as flat list
        return combined_results["shortAlgo"]