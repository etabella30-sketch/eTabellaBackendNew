import difflib


def search_consecutive_words(destination, search_data):
    # Convert the destination string to lowercase
    destination = destination.lower()
    # Split the destination string into words
    dest_words = destination.split()
    
    # Initialize the results list
    results = []
    
    for search_item in search_data:
        search_lower = search_item["linetext"].lower()
        search_words = search_lower.split()
        match_results = []
        non_consecutive_matches = []
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
                
                match_results.append({
                    'newtimestamp': search_item['timestamp'],
                    'destination':destination,
                    'match_start': search_start,
                    'newlineno': search_item['lineno'],
                    'newpageno': search_item['pageno'],
                    'newlinetext': search_item['linetext'],
                    'consecutive_count': consecutive_count,
                    'match_indices': match_indices,
                    'matched_words': matched_words
                })
            if match.size == 1:
                non_consecutive_indices = [match.a]
                non_consecutive_words = [dest_words[match.a]]

                non_consecutive_matches.append({
                    'match_index': match.a,
                    'matched_word': dest_words[match.a]
                })
        if match_results:
            # Sort match results by the smallest match_start, then by the smallest value in match_indices, and finally by consecutive_count
            match_results = sorted(match_results, key=lambda x: (x['match_start'], x['match_indices'][0], -x['consecutive_count']))
            best_match = match_results[0]
            if non_consecutive_matches:
                best_match['non_consecutive_matches'] = non_consecutive_matches
        else:
            best_match = {}


        results.append(best_match)
    
    return results

def find_best_overall_match(results):
    best_match = None

    for best_result in results:
        if best_result and 'match_start' in best_result:
            if best_match is None:
                best_match = best_result
            else:
                if (
                    best_result['match_indices'][0] < best_match.get('match_indices', [float('inf')])[0] or
                    (best_result['match_indices'][0] == best_match.get('match_indices', [float('inf')])[0] and 
                     best_result['match_start'] < best_match.get('match_start', float('inf'))) or
                    (best_result['match_indices'][0] == best_match.get('match_indices', [float('inf')])[0] and 
                     best_result['match_start'] == best_match.get('match_start', float('inf')) and 
                     best_result['consecutive_count'] > best_match.get('consecutive_count', 0))
                ):
                    best_match = best_result

    # Merge non-consecutive matches into match_indices and matched_words
    if best_match is None:
        #print('\nbest_match','\n',best_match)
        return best_match
    if 'non_consecutive_matches' in best_match and best_match is not None:
        if best_match['non_consecutive_matches'] is not None:
            for non_consecutive in best_match['non_consecutive_matches']:
                if non_consecutive['match_index'] not in best_match['match_indices']:
                    best_match['match_indices'].append(non_consecutive['match_index'])
                    best_match['matched_words'].append(non_consecutive['matched_word'])
                
            # Sort the merged lists
            combined = sorted(zip(best_match['match_indices'], best_match['matched_words']))
            best_match['match_indices'], best_match['matched_words'] = zip(*combined)

            # Recalculate the match_start
            
            search_lower = best_match['newlinetext'].lower()
           
            new_match_start = search_lower.find(' '.join(best_match['matched_words']))
            best_match['match_start'] = new_match_start
    best_match['searched_text'] = ' '.join(best_match['matched_words'])
    return best_match


def find_best_overall_match1(results):
    best_match = None

    for best_result in results:
        if best_result and 'match_start' in best_result:
            if best_match is None:
                best_match = best_result
            else:
                if (
                    best_result['match_indices'][0] < best_match.get('match_indices', [float('inf')])[0] or
                    (best_result['match_indices'][0] == best_match.get('match_indices', [float('inf')])[0] and 
                     best_result['match_start'] < best_match.get('match_start', float('inf'))) or
                    (best_result['match_indices'][0] == best_match.get('match_indices', [float('inf')])[0] and 
                     best_result['match_start'] == best_match.get('match_start', float('inf')) and 
                     best_result['consecutive_count'] > best_match.get('consecutive_count', 0))
                ):
                    best_match = best_result

    return best_match
