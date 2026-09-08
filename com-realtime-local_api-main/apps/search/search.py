import os
import re
import logging
import json
from typing import List
from flask import Flask, request, jsonify
from datetime import datetime
import execution
import time


# ─── Setup Logging ─────────────────────────────────────────────────────────────
LOG_DIR = os.path.join('logs', 'python')
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'app.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s - %(message)s',
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler()]
)

app = Flask(__name__)
logger = logging.getLogger(__name__)

# ─── 1) Normalizer (preserve ^doc), strip other ^… tokens ──────────────────────
def normalize(text: str) -> str:
    text = re.sub(r"\^doc[\.\)]", "DOCPAT", text, flags=re.IGNORECASE)
    # strip other ^… tokens
    text = re.sub(r"\^([^\s\)]+)\)?", r"\1", text)
    # drop punctuation
    text = re.sub(r"[^\w\s]", "", text)
    # restore ^doc marker
    text = text.replace("DOCPAT", "^doc)")
    return re.sub(r"\s+", " ", text).strip().lower()

# ─── 2) Filter truly noisy lines ────────────────────────────────────────────────
def filter_search_lines(lines: List[str]) -> List[str]:
    noise = re.compile(
        r"https?://|bridge\?|session=|passhash=|vm\d+|click link below|join session",
        re.IGNORECASE
    )
    return [normalize(l) for l in lines if not noise.search(l)]

# ─── Helper function to convert character index to line number ──────────────────
def get_line_number(text: str, char_index: int) -> int:
    """Convert character index to line number (0-based)"""
    if char_index is None or char_index < 0:
        return -1
    return text[:char_index].count('\n')

# ─── 3) API Endpoint ───────────────────────────────────────────────────────────
@app.route('/match', methods=['POST'])
def match_endpoint():
    data = request.get_json(force=True)
    content = data.get('contentText')
    search  = data.get('searchText')
    isStart = data.get('isStart')
    threshold = data.get('threshold', 80)

    if not isinstance(content, list) or not isinstance(search, list):
        logger.warning("Invalid payload: contentText and searchText must be lists.")
        return jsonify({"error": "contentText and searchText must be lists of strings."}), 400

    clean_search = filter_search_lines(search)
    clean_content = [normalize(l) for l in content]

    logger.info(
        f"Matching {len(clean_search)} filtered search lines against "
        f"{len(clean_content)} content lines with primary threshold {threshold}"
    )

    text = "\n".join(clean_content)
    phrase = "\n".join(clean_search)
    
    if(isStart):
        indx = execution.find_start_edge(text, phrase, max_extra=10, min_ratio=80)
        tail = text[indx:]
        line_number = get_line_number(text, indx)
        primaryLine = tail.split('\n')[0]
        logger.info(f"Start edge found at character index {indx}, line number {line_number}")
    else:
        indx = execution.find_end_edge(text, phrase, max_extra=10, min_ratio=80)
        tail = text[:indx]
        line_number = get_line_number(text, indx)
        primaryLine = tail.split('\n')[-1]
        logger.info(f"End edge found at character index {indx}, line number {line_number}")

    result = {
        "clean_search": clean_search,
        "clean_content": clean_content,
        "tail": tail,
        "character_index": indx,
        "line_number": line_number,
        "primaryLine": primaryLine,
        "total_lines": len(clean_content)
    }
    return jsonify({"match": result}), 200

