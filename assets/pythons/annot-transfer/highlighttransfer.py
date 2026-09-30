import json
from sqlconfig import execute_single_query
from utils import find_dynamic_closest_timestamps, find_best_match # type: ignore

results = []
sql_updates = []

def transfer_r_highlights(annotation_data, search_data, paths, save_Data=False):
    for annotation in annotation_data:
        annotid = annotation['annotid']
        try:
            # Extract first and last timestamps from annotation 
            first_timestamp = annotation['detail'][0]['timestamp']
            last_timestamp = annotation['detail'][-1]['timestamp']

            # Find dynamic closest lower and upper timestamps
            n = 2  # Number of closest timestamps to find
            closest_lowers, closest_uppers = find_dynamic_closest_timestamps(search_data, first_timestamp, last_timestamp, n)

            # Determine extended timestamp range
            extended_start_timestamp = closest_lowers[-1]['timestamp'] if closest_lowers else first_timestamp
            extended_end_timestamp = closest_uppers[-1]['timestamp'] if closest_uppers else last_timestamp

            # Filter search data based on extended timestamp range
            filtered_search_data = [
                entry for entry in search_data
                if extended_start_timestamp <= entry['timestamp'] <= extended_end_timestamp
            ]

            # Get the first 3 and last 3 entries from the filtered data
            first_three_entries = filtered_search_data[:2]
            last_three_entries = filtered_search_data[-2:]

            # Extract originallinetext
            first_detail_text = annotation['detail'][0]['originallinetext']
            last_detail_text = annotation['detail'][-1]['originallinetext']

            # Find best matches
            best_match_start = find_best_match(first_three_entries, first_detail_text)
            best_match_end = find_best_match(last_three_entries, last_detail_text)

            # Ensure both matches are valid
            if best_match_start and best_match_end:
                print('best_match_start = ', best_match_start)
                print('best_match_end = ', best_match_end)

                # Pick the one with the higher match_ratio
                if best_match_start['match_ratio'] > best_match_end['match_ratio']:
                    chosen_match = best_match_start
                else:
                    chosen_match = best_match_end

                # Remove extra fields for comparison (like match_ratio)
                def clean_match(entry):
                    return {key: entry[key] for key in entry if key not in ['start_index', 'end_index', 'match_ratio']}

                cleaned_chosen_match = clean_match(chosen_match)

                # Get index of the cleaned chosen match
                match_index = filtered_search_data.index(cleaned_chosen_match)

                # Extract line corresponding to the chosen match
                lines_between_best_matches = [filtered_search_data[match_index]]

                # Transform lines
                transformed_lines = []
                for line in lines_between_best_matches:
                    new_line = {
                        't': line.get('timestamp'),
                        'x': 0,
                        'y': 0,
                        'width': 0,
                        'height': 21.5,
                        'p': line.get('pageno'),
                        'l': line.get('lineno')
                    }
                    transformed_lines.append(new_line)

                if transformed_lines:
                    transformed_lines[0].update({
                        'x': annotation['detail'][0]['x'],
                        'y': annotation['detail'][0]['y'],
                        'text': annotation['detail'][0]['originallinetext'],
                    })
                    if len(annotation['detail']) > 1:
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
                cTLineno = transformed_lines[0]['l']
                cTTime = transformed_lines[0]['t']
                jTCordinates = json.dumps(transformed_lines)
                sql_updates.append(f'UPDATE "RHighlights" SET "cTPageno" = \'{cTPageno}\',"cTLineno"=\'{cTLineno}\',"cTTime"=\'{cTTime}\' WHERE "nHid" = {annotid};')

                if save_Data:
                    update_query = 'UPDATE "RHighlights" SET "cTPageno"=%s,"cTLineno" = %s,"cTTime"= %s  WHERE "nHid" = %s;'
                    execute_single_query(update_query, (cTPageno, cTLineno, cTTime, annotid))

            else:
                print(f"No valid matches found for annotid {annotid}, skipping...")

        except Exception as e:
            print(f"Error processing annotid {annotid}: {e}")

    # Save results to a JSON file
    with open(paths['output_file'], 'w') as outfile:
        json.dump(results, outfile, indent=4)

    # Save SQL update script to a file
    with open(paths['sql_output_file'], 'w') as sql_file:
        sql_file.write('\n'.join(sql_updates))

    print("RHighlights Results saved to", paths['output_file'])
    print("RHighlights SQL update script saved to", paths['sql_output_file'])
