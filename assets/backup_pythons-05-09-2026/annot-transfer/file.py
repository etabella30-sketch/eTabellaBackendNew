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
def read_file(file_path):
    with open(file_path, 'r') as file:
        return file.read()

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
        match = re.match(r'^\s*(\d+)\s+(\d{2}:\d{2}:\d{2})([A-Z]*:)?\s*(.*)', line)

        if match:
            text = (match.group(3) or '') + match.group(4)
            # Extract tab references from the line
            tab_references = extract_tab_references(text)
            parsed_lines.append({
                "lineno": int(match.group(1)),
                "timestamp": match.group(2),
                "linetext": text.strip(),
                "pageno": page_no,
                "tab_references": tab_references
            })
            if int(match.group(1)) % 25 == 0:
                page_no += 1
    return parsed_lines

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