# ─── 4) API Endpoint - Single Match (Both Start and End) ───────────────────────
@app.route('/match-single', methods=['POST'])
def match_single_endpoint():
    data = request.get_json(force=True)
    start_content_text = data.get('startContentText')
    start_search_text = data.get('startSearchText')
    end_content_text = data.get('endContentText')
    end_search_text = data.get('endSearchText')
    threshold = data.get('threshold', 80)

    # Validate input parameters
    if not isinstance(start_content_text, list) or not isinstance(start_search_text, list):
        logger.warning("Invalid payload: startContentText and startSearchText must be lists.")
        return jsonify({"error": "startContentText and startSearchText must be lists of strings."}), 400
    
    if not isinstance(end_content_text, list) or not isinstance(end_search_text, list):
        logger.warning("Invalid payload: endContentText and endSearchText must be lists.")
        return jsonify({"error": "endContentText and endSearchText must be lists of strings."}), 400

    logger.info(f"Processing single match with start content: {len(start_content_text)} lines, end content: {len(end_content_text)} lines")

    # Process START content and search
    clean_start_content = [normalize(l) for l in start_content_text]
    clean_start_search = filter_search_lines(start_search_text)
    start_text = "\n".join(clean_start_content)
    start_phrase = "\n".join(clean_start_search)
    
    start_indx = execution.find_start_edge(start_text, start_phrase, max_extra=10, min_ratio=80)
    start_tail = start_text[start_indx:]
    start_line_number = get_line_number(start_text, start_indx)
    start_primary_line = start_tail.split('\n')[0] if start_tail else ""
    
    start_result = {
        "clean_search": clean_start_search,
        "clean_content": clean_start_content,
        "tail": start_tail,
        "character_index": start_indx,
        "line_number": start_line_number,
        "primaryLine": start_primary_line,
        "total_lines": len(clean_start_content)
    }

    # Process END content and search
    clean_end_content = [normalize(l) for l in end_content_text]
    clean_end_search = filter_search_lines(end_search_text)
    end_text = "\n".join(clean_end_content)
    end_phrase = "\n".join(clean_end_search)
    
    end_indx = execution.find_end_edge(end_text, end_phrase, max_extra=10, min_ratio=80)
    end_tail = end_text[:end_indx]
    end_line_number = get_line_number(end_text, end_indx)
    end_primary_line = end_tail.split('\n')[-1] if end_tail else ""
    
    end_result = {
        "clean_search": clean_end_search,
        "clean_content": clean_end_content,
        "tail": end_tail,
        "character_index": end_indx,
        "line_number": end_line_number,
        "primaryLine": end_primary_line,
        "total_lines": len(clean_end_content)
    }

    logger.info(f"Start edge found at character index {start_indx}, line number {start_line_number}")
    logger.info(f"End edge found at character index {end_indx}, line number {end_line_number}")

    # Check if start and end are on the same line and same content
    response_data = {"start_result": start_result, "end_result": end_result}
    
    if (start_line_number == end_line_number and 
        start_content_text == end_content_text and 
        start_indx is not None and end_indx is not None and 
        start_indx < end_indx and
        start_line_number >= 0 and end_line_number >= 0):
        
        logger.info(f"Creating singleMatch - both edges on line {start_line_number}")
        
        # Extract text between start_indx and end_indx
        single_match_text = start_text[start_indx:end_indx]
        single_match_line_number = start_line_number
        
        single_match_result = {
            "clean_search": clean_start_search,  # Combined search terms
            "clean_content": clean_start_content,
            "tail": single_match_text,
            "character_index": start_indx,
            "end_character_index": end_indx,
            "line_number": single_match_line_number,
            "primaryLine": single_match_text,
            "total_lines": len(clean_start_content)
        }
        
        response_data["singleMatch"] = single_match_result
        logger.info(f"SingleMatch created with text: '{single_match_text}'")

    return jsonify({"match": response_data}), 200




# ─── API Endpoint ────────────────────────────────────────────────
@app.route('/search', methods=['POST'])
def search_cordinates():
    data = request.get_json(force=True)
    content = data.get('content', [])
    terms = data.get('terms', [])
    nId = data.get('nId')
    annotType = data.get('type')
    nSesid = data.get('nSesid')
    refreshCount = data.get('refreshCount')
    data['timestamp'] = datetime.now().isoformat()
    start_time = time.perf_counter()  # Start timing in seconds
    
    try:
        # Perform the annotation search
        result = execution.annotSearch(terms, content, refreshCount)

        # Attach result (and clear error)
        data['result'] = result
        data['error'] = None
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        # Persist request + result
        data['duration'] = elapsed_ms
        save_request_json(nSesid, nId, annotType, data)
        return jsonify({
            "match": result,
            "msg": 1
        }), 200

    except Exception as e:
        # Log the error
        app.logger.error(f"search_cordinates error: {e}", exc_info=True)

        # Attach null result and error message
        data['result'] = None
        data['error'] = str(e)
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        # Persist request + error
        data['duration'] = elapsed_ms
        save_request_json(nSesid, nId, annotType, data)

        return jsonify({
            "match": None,
            "msg": -1,
            "error": str(e)
        }), 200


def save_request_json(nSesid, nId, annotType, data):
    """
    Appends `data` to logs/{nSesid}/requests/{annotType}/{nId}/{refreshCount}.json;
    if the file doesn't exist, creates it as a JSON array.
    """
    # Create directory path including nId folder
    directory = os.path.join("logs", f"s_{nSesid}", "requests", annotType, nId)
    os.makedirs(directory, exist_ok=True)  # ✅ Ensures all nested dirs exist

    file_path = os.path.join(directory, f"{data['refreshCount']}.json")

    try:
        # Load existing entries if any
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                existing = json.load(f)
            entries = existing if isinstance(existing, list) else [existing]
        else:
            entries = []

        # Make a copy and remove unnecessary keys
        clean_data = data.copy()
        clean_data.pop('nSesid', None)
        clean_data.pop('nId', None)
        clean_data.pop('type', None)
        # clean_data.pop('content', None)
        # clean_data.pop('terms', None)

        entries.append(clean_data)

        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)

    except Exception as e:
        app.logger.error(f" Failed to save request JSON: {e}", exc_info=True)

    # for term in terms:
    #     term_timestamp = term.get('timestamp')
    #     matched_entry = next((entry for entry in content if entry['timestamp'] == term_timestamp), None)
    #     if matched_entry:
    #         response_data.append({
    #             'index': matched_entry['index'],
    #             'timestamp': term['timestamp'],
    #             'text': term['text']
    #         })

# ─── 4) Error Handlers ─────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found."}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error."}), 500

# ─── 5) Main ───────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    logger.info("Starting Flask app on port 5001…")
    app.run(host='0.0.0.0', port=5001, debug=False)