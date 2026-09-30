from datetime import datetime, timedelta
from fuzzywuzzy import fuzz


def find_best_match(search_data, search):
    best_match = None
    highest_ratio = 0
    
    for entry in search_data:
        linetext = entry['linetext']
        
        # Calculate the match ratio using token_set_ratio
        ratio = fuzz.token_set_ratio(linetext, search)
        
        if ratio > highest_ratio:
            highest_ratio = ratio
            best_match = entry.copy()
            best_match['match_ratio'] = ratio

    return best_match




def find_dynamic_closest_timestamps(search_data, start_timestamp, end_timestamp, n=2):
    lower_timestamps = []
    upper_timestamps = []
    start_time = datetime.strptime(start_timestamp, "%H:%M:%S")
    end_time = datetime.strptime(end_timestamp, "%H:%M:%S")
    
    for entry in search_data:
        current_time = datetime.strptime(entry['timestamp'], "%H:%M:%S")
        if current_time < start_time:
            lower_timestamps.append(entry)
        if current_time > end_time:
            upper_timestamps.append(entry)
    
    lower_timestamps.sort(key=lambda x: datetime.strptime(x['timestamp'], "%H:%M:%S"), reverse=True)
    upper_timestamps.sort(key=lambda x: datetime.strptime(x['timestamp'], "%H:%M:%S"))
    
    closest_lowers = lower_timestamps[:n]
    closest_uppers = upper_timestamps[:n]
    
    if len(closest_lowers) < n and closest_lowers:
        closest_lowers.extend([closest_lowers[-1]] * (n - len(closest_lowers)))
    if len(closest_uppers) < n and closest_uppers:
        closest_uppers.extend([closest_uppers[-1]] * (n - len(closest_uppers)))

    return closest_lowers, closest_uppers
