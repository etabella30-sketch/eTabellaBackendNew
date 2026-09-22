from sqlconfig import execute_query
from common import transform_data,transform_data_highlights
from file import read_file, save_json_file, parse_text, convert_to_codefeed_data,create_folder_if_not_exists,generate_paths
from issuetransfer import transfer_issue_detail
from highlighttransfer import transfer_r_highlights
import sys
import os
from dotenv import load_dotenv

load_dotenv()





ANNOT_TRANSFER_DIR = os.getenv('ANNOT_TRANSFER_DIR')

missing_args = []
if len(sys.argv) < 2:
    missing_args.append("sessionid")
if len(sys.argv) < 3:
    missing_args.append("draft_path")
if len(sys.argv) < 4:
    missing_args.append("trans_script_path_save")

if missing_args:
    print(f"Error: Missing arguments: {', '.join(missing_args)}")
    sys.exit(1)

# Get command-line arguments
sessionid = int(sys.argv[1])
draft_path = sys.argv[2]
trans_script_path_save = sys.argv[3]

# /var/www/html/api/assets/pythons/annot-transfer/start.py 84 /var/www/html/api/assets/doc/case282/s_84.TXT /var/www/html/api/assets/realtime-transcripts/

# sessionid = 129   #get the param from the the sys.argv; nSesid
# draft_path = f's_{sessionid}.TXT' #get the param from the the psys.argv filePath
# trans_script_path_save = f's_{sessionid}.json' # save the file to path  #REALTIME_PATH
# cCaseno = 'ICC Case 27146/HTG'

save_Data=True
# folder_path = f'./{sessionid}'
folder_path = f'{ANNOT_TRANSFER_DIR}/{sessionid}'
create_folder_if_not_exists(folder_path)



paths = generate_paths(folder_path,sessionid,trans_script_path_save)

# Add tabreferences file path
paths['tabreferences_file'] = f'{folder_path}/tabreferences_{sessionid}.json'

annotations = execute_query('et_realtime_get_annotation_by_session', f'{{"nSessionid":{sessionid}}}')
tabreferences = execute_query('et_realtime_case_all_tabs', f'{{"nSesid":"{sessionid}"}}')

save_json_file(paths['raw_annotation_file'], annotations)
save_json_file(paths['tabreferences_file'], tabreferences)
#print(annotations)
edited_text = None
edited_lines = None
search_data = None
codefeed_data_list = None
edited_text = read_file(draft_path)    

try:
    edited_lines = parse_text(edited_text)    
except Exception as e:
    print(f"Error reading draft file: {e}")
    edited_text = ''
    exit()


search_data = edited_lines

save_json_file(paths['line_path'], edited_lines)

try:
    # Convert tabreferences to list format if it exists
    tab_refs = tabreferences if tabreferences else None
    codefeed_data_list = convert_to_codefeed_data(edited_lines, tab_refs)
except Exception as e:
    print(f"Error converting to codefeed data: {e}")
    codefeed_data_list = []
    exit()

save_json_file(paths['trans_script_path'], codefeed_data_list)

save_json_file( paths['trans_script_path_save'], codefeed_data_list)

print('FILE_SAVED_TO_PATH')

try:
    annotation_data = transform_data(annotations)
    save_json_file(paths['annotation_file'], annotation_data)
except Exception as e:
    print(f"Error transforming annotation data: {e}")
    annotation_data = []


if len(annotation_data) == 0:
    print("No annotations found. Exiting...")
else:
    transfer_issue_detail(annotation_data, search_data, paths, save_Data)    







######################### Start Highlights Transfer #############################

# folder_path = f'./{sessionid}_H'
folder_path = f'{ANNOT_TRANSFER_DIR}/{sessionid}_H'
create_folder_if_not_exists(folder_path)
save_Data=True
paths = generate_paths(folder_path,sessionid,trans_script_path_save)


annotations = execute_query('et_realtime_get_RHighlights_by_session', f'{{"nSessionid":{sessionid}}}')
#print(annotations)
save_json_file(paths['raw_annotation_file'], annotations)


try:
    annotation_data = transform_data_highlights(annotations)
    save_json_file(paths['annotation_file'], annotation_data)
except Exception as e:
    print(f"Error transforming annotation data: {e}")
    annotation_data = []


if len(annotation_data) == 0:
    print("No annotations found. Exiting...")
else:
    transfer_r_highlights(annotation_data, search_data, paths, save_Data)
