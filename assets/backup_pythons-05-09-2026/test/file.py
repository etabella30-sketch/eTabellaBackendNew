import re
import json
from collections import defaultdict

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
                "linetext": text.strip().lower(),
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
  