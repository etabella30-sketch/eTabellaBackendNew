import re
import json
from collections import defaultdict
import os
import sys




def generate_paths(folder_path,sessionid,trans_script_path_save):
    # Ensure folder_path is not empty
    if not folder_path:
        folder_path = '.'
    create_folder_if_not_exists(folder_path)
    
    # Handle trans_script_path_save
    if not trans_script_path_save:
        trans_script_path_save = '.'
    dir_path = os.path.dirname(trans_script_path_save)
    if dir_path:  # Only create directory if path has a directory component
        create_folder_if_not_exists(dir_path)
    
    paths = {
        'line_file': os.path.join(folder_path, f'line_{sessionid}.json'),
        'annotation_file': os.path.join(folder_path, f'annotations_{sessionid}.json'),
        'raw_annotation_file': os.path.join(folder_path, f'raw_annotations_{sessionid}.json'),
        'output_file': os.path.join(folder_path, f'output_{sessionid}.json'),
        'sql_output_file': os.path.join(folder_path, f'update_script_{sessionid}.sql'),
        'line_path': os.path.join(folder_path, f'line_{sessionid}.json'),
        'trans_script_path': os.path.join(folder_path, f's_{sessionid}.json'),
        'trans_script_path_save': os.path.join(trans_script_path_save, f's_{sessionid}.json') #f's_{sessionid}.json' if trans_script_path_save == '.' else trans_script_path_save
    }
    
    return paths


def create_folder_if_not_exists(folder_path):
    try:
        os.makedirs(folder_path, exist_ok=True)
        print(f"Folder '{folder_path}' created successfully or already exists.")
    except Exception as e:
        print(f"An error occurred: {e}")


def extract_tab_references(text):
    # Find all matches of text within curly braces, preserving original format
    references = []
    matches = re.finditer(r'\{([^}]+)\}', text)
    for match in matches:
        # Get both the full match and the inner content
        references.append({
            'full': match.group(0),  # Full match including braces
            'inner': match.group(1)  # Content inside braces
        })
    return references

def parse_text(text):
    lines = text.strip().split('\n')
    parsed_lines = []
    page_no = 1
    globalIndex=0;
    for line in lines:
        match = re.match(r'^\s*(\d+)\s+(\d{2}:\d{2}:\d{2})?\s*([A-Z]*:)?\s*(.*)', line)

        if match:
            text = (match.group(3) or '') + match.group(4)
            # Extract tab references from the line
            tab_references = extract_tab_references(text)
            parsed_lines.append({
                "lineno": int(match.group(1)),
                "timestamp": match.group(2) if match.group(2) else None,
                "linetext": text.strip(),
                "pageno": page_no,
                "tab_references": tab_references
            })
            if int(match.group(1)) % 25 == 0:
                page_no += 1
    return parsed_lines

