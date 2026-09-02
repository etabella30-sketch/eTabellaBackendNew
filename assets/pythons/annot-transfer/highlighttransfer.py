import json
from sqlconfig import execute_single_query
from utils import find_dynamic_closest_timestamps, find_best_match, estimate_time_offset, apply_time_offset # type: ignore

# Fuzzy-match threshold for classifying a highlight as successfully transferred.
# Below this score, we treat the annotation as an ORPHAN (source content was
# removed during publish) rather than snapping it to a semantically-unrelated
# nearby line. 60 is calibrated against token_set_ratio from fuzzywuzzy:
#   ~90+  exact/near-exact wording
#   ~70   meaningful overlap, edited phrasing
#   ~60   weak overlap (minimum we trust)
#   <60   effectively unrelated content
MATCH_THRESHOLD = 60

results = []
sql_updates = []


def _mark_orphan(annotid, save_Data):
    """
    Orphan case — the original draft content this highlight anchored to was
    removed during publish, so there's no target line in the published feed.
    We record cTransferStatus='O' and leave cTPageno/cTLineno/cTTime/tidentity
    NULL. et_marks filters orphans out of the published-view response so they
    don't render at wrong positions; a separate "Needs review" UI panel will
    surface them (reads jCordinates to show the original draft line text).
    """
    print(f"Orphan highlight {annotid}: source content removed during publish")
    sql_updates.append(
        f'UPDATE "RHighlights" SET "cTransferStatus" = \'O\' WHERE "nHid" = "{annotid}";'
    )
    if save_Data:
        execute_single_query(
            'UPDATE "RHighlights" SET "cTransferStatus"=%s WHERE "nHid" = %s;',
            ('O', annotid)
        )


def transfer_r_highlights(annotation_data, search_data, paths, save_Data=False):
    # Same constant-offset rescue as transfer_issue_detail — see utils.
    offset = estimate_time_offset(annotation_data, search_data)
    if offset:
        print(f"TIME-OFFSET: shifting highlight timestamps by {offset:+d}s ({offset / 3600.0:+.2f}h) before matching")
        apply_time_offset(annotation_data, offset)

    for annotation in annotation_data:
        annotid = annotation['annotid']
        try:
            if not annotation.get('detail'):  # skip if detail is missing or empty
                raise ValueError("No details found for annotation")

            # Extract first and last timestamps from the annotation's stored draft coords
            first_timestamp = annotation['detail'][0]['timestamp']
            last_timestamp = annotation['detail'][-1]['timestamp']

            # Find dynamic closest lower and upper timestamps in the published feed
            n = 1
            closest_lowers, closest_uppers = find_dynamic_closest_timestamps(
                search_data, first_timestamp, last_timestamp, n
            )

            # Determine extended timestamp range for filtering the candidate window
            extended_start_timestamp = closest_lowers[-1]['timestamp'] if closest_lowers else first_timestamp
            extended_end_timestamp = closest_uppers[-1]['timestamp'] if closest_uppers else last_timestamp

            # Filter published-feed lines within the extended range
            filtered_search_data = [
                entry for entry in search_data
                if extended_start_timestamp <= entry['timestamp'] <= extended_end_timestamp
            ]

            if not filtered_search_data:
                # No candidate lines at all in the timestamp window — definitely orphan.
                _mark_orphan(annotid, save_Data)
                continue

            first_three_entries = filtered_search_data[:3]
            first_detail_text = annotation['detail'][0]['originallinetext']

            # Primary match path: fuzzy token_set_ratio across the first 3 candidate lines
            best_match_start = find_best_match(first_three_entries, first_detail_text)

            # Classify: if we got no match, or the best match is below threshold,
            # this is an orphan. NOTE: we intentionally do NOT fall back to
            # closest_lowers/closest_uppers/filtered[0] — that would mask real
            # content deletions by anchoring the highlight to unrelated text,
            # which was the visible bug on test session d5bb2972 where the
            # first-page mic-check highlights were edited out of the final
            # transcript and a naive fallback snapped them to "(9.00 am)".
            if not best_match_start or best_match_start.get('match_ratio', 0) < MATCH_THRESHOLD:
                score = best_match_start.get('match_ratio', 0) if best_match_start else 0
                print(f"Orphan highlight {annotid}: best match score={score} (threshold {MATCH_THRESHOLD})")
                _mark_orphan(annotid, save_Data)
                continue

            # Strip internal scoring fields before using as an anchor
            def remove_additional_fields(entry):
                return {k: entry[k] for k in entry if k not in ['start_index', 'end_index', 'match_ratio']}

            anchor_line = remove_additional_fields(best_match_start)

            # Build transformed coord payload (kept schema-compatible with jTCordinates)
            new_line = {
                't': anchor_line.get('timestamp'),
                'x': annotation['detail'][0].get('x', 0),
                'y': annotation['detail'][0].get('y', 0),
                'width': 0,
                'height': 21.5,
                'p': anchor_line.get('pageno'),
                'l': anchor_line.get('lineno'),
                'text': annotation['detail'][0].get('originallinetext'),
            }
            transformed_lines = [new_line]

            results.append({
                "annotid": annotid,
                "lines": transformed_lines,
                "match_ratio": best_match_start.get('match_ratio'),
            })

            cTPageno = new_line['p']
            cTLineno = new_line['l']
            cTTime = new_line['t']

            # Emit SQL preview for the .sql log file
            sql_updates.append(
                f'UPDATE "RHighlights" SET "cTPageno" = \'{cTPageno}\','
                f'"cTLineno"=\'{cTLineno}\',"cTTime"=\'{cTTime}\','
                f'"cTransferStatus"=\'T\' WHERE "nHid" = "{annotid}";'
            )
            if save_Data:
                execute_single_query(
                    'UPDATE "RHighlights" '
                    'SET "cTPageno"=%s, "cTLineno"=%s, "cTTime"=%s, "cTransferStatus"=%s '
                    'WHERE "nHid" = %s;',
                    (cTPageno, cTLineno, cTTime, 'T', annotid)
                )

        except Exception as e:
            # Unexpected failure path (bad data shape, DB error, etc.) — surface to
            # logs and treat as orphan so it's visible to the user in "Needs review"
            # rather than silently lost.
            print(f"Error processing h annotid {annotid}: {e}")
            try:
                _mark_orphan(annotid, save_Data)
            except Exception as inner:
                print(f"  also failed to mark orphan: {inner}")

    # Save results to a JSON file
    with open(paths['output_file'], 'w') as outfile:
        json.dump(results, outfile, indent=4)

    # Save SQL update script to a file
    with open(paths['sql_output_file'], 'w') as sql_file:
        sql_file.write('\n'.join(sql_updates))

    print("RHighlights Results saved to", paths['output_file'])
    print("RHighlights SQL update script saved to", paths['sql_output_file'])
