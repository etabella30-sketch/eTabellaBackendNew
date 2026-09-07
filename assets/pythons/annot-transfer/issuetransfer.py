
import json
from sqlconfig import execute_single_query
from utils import find_dynamic_closest_timestamps, find_best_match # type: ignore

results = []
sql_updates = []

def transfer_issue_detail(annotation_data,search_data,paths,save_Data=False):
    # Process each annotation
    for annotation in annotation_data:
        annotid = annotation['annotid']
        try:
            # Extract first and last timestamps from annotation data
            first_timestamp = annotation['detail'][0]['timestamp']
            last_timestamp = annotation['detail'][-1]['timestamp']

            # Find dynamic closest lower and upper timestamps
            n = 1  # Number of closest timestamps to find
            closest_lowers, closest_uppers = find_dynamic_closest_timestamps(search_data, first_timestamp, last_timestamp, n)

            # Determine extended timestamp range
            extended_start_timestamp = closest_lowers[-1]['timestamp'] if closest_lowers else first_timestamp
            extended_end_timestamp = closest_uppers[-1]['timestamp'] if closest_uppers else last_timestamp
            #print(extended_start_timestamp, extended_end_timestamp)
            # Filter search data based on extended timestamp range
            filtered_search_data = [
                entry for entry in search_data
                if extended_start_timestamp <= entry['timestamp'] <= extended_end_timestamp
            ]
            
            # Get the first 3 and last 3 entries from the filtered data
            first_three_entries = filtered_search_data[:3]
            last_three_entries = filtered_search_data[-3:]
        # print('last_three_entries = ',last_three_entries)
            # Extract originallinetext
            first_detail_text = annotation['detail'][0]['originallinetext']
            last_detail_text = annotation['detail'][-1]['originallinetext']

            # Find best matches
            best_match_start = find_best_match(first_three_entries, first_detail_text)

        # print('searching = ',last_detail_text)
            best_match_end = find_best_match(last_three_entries, last_detail_text)
        # print('best_match_end = ',best_match_end)

            # Function to remove additional fields for comparison
            def remove_additional_fields(entry):
                return {key: entry[key] for key in entry if key not in ['start_index', 'end_index', 'match_ratio']}

            # Handle cases where best matches are None
            if not best_match_start and closest_lowers:
                best_match_start = closest_lowers[0]
            if not best_match_end and closest_uppers:
                best_match_end = closest_uppers[0]

            # Raise an error if both best matches are None
            if not best_match_start and not best_match_end:
                raise ValueError("Both best match start and end are None")
            #print('\n\n',best_match_start)
            # Get indices of best matches in the filtered search data
            start_index = filtered_search_data.index(remove_additional_fields(best_match_start))
            end_index = filtered_search_data.index(remove_additional_fields(best_match_end))
        # print(start_index,end_index)
            # Extract all lines between best matches
            lines_between_best_matches = filtered_search_data[start_index:end_index + 1]
            #print('\n\n',lines_between_best_matches)
            # Update lines_between_best_matches
            
            
            #print('\n\n')
            #print(json.dumps(lines_between_best_matches,indent=4))
        # print('\n\n')
            
            transformed_lines = []

            for line in lines_between_best_matches:
            # print('line = \n\n',line)
                new_line = {
                    't': line.get('timestamp'),
                    'x': 0,
                    'y': 0,
                    'width': 0,
                    'height': 21.5,
                    'p':line.get('pageno')
                }
                if 'lineno' in line:
                    new_line['l'] = line['lineno']
                if 'linetext' in line:
                    new_line['text'] = line['linetext']
                
                # Add the new transformed line to the new array
                transformed_lines.append(new_line)


            #print('\n\n transformed_lines =',transformed_lines)
            if transformed_lines:
                transformed_lines[0].update({
                    'x': annotation['detail'][0]['x'],
                    'y': annotation['detail'][0]['y'],
                    'text': annotation['detail'][0]['originallinetext'],
                })
                if(len(transformed_lines)>1):
                    transformed_lines[-1].update({
                        'x': annotation['detail'][-1]['x'],
                        'y': annotation['detail'][-1]['y'],
                        'text': annotation['detail'][-1]['originallinetext'],
                    })

            results.append({
                "annotid": annotid,
                "lines": transformed_lines,
                
            })
            cTPageno = transformed_lines[0]['p']
            jTCordinates = json.dumps(transformed_lines)
            # Create SQL update statement
            sql_updates.append(f'UPDATE "RIssueDetail" SET "jTCordinates" = \'{jTCordinates}\',"cTPageno"={cTPageno},"bTrf"={True} WHERE "nIDid" = {annotid};')
            if save_Data:
                
                update_query = 'UPDATE "RIssueDetail" SET "jTCordinates" = %s, "cTPageno" = %s, "bTrf" = %s  WHERE "nIDid" = %s;'
                execute_single_query(update_query, (jTCordinates,cTPageno, True,annotid))
                #print(f"Updated annotation {annotid} with transformed data")
        except Exception as e:
            print(f"Error processing annotid {annotid}: {e}")

    # Save results to a JSON file
    with open(paths['output_file'], 'w') as outfile:
        json.dump(results, outfile, indent=4)

    # Save SQL update script to a file
    with open(paths['sql_output_file'], 'w') as sql_file:
        sql_file.write('\n'.join(sql_updates))

    print("Issue detail Results saved to", paths['output_file'])
    print("Issue detail SQL update script saved to", paths['sql_output_file'])
