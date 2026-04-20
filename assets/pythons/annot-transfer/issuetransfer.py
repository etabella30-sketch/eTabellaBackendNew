import json
from sqlconfig import execute_single_query
from utils import find_dynamic_closest_timestamps, find_best_match # type: ignore

# See highlighttransfer.py for the rationale on this threshold.
MATCH_THRESHOLD = 60

results = []
sql_updates = []


def _mark_orphan(annotid, save_Data):
    """
    Orphan case — the draft content this annotation referenced was removed
    during publish. Mark cTransferStatus='O', leave transferred-coord columns
    NULL and bTrf=false. et_marks filters orphans from the published-view
    response; a follow-up UI panel surfaces them for user review via
    jCordinates (which still holds the original draft text).
    """
    print(f"Orphan issue-detail {annotid}: source content removed during publish")
    sql_updates.append(
        f'UPDATE "RIssueDetail" SET "cTransferStatus" = \'O\', "bTrf" = false WHERE "nIDid" = "{annotid}";'
    )
    if save_Data:
        execute_single_query(
            'UPDATE "RIssueDetail" SET "cTransferStatus"=%s, "bTrf"=%s WHERE "nIDid" = %s;',
            ('O', False, annotid)
        )


def transfer_issue_detail(annotation_data, search_data, paths, save_Data=False):
    for annotation in annotation_data:
        annotid = annotation['annotid']
        try:
            if not annotation.get('detail'):
                raise ValueError("No details found for annotation")

            # First + last timestamps of this multi-line annotation on the draft
            first_timestamp = annotation['detail'][0]['timestamp']
            last_timestamp = annotation['detail'][-1]['timestamp']

            n = 1
            closest_lowers, closest_uppers = find_dynamic_closest_timestamps(
                search_data, first_timestamp, last_timestamp, n
            )

            extended_start_timestamp = closest_lowers[-1]['timestamp'] if closest_lowers else first_timestamp
            extended_end_timestamp = closest_uppers[-1]['timestamp'] if closest_uppers else last_timestamp

            filtered_search_data = [
                entry for entry in search_data
                if extended_start_timestamp <= entry['timestamp'] <= extended_end_timestamp
            ]

            if not filtered_search_data:
                _mark_orphan(annotid, save_Data)
                continue

            first_three_entries = filtered_search_data[:3]
            last_three_entries = filtered_search_data[-3:]

            first_detail_text = annotation['detail'][0]['originallinetext']
            last_detail_text = annotation['detail'][-1]['originallinetext']

            best_match_start = find_best_match(first_three_entries, first_detail_text)
            best_match_end = find_best_match(last_three_entries, last_detail_text)

            # Orphan detection: treat annotations whose endpoints (start and end)
            # both score below the fuzzy threshold as removed-content. If at
            # least one endpoint scores above the threshold, we trust the match
            # and let the span anchor accordingly.
            start_score = best_match_start.get('match_ratio', 0) if best_match_start else 0
            end_score = best_match_end.get('match_ratio', 0) if best_match_end else 0
            if start_score < MATCH_THRESHOLD and end_score < MATCH_THRESHOLD:
                print(f"Orphan issue-detail {annotid}: start_score={start_score}, end_score={end_score} (threshold {MATCH_THRESHOLD})")
                _mark_orphan(annotid, save_Data)
                continue

            # If one endpoint matched and the other didn't, promote the matched one.
            # We don't fall through to closest_lowers/uppers anymore — that would
            # mask cases where part of the annotation span was deleted.
            if not best_match_start:
                best_match_start = best_match_end
            if not best_match_end:
                best_match_end = best_match_start

            def remove_additional_fields(entry):
                return {k: entry[k] for k in entry if k not in ['start_index', 'end_index', 'match_ratio']}

            # Find indices of matched anchors within the filtered window so we can
            # collect the lines in between (the annotation span on the published feed)
            try:
                start_index = filtered_search_data.index(remove_additional_fields(best_match_start))
                end_index = filtered_search_data.index(remove_additional_fields(best_match_end))
            except ValueError:
                # Endpoint didn't round-trip through filtered lookup (cleaned timestamp
                # didn't byte-match) — treat the single matched endpoint as the anchor.
                print(f"issue {annotid}: fallback anchor via match_start only (index miss)")
                start_index = 0
                end_index = 0
                filtered_search_data = [remove_additional_fields(best_match_start)]

            lines_between_best_matches = filtered_search_data[start_index:end_index + 1]

            transformed_lines = []
            for line in lines_between_best_matches:
                new_line = {
                    't': line.get('timestamp'),
                    'x': 0,
                    'y': 0,
                    'width': 0,
                    'height': 21.5,
                    'p': line.get('pageno'),
                }
                if 'lineno' in line:
                    new_line['l'] = line['lineno']
                if 'linetext' in line:
                    new_line['text'] = line['linetext']
                transformed_lines.append(new_line)

            # Overlay the original annotation's first + last x/y/text (so user-drawn
            # selection coords are preserved at the span endpoints)
            if transformed_lines:
                transformed_lines[0].update({
                    'x': annotation['detail'][0]['x'],
                    'y': annotation['detail'][0]['y'],
                    'text': annotation['detail'][0]['originallinetext'],
                })
                if len(transformed_lines) > 1:
                    transformed_lines[-1].update({
                        'x': annotation['detail'][-1]['x'],
                        'y': annotation['detail'][-1]['y'],
                        'text': annotation['detail'][-1]['originallinetext'],
                    })

            results.append({
                "annotid": annotid,
                "lines": transformed_lines,
                "start_score": start_score,
                "end_score": end_score,
            })

            cTPageno = transformed_lines[0]['p']
            jTCordinates = json.dumps(transformed_lines)
            sql_updates.append(
                f'UPDATE "RIssueDetail" SET "jTCordinates" = \'{jTCordinates}\','
                f'"cTPageno"={cTPageno},"bTrf"={True},"cTransferStatus"=\'T\' '
                f'WHERE "nIDid" = "{annotid}";'
            )
            if save_Data:
                execute_single_query(
                    'UPDATE "RIssueDetail" '
                    'SET "jTCordinates" = %s, "cTPageno" = %s, "bTrf" = %s, "cTransferStatus" = %s '
                    'WHERE "nIDid" = %s;',
                    (jTCordinates, cTPageno, True, 'T', annotid)
                )

        except Exception as e:
            print(f"Error processing r annotid {annotid}: {e}")
            try:
                _mark_orphan(annotid, save_Data)
            except Exception as inner:
                print(f"  also failed to mark orphan: {inner}")

    with open(paths['output_file'], 'w') as outfile:
        json.dump(results, outfile, indent=4)

    with open(paths['sql_output_file'], 'w') as sql_file:
        sql_file.write('\n'.join(sql_updates))

    print("Issue detail Results saved to", paths['output_file'])
    print("Issue detail SQL update script saved to", paths['sql_output_file'])
