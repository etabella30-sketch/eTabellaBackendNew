from datetime import datetime
import json

def find_closest_timestamp(target_timestamp, timestamps, direction):
    target_time = datetime.strptime(target_timestamp, "%H:%M:%S")
    filtered_timestamps = [ts for ts in timestamps if ts]
    
    # Debugging prints to trace values
  #  print(f"Target timestamp: {target_timestamp}")
  #  print(f"Filtered timestamps: {filtered_timestamps}")
    
    if direction == 'before':
        before_timestamps = [ts for ts in filtered_timestamps if datetime.strptime(ts, "%H:%M:%S") < target_time]
  #      print(f"Timestamps before {target_timestamp}: {before_timestamps}")
        closest_timestamp = max(before_timestamps, default=None)
    else:  # direction == 'after'
        after_timestamps = [ts for ts in filtered_timestamps if datetime.strptime(ts, "%H:%M:%S") > target_time]
        #print(f"Timestamps after {target_timestamp}: {after_timestamps}")
        closest_timestamp = min(after_timestamps, default=None)

 #   print(f"Selected closest timestamp ({direction}): {closest_timestamp}")
    return closest_timestamp


def adjust_timestamps_to_existing_range(original_start, original_end, all_timestamps):
    start_timestamp = find_closest_timestamp(original_start, all_timestamps, 'before')
    end_timestamp = find_closest_timestamp(original_end, all_timestamps, 'after')
    return start_timestamp, end_timestamp

def sort_annotations_by_timestamp(annotations, descending=True):
    for annot in annotations:
        annot['detail'].sort(key=lambda x: datetime.strptime(x['timestamp'], "%H:%M:%S"), reverse=descending)

def sort_line_texts_by_timestamp(line_texts, descending=True):
    return sorted(line_texts, key=lambda x: datetime.strptime(x['timestamp'], "%H:%M:%S"), reverse=descending)


def filter_line_texts_by_timestamp(line_texts, start_time, end_time):
    print(f"filter_line_texts_by_timestamp start_time = {start_time} end_time = {end_time} \n" )
    start_time = datetime.strptime(start_time, "%H:%M:%S")
    if end_time is not None:

        end_time = datetime.strptime(end_time, "%H:%M:%S")
    else:
        print('\n\n\n\n\n',start_time)
        end_time =start_time
    return [lt for lt in line_texts if start_time <= datetime.strptime(lt['timestamp'], "%H:%M:%S") <= end_time]

def transform_data(result):
    annotations = []
    
    for row in result:
        nIDid = str(row[0])
        cONote = row[1]
        jCordinates = row[2]
        cPageno = row[3]
        
        details = jCordinates
        cNote_lines = [line.strip() for line in cONote.split('\n') if line.strip()]
        
        transformed_details = []
        i = 0
        for detail in details:
            originallinetext = cNote_lines[i] if i < len(cNote_lines) else ''
            transformed_details.append({
                "timestamp": detail["t"],
                "originallinetext": originallinetext,
                "x": detail["x"],
                "y": detail["y"],
                "height": detail.get("height", 22),  # Assuming default height if not provided
                "width": detail.get("width", 100),  # Assuming default width if not provided
                "pageno": cPageno
            })
            i += 1
        
        annotations.append({
            "annotid": nIDid,
            "detail": transformed_details
        })
    
    return annotations


def calculate_annotation_positions(newdetail):
   # print(f"calculate_annotation_positions len = {len(newdetail)} newdetail: {json.dumps(newdetail,indent=4)} \n")
    # Calculate average width per character using the first item
   # print('new Detail =',newdetail)
    if(newdetail == []):
        return []
    total_item = len(newdetail)
    first_item = newdetail[0]
    if(first_item == []):
        return []
    avg_width = first_item['width'] / len(first_item['destination'])
    if avg_width>7:

       avg_width=7


    print('\n\n\n\n\n\n\nfirst_item = ',first_item)
    # Initialize offsets and previous y
    x_offset = 108
    y_offset = 60
    line_height = 24

    results = []
    newy = (first_item['newlineno'] -1) * line_height + y_offset
    first_item['y'] = newy
    # Process the first annotation
    total_word_count = len(first_item['newlinetext']) - first_item['match_start']
    first_x = x_offset + (first_item['match_start'] * avg_width)
    
    if total_item == 1:
    #    print(f" matchindices = {len(first_item['match_indices'])} \n")
        searched_word_count = len(first_item['searched_text'])
        
        first_width=searched_word_count*avg_width
    else:
        first_width = total_word_count * avg_width
    results.append({
        't': first_item['newtimestamp'],
        'x': first_x,
       # 'x1': first_x,
        'y': first_item['y'],
        'height': first_item['height'],
        'width': first_width,
       # "total_word_count":len(first_item['newlinetext']),
       # "remainword":total_word_count,
       # "avg_width":avg_width,
       # "match_start":first_item['match_start'],
    })
   
    # Process the subsequent annotations
    previous_y = first_item['y']
    if len(newdetail) <=1:
        return results
    for annotation in newdetail[1:-1][0]:
       # print(annotation)
        total_word_count = len(annotation['linetext'])
        width = total_word_count * avg_width
        y = previous_y + line_height
        results.append({
            't': annotation['timestamp'],
            'x': x_offset,
            'y': y,
            'height': first_item['height'],
            'width': width
        })
        previous_y = y
    
    # Process the last annotation
    last_item = newdetail[-1]
    last_x = x_offset + (last_item['last_match_start'] * avg_width)
    last_width = (last_item['last_end_index']) * avg_width
    y = previous_y + line_height
    results.append({
        't': last_item['lasttimestamp'],
        'x': x_offset,
        'y': y,
        'height': first_item['height'],
        'width': last_width
    })

    return results