def read_file(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

def extract_tab_references(line: str):
    """Dummy helper – replace with your real logic."""
    return re.findall(r'\b[Tt][Aa][Bb][- ]?(\d+)\b', line)


def parse_transcript_text(raw_text: str):
    """
    Parse a court-style transcript into a structured list.
    • Detects page breaks via form-feed *and* printed footers
    • Forces the INDEX section onto a fresh page
    """
    parsed = []
    in_index = False
    page_no = 1
    raw_text = raw_text.replace('\ufffd', '[INVALID]')
    rx_content = re.compile(r'''
        ^\s*                              # leading indent
        (?:
            (?P<lineno>\d+)                            # capture line number
            (?!:\d)                                    # disallow colon right after number (e.g., 123:10)
            (?:\s+|$)                                  # must end or have at least one space after
        )?
        (?P<ts>\d{2}:\d{2}(?::\d{2})?)?  # HH:MM or HH:MM:SS #(?P<ts>\d{2}:\d{2}:\d{2})?  # optional timestamp 
        (?P<label>[A-Z][A-Z ]*:)?        # optional speaker label
        (?P<rest>\s*.*)$                 # rest of the line
    ''', re.X)
    
    rx_content_index = re.compile(r'''
        ^(?P<indent>\s{0,4})                   # max 4 leading spaces allowed before line number
        (?:
            (?P<lineno>\d+)                    # capture line number
            (?!:\d)                            # not something like 123:10
            (?:\s+|$)                          # followed by space or end of line
        )?
        (?P<ts>\d{2}:\d{2}(?::\d{2})?)?        # optional timestamp
        (?P<label>[A-Z][A-Z ]*:)?              # optional speaker label
        (?P<rest>\s*.*)$                       # rest of the line
    ''', re.X)

    rx_footer = re.compile(r'^\s*(\d+)\s*$')        # footer: digits only
    # Anchor INDEX detection to a WHOLE-LINE match. The previous \b…\b form
    # also matched the literal word "index" mid-sentence — e.g. "somebody put
    # the index at the…" or "…inserted into it an index" in regular spoken
    # transcript content. That triggered the page from those mentions onwards
    # to be flagged as `isIndex=True`, which the annotation-transfer publish
    # filter (start_bytranscript.py: `if not item.get('isIndex')`) then
    # dropped — collapsing a 44-page transcript down to ~4 published pages.
    # Real INDEX section markers are always centered/alone on their line
    # (e.g. "                                        I N D E X"), so anchor
    # the match to ^…$ with only whitespace allowed before and after.
    rx_index  = re.compile(r'^\s*I\s*N\s*D\s*E\s*X\s*$', re.I | re.M)

    pages = raw_text.split('\f')  # Form feed–based page break
    
    
    
    last_index_page = -1
    # Step 1️⃣: Determine the last page that contains "I N D E X"
    for i, page in enumerate(pages):
        if any(rx_index.search(line) for line in page.splitlines()):
            last_index_page = i
            
    for  index, page in enumerate(pages):
        is_index_page = index >= last_index_page and last_index_page != -1
        last_lineno = None
        lines = page.splitlines()
        # page_no += 1
        for raw in lines:
            # 2️⃣ printed footer line → page number update
            m_footer = rx_footer.match(raw)
            if m_footer:
                # Check if all remaining lines are blank
                remaining_lines = lines[lines.index(raw) + 1:]
                if all(not l.strip() for l in remaining_lines):
                    try:
                        page_no = int(m_footer.group(1)) + 1
                    except ValueError:
                        pass
                    last_lineno = None
                    continue  # Skip footer from being parsed further

            # 3️⃣ INDEX section detection
            # if not in_index and rx_index.search(raw):
            #     in_index = True
            #     last_lineno = None  # line numbers no longer matter
            print(f"Processing page {index + 1} line: {raw.strip()}")  # Debugging line
            
            m = rx_content.match(raw)
            if not m or not m.group(0).strip():
                continue
            if is_index_page:
                m = rx_content_index.match(raw)
            
            lineno_str = m.group('lineno')
            curr_lineno = int(lineno_str) if lineno_str else None


            # 🔧 Preserve original spacing starting from 'rest'
            # text_start = m.start('rest')
            # text = raw[text_start:].rstrip()  # only strip right-side newlines
            
            # Normalize timestamp to HH:MM:SS
            timestamp = m.group('ts') or None
            if timestamp and len(timestamp) == 5:
                timestamp += ':00'
            
            # 🧠 Preserve everything after last matched group
            last_match_end = (
                m.end('ts') if m.group('ts')
                else m.end('lineno') if m.group('lineno')
                else 0
            )
            text = raw[last_match_end:].rstrip()

            parsed.append({
                'lineno': curr_lineno,
                'timestamp': timestamp,
                'linetext': text,
                'pageno': index + 1,
                'tab_references': extract_tab_references(text),
                'isIndex': is_index_page,
            })
        # page_no += 1  # ⬅️ Increment after finishing a form-feed-based page

    return parsed

def process_tab_references(text, references, db_tabreferences):
    # Convert database references to simple list of refs
    db_refs = [ref[0] for ref in db_tabreferences]
    matched_refs = []
    
    # Process each reference
    for ref in references:
        # Get base reference before any line number
        base_ref = ref['inner'].split('-')[0]
        if base_ref in db_refs:
            # Keep the original full reference including braces and line number if present
            matched_refs.append(ref['full'])
        else:
            # Remove unmatched reference from text
            text = text.replace(ref['full'], '')
    
    # Clean up extra spaces
    text = ' '.join(text.split())
    return text, matched_refs if matched_refs else None

def convert_to_codefeed_data(parsed_lines, db_tabreferences=None):
    grouped_data = defaultdict(list)
    lineIndex = 0
    
    for line in parsed_lines:
        lineIndex += 1
        text = line['linetext']
        entry = {
            "time": line['timestamp'],
            "lineIndex": lineIndex,
        }
        
        # Process tab references if available
        if db_tabreferences and 'tab_references' in line and line['tab_references']:
            processed_text, matched_refs = process_tab_references(
                text, 
                line['tab_references'], 
                db_tabreferences
            )
            entry['lines'] = [processed_text]
            if matched_refs:
                entry['links'] = matched_refs
        else:
            entry['lines'] = [text]
            
        grouped_data[line['pageno']].append(entry)
    
    codefeed_data_list = []
    for page, data in grouped_data.items():
        codefeed_data_list.append({
            "msg": page,
            "page": page,
            "data": data,
        })
    
    return codefeed_data_list



def save_json_file(file_path,data):
    # Create directory if it doesn't exist
    directory = os.path.dirname(file_path)
    if directory:
        create_folder_if_not_exists(directory)
    print(f"SAVV to {file_path}")
    with open(file_path, 'w') as file:
        file.write(json.dumps(data, indent=4))

log_file_path = os.path.join('data', 'process.log')

def init_logging():
    create_folder_if_not_exists('data')
    if not os.path.exists(log_file_path):
        with open(log_file_path, 'w') as file:
            file.write('')  # Create empty log file
    
def append_log(message):
    init_logging()  # Ensure log directory and file exist
    with open(log_file_path, 'a') as file:
        file.write(message + '\n')
