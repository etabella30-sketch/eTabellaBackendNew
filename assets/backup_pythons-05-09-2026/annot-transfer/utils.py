from datetime import datetime, timedelta
from fuzzywuzzy import fuzz
import sys

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

def clean_timestamp(timestamp):
    # Split by colon and take only HH:MM:SS part
    parts = timestamp.split(':')
    if len(parts) > 3:
        return ':'.join(parts[:3])
    return timestamp

def find_dynamic_closest_timestamps(search_data, start_timestamp, end_timestamp, n=2):
    lower_timestamps = []
    upper_timestamps = []

    time_format = "%H:%M:%S"

    # Clean timestamps before processing
    start_timestamp = clean_timestamp(start_timestamp)
    end_timestamp = clean_timestamp(end_timestamp)

    start_time = datetime.strptime(start_timestamp, time_format)
    end_time = datetime.strptime(end_timestamp, time_format)
    
    for entry in search_data:
        # Clean entry timestamp
        entry_timestamp = clean_timestamp(entry['timestamp'])
        current_time = datetime.strptime(entry_timestamp, time_format)
        if current_time < start_time:
            entry_copy = entry.copy()
            entry_copy['timestamp'] = entry_timestamp
            lower_timestamps.append(entry_copy)
        if current_time > end_time:
            entry_copy = entry.copy()
            entry_copy['timestamp'] = entry_timestamp
            upper_timestamps.append(entry_copy)
    
    lower_timestamps.sort(key=lambda x: datetime.strptime(x['timestamp'], time_format), reverse=True)
    upper_timestamps.sort(key=lambda x: datetime.strptime(x['timestamp'], time_format))
    
    closest_lowers = lower_timestamps[:n]
    closest_uppers = upper_timestamps[:n]
    
    if len(closest_lowers) < n and closest_lowers:
        closest_lowers.extend([closest_lowers[-1]] * (n - len(closest_lowers)))
    if len(closest_uppers) < n and closest_uppers:
        closest_uppers.extend([closest_uppers[-1]] * (n - len(closest_uppers)))

    return closest_lowers, closest_uppers
