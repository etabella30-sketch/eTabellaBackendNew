from datetime import datetime
import json
import os
from typing import List, Dict, Optional,Tuple

def transform_data_highlights(result):
    annotations = []

    for row in result:
        try:
            if row[5] is None:
                continue

            nHid = str(row[0])
            cONote = row[1]
            jCordinates = row[2]
            cPageno = row[3]
            cLineno = row[4]

            details = jCordinates
            cNote_lines = [line.strip() for line in cONote.split('\n') if line.strip()]
            timestamp = row[5]
            transformed_details = []
            i = 0

            for detail in details:
                try:
                    originallinetext = cNote_lines[i] if i < len(cNote_lines) else ''
                    if timestamp == "":
                        print("timestamp is empty")
                        continue

                    parts = timestamp.split(":")

                    if len(parts) == 4:
                        timestamp = ":".join(parts[:3])

                    transformed_details.append({
                        "timestamp": timestamp,
                        "originallinetext": detail.get("text") if detail.get("text") is not None else originallinetext,
                        "x": detail["x"],
                        "y": detail["y"],
                        "height": detail.get("height", 22),
                        "width": detail.get("width", 100),
                    })
                    i += 1
                except Exception as e:
                    print(f"Error in detail processing (highlight): {e}")
                    continue

            annotations.append({
                "annotid": nHid,
                "cLineno": cLineno,
                "cPageno": cPageno,
                "detail": transformed_details
            })

        except Exception as e:
            print(f"Error in row processing (highlight): {e}")
            continue

    return annotations


def transform_data(result):
    annotations = []

    for row in result:
        try:
            nIDid = str(row[0])
            cONote = row[1]
            jCordinates = row[2]
            cPageno = row[3]

            details = jCordinates
            cNote_lines = [line.strip() for line in cONote.split('\n') if line.strip()]
            transformed_details = []
            i = 0

            for detail in details:
                try:
                    originallinetext = cNote_lines[i] if i < len(cNote_lines) else ''
                    parts = detail["t"].split(":")
                    if len(parts) == 4:
                        detail["t"] = ":".join(parts[:3])

                    transformed_details.append({
                        "timestamp": detail["t"],
                        "originallinetext":  detail.get("text") if detail.get("text") is not None else originallinetext,
                        "x": detail["x"],
                        "y": detail["y"],
                        "height": detail.get("height", 22),
                        "width": detail.get("width", 100),
                        "pageno": cPageno
                    })
                    i += 1
                except Exception as e:
                    print(f"Error in detail processing: {e}")
                    continue

            annotations.append({
                "annotid": nIDid,
                "detail": transformed_details
            })

        except Exception as e:
            print(f"Error in row processing: {e}")
            continue

    return annotations




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


def transform_db_highlight(db_result):
    """Convert DB issue rows to annotation format"""
    annotations = []
    for row in db_result:
        try:
            nIDid, text, _ ,_ ,_, time = str(row[0]), row[1], row[2], row[3],row[4], row[5]
            
            details = [{"timestamp": time, "text": text}]
            annotations.append({"annotid": nIDid, "detail": details})
        except (IndexError, TypeError) as e:
            print(f"Skipping malformed issue row: {row}. Error: {e}")
    return annotations


def save_json_file(file_path, data):
    """Save JSON file with error handling."""
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {file_path}: {e}")
        return False

def parse_timestamp(ts: str) -> datetime:
    """Parses HH:MM:SS:FF → datetime(HH, MM, SS), ignores frame."""
    h, m, s = map(int, ts.split(":")[:3])
    return datetime(1900, 1, 1, h, m, s)


def find_nearest_index(ts: datetime, candidates: List[Tuple[int, datetime]]) -> int:
    """Returns index of refresh line with nearest timestamp to `ts`."""
    return min(candidates, key=lambda item: abs((item[1] - ts).total_seconds()))[0]


def load_json_file(file_path):
    """Load JSON file with error handling."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return None