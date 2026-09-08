import json
from pathlib import Path
from typing import List, Dict, Optional
from common import save_json_file

def log_match_result(
    uuid: str,
    refresh_number: str,
    search_phrase: str,
    flat_text: str,
    start: Optional[int],
    end: Optional[int],
    output_dir: Path = Path('../data/matchlog')
):
    
    matched_slice = flat_text[start:end] if start is not None and end is not None else ""

    log_entry = {
        "search": search_phrase,
        "text": flat_text,
        "result": matched_slice,
        
        "span": {"start": start, "end": end}
    }

    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{uuid}.json"
    if output_path.exists():
        with open(output_path, 'r', encoding='utf-8') as f:
            log_data = json.load(f)
    else:
        log_data = {}

    log_data.setdefault(refresh_number, []).append(log_entry)
    save_json_file(output_path, log_data)


def delete_log_files(output_dir: Path = Path('../data/matchlog')):
    if output_dir.exists():
        for file in output_dir.glob('*.json'):
            file.unlink()  # Delete the file


def log_match_global(
    search_phrase: str,
    flat_text: str,
    output_file: Path = Path('../data/matchlog_global.txt')
):
    
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Escape triple quotes in the content if present
    safe_text = flat_text.replace('"""', '\\"""')
    safe_phrase = search_phrase.replace('"""', '\\"""')

    with open(output_file, 'a', encoding='utf-8') as f:
        f.write(f'("""{safe_text}""", """{safe_phrase}""")\n')