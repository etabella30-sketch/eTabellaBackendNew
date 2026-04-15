import difflib

def search_consecutive_words_lastindex(destination, search_data):
    # Sort search data by timestamp in descending order
    search_data_sorted = search_data #sorted(search_data, key=lambda x: datetime.strptime(x['timestamp'], '%H:%M:%S'), reverse=True)
    
    # Convert the destination string to lowercase
    destination = destination.lower()
    # Split the destination string into words
    dest_words = destination.split()
    
    # Initialize the results list
    results = []
    
    for search_item in search_data_sorted:
        search_lower = search_item["linetext"].lower()
        search_words = search_lower.split()
        match_results = []

        s = difflib.SequenceMatcher(None, dest_words, search_words)
        
        for match in s.get_matching_blocks():
            # Consider matches with size > 1 for consecutive or single-word match
            if match.size > 1 or (len(dest_words) == 1 and match.size == 1):  
                match_start = match.a
                consecutive_count = match.size
                match_indices = list(range(match.a, match.a + match.size))
                matched_words = dest_words[match.a:match.a + match.size]
                
                # Find the start offset in the search string
                search_start = search_lower.find(' '.join(matched_words))
                # Calculate end index
                end_index = search_start + len(' '.join(matched_words)) - 1
                
                match_results.append({
                    'lasttimestamp': search_item['timestamp'],
                    'last_match_start': search_start,
                    'destination':destination,
                    'last_end_index': end_index,
                    'last_lineno': search_item['lineno'],
                    'last_pageno': search_item['pageno'],
                    'last_linetext': search_item['linetext'],
                    'last_consecutive_count': consecutive_count,
                    'last_match_indices': match_indices,
                    'last_matched_words': matched_words
                })

        if match_results:
            # Sort match results by the smallest match_start, then by the smallest value in match_indices, and finally by consecutive_count
            match_results = sorted(match_results, key=lambda x: (x['last_match_start'], x['last_match_indices'][0], -x['last_consecutive_count']))
            best_match = match_results[0]
        else:
            best_match = {}

        results.append(best_match)
    
    return results


def find_best_overall_match_last(results):
    best_match = None

    for best_result in results:
        if best_result and 'last_match_start' in best_result:
            if best_match is None:
                best_match = best_result
            else:
                if (
                    best_result['last_match_indices'][0] < best_match.get('last_match_indices', [float('inf')])[0] or
                    (best_result['last_match_indices'][0] == best_match.get('last_match_indices', [float('inf')])[0] and 
                     best_result['last_match_start'] < best_match.get('last_match_start', float('inf'))) or
                    (best_result['last_match_indices'][0] == best_match.get('last_match_indices', [float('inf')])[0] and 
                     best_result['last_match_start'] == best_match.get('last_match_start', float('inf')) and 
                     best_result['last_consecutive_count'] > best_match.get('last_consecutive_count', 0))
                ):
                    best_match = best_result

    return best_match
