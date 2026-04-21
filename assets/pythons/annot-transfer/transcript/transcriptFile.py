
from file import read_file, save_json_file, parse_text, create_folder_if_not_exists,parse_transcript_text
import sys
import os
from dotenv import load_dotenv
import time

load_dotenv()





# TRANSCRIPT_FILE_DIR = os.getenv('TRANSCRIPT_FILE_DIR')

missing_args = []
if len(sys.argv) < 2:
    missing_args.append("draft_path")
if len(sys.argv) < 3:
    missing_args.append("trans_script_path_save")

if missing_args:
    print(f"Error: Missing arguments: {', '.join(missing_args)}")
    sys.exit(1)

# Get command-line arguments
draft_path = sys.argv[1]
trans_script_path_save = sys.argv[2]

save_Data=True
# folder_path = f'./{sessionid}'
# folder_path = f'{TRANSCRIPT_FILE_DIR}/'
# create_folder_if_not_exists(folder_path)

timestamp = timestamp_ms = int(time.time() * 1000)

# paths = {'line_file': os.path.join(folder_path, f'line_{timestamp}.json')}
# print(paths)

#print(annotations)
edited_text = None
edited_lines = None
search_data = None
codefeed_data_list = None

edited_text = read_file(draft_path)    

try:
    edited_lines = parse_transcript_text(edited_text)   
    if not edited_lines or edited_lines.__len__() == 0:
        print("No valid lines found in the draft file.")
        sys.exit(1)
except Exception as e:
    print(f"Error reading draft file: {e}")
    edited_text = ''
    exit()


search_data = edited_lines

save_json_file(trans_script_path_save, edited_lines)



print('FILE_SAVED_TO_PATH')



######################### Start Highlights Transfer #############################

# folder_path = f'./{sessionid}_H'
# folder_path = f'{TRANSCRIPT_FILE_DIR}/DATA_H'
# create_folder_if_not_exists(folder_path)
save_Data=True

