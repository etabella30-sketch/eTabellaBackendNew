import re
import json
from collections import defaultdict
import os


def generate_paths(folder_path,sessionid,trans_script_path_save):
    paths = {
        'line_file': f'{folder_path}/line_{sessionid}.json',
        'annotation_file': f'{folder_path}/annotations_{sessionid}.json',
        'raw_annotation_file': f'{folder_path}/raw_annotations_{sessionid}.json',
        'output_file': f'{folder_path}/output_{sessionid}.json',
        'sql_output_file': f'{folder_path}/update_script_{sessionid}.sql',
        'line_path': f'{folder_path}/line_{sessionid}.json',
        'trans_script_path': f'{folder_path}/s_{sessionid}.json',
        'trans_script_path_save': f'{trans_script_path_save}s_{sessionid}.json'
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

def parse_text(text):
    lines = text.strip().split('\n')
    parsed_lines = []
    page_no = 1
    globalIndex=0;
    for line in lines:
        match = re.match(r'^\s*(\d+)\s+(\d{2}:\d{2}:\d{2})([A-Z]*:)?\s*(.*)', line)
        if match:
            text = (match.group(3) or '') + match.group(4)
            parsed_lines.append({
                "lineno": int(match.group(1)),
                "timestamp": match.group(2),
                "linetext": text.strip(),
                "pageno": page_no
            })
            if int(match.group(1)) % 25 == 0:
                page_no += 1
    return parsed_lines

def convert_to_codefeed_data(parsed_lines):
    grouped_data = defaultdict(list)
    lineIndex=0;
    for line in parsed_lines:
        lineIndex =lineIndex+1
        grouped_data[line['pageno']].append({
            "time": line['timestamp'],
            "lineIndex":lineIndex,
            "lines": [line['linetext']]
        })
    
    codefeed_data_list = []
    
    for page, data in grouped_data.items():
        codefeed_data_list.append({
            "msg": page,
            "page": page,
            "data": data,
            
        })
       
    return codefeed_data_list



def save_json_file(file_path,data):
    with open(file_path, 'w') as file:
        file.write(json.dumps(data, indent=4))

log_file_path = 'data/process.log'
def append_log(message):
    with open(log_file_path, 'a') as file:
        file.write(message + '\n')
  