import itertools
import threading
import time
import sys
import json
from sqlconfig import execute_query
from file import parse_text,read_file,save_json_file
from common import filter_line_texts_by_timestamp,adjust_timestamps_to_existing_range,transform_data,calculate_annotation_positions
from search import perform_search,perform_search_last
from collections import defaultdict

def show_progress_indicator(message):
    for c in itertools.cycle(['.', '..', '...']):
        if not show_progress_indicator.stop:
            sys.stdout.write(f'\r{message}{c}')
            sys.stdout.flush()
            time.sleep(0.5)
        else:
            break

def stop_progress_indicator():
    show_progress_indicator.stop = True
    sys.stdout.write('\rDone!         \n')
    sys.stdout.flush()


# Example call to execute_query function
trfAnnotatons=[]

print('Fetching annotations  ....')

annotations = execute_query('et_realtime_get_annotation_by_session', '{"nSessionid":55}')
# Transform the data

print('Annotations fetched  .... total = ',len(annotations),'\n now Performing transformation ....')

annotations = transform_data(annotations)
save_json_file('data/annotations.json', annotations)

print('Annotations transformed and written to data/annotations.json ....\n now reading file ....')

file_path = 'data/Day10.txt'

edited_text = read_file(file_path)
print('File read .... now parsing text ....')
edited_lines = parse_text(edited_text)
save_json_file('data/Day10.json', edited_lines)
print('Text parsed and written to data/Day10.json ....')
show_progress_indicator.stop = False
progress_thread = threading.Thread(target=show_progress_indicator, args=("Fetching annotations  ",))
progress_thread.start()


def process_annotations(annotations, line_texts):
    all_timestamps = [line['timestamp'] for line in line_texts]
    for annot in annotations:
        jInnerAnnot={}
        jInnerAnnot["nIDid"] = annot["annotid"]
        details = annot['detail']
        matched_timestamp=[];
        newdetail=[]
        newcordinates=[]
        cTPageno = "0"
        destination_text = details[0]['originallinetext'].lower()
        original_timestamps = [detail['timestamp'] for detail in annot['detail']]
       # print('original_timestamps:', original_timestamps,original_timestamps[0], original_timestamps[-1])
        expanded_range_start, expanded_range_end = adjust_timestamps_to_existing_range(original_timestamps[0], original_timestamps[-1], all_timestamps)
       # print(annot["annotid"],'expanded_range_start:', expanded_range_start, 'expanded_range_end:', expanded_range_end)
        filtered_line_texts = filter_line_texts_by_timestamp(line_texts, expanded_range_start, expanded_range_end)
       # print('\nfiltered_line_texts:', filtered_line_texts)
        searchable_lines = filtered_line_texts[:3]
      #  print('\nsearchable_lines:', json.dumps(searchable_lines,indent=4))
      #  print(destination_text)
        best_result = perform_search(destination_text, filtered_line_texts, details,annot["annotid"])
        
        if best_result:
            # Check if the timestamp exists in details and update the corresponding entry
            # timestamp_found = False
            # for detail in details:
            #     if detail['timestamp'] == best_result['newtimestamp']:
            #         detail.update(best_result)
            #         timestamp_found = True
            #         break
            # # If no matching timestamp, append the new record
            # if not timestamp_found:
            #print(best_result['newtimestamp'])
            matched_timestamp.append(best_result['newtimestamp'])
            cTPageno = best_result['newpageno']
            details[0].update(best_result)
            annot['cTPageno'] = cTPageno
            jInnerAnnot["cTPageno"] = str(cTPageno)
            newdetail.append(details[0])
            jInnerAnnot["jTCordinates"]=[];
        else:
            print("No suitable match found for annotation.", annot["annotid"])
        
        if len(details) > 1:
            best_result = perform_search_last(destination_text, filtered_line_texts, details,annot["annotid"])
            ln =len(details)
            if best_result:
                # Check if the timestamp exists in details and update the corresponding entry
                # timestamp_found = False
                # for detail in details:
                #     if detail['timestamp'] == best_result['lasttimestamp']:
                #         detail.update(best_result)
                #         timestamp_found = True
                #         break
                # # If no matching timestamp, append the new record
                # if not timestamp_found:
                #print('\n\n\n\n',annot["annotid"])
                matched_timestamp.append(best_result['lasttimestamp'])
                details[ln-1].update(best_result)
                
                filtered_annotations = [annotation for annotation in filtered_line_texts if matched_timestamp[0] < annotation['timestamp'] < matched_timestamp[1]]
                newdetail.append(filtered_annotations)
                newdetail.append(details[ln-1])
                

            else:
                print("No last suitable match found for annotation.", annot["annotid"])
            #print(annot["annotid"],'expanded_range_start:', expanded_range_start, 'expanded_range_end:', expanded_range_end)
            #print(destination_text, searchable_lines)
        newcordinates = calculate_annotation_positions(newdetail)
        annot['newdetail'] = newdetail
        annot['jTCordinates'] = newcordinates
        jInnerAnnot['jTCordinates'] = newcordinates
        trfAnnotatons.append(jInnerAnnot)
        #print('trfAnnotatons',trfAnnotatons)
       # print(matched_timestamp,filtered_line_texts)
#        print('\n',filtered_annotations)



process_annotations(annotations, edited_lines)
#print('trfAnnotatons',trfAnnotatons)
stop_progress_indicator()
progress_thread.join()
print('Annotations processed ....\n now saving data ....\n\n\n\n\n')


save_json_file('data/trfAnnotatons.json', trfAnnotatons)
save_json_file('data/result.json', annotations)

# output_file_path = 'trfAnnotatons.json'
# with open(output_file_path, 'w') as outfile:
#      json.dump(trfAnnotatons, outfile, indent=4)

with open('data/trfAnnotatons.json', 'r') as file:
    json_data = json.load(file)

# Convert JSON data to string
json_str = json.dumps(json_data)

print('Data saved ....\n now saving the annotations  to database ....')
res = execute_query('et_realtime_annotation_transfer',json_str )
print('Data saved ....\n')
