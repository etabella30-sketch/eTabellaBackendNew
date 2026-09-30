import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Optional,Tuple


def load_json_file(file_path):
    """Load JSON file with error handling."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return None

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
    
def printj(k,j):
    print(f"\n print {k}",json.dumps(j, indent=4))


def parse_timestamp(ts: str) -> datetime:
    """Parses HH:MM:SS:FF → datetime(HH, MM, SS), ignores frame."""
    h, m, s = map(int, ts.split(":")[:3])
    return datetime(1900, 1, 1, h, m, s)


def find_nearest_index(ts: datetime, candidates: List[Tuple[int, datetime]]) -> int:
    """Returns index of refresh line with nearest timestamp to `ts`."""
    return min(candidates, key=lambda item: abs((item[1] - ts).total_seconds()))[0]
