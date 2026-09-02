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

def _timestamp_to_seconds(timestamp):
    """'HH:MM:SS[:FF]' -> seconds since midnight, or None when unparseable."""
    try:
        parts = clean_timestamp(str(timestamp)).split(':')
        if len(parts) != 3:
            return None
        h, m, s = (int(p) for p in parts)
        return h * 3600 + m * 60 + s
    except (ValueError, TypeError):
        return None


def shift_timestamp(timestamp, offset_seconds):
    """Shift an 'HH:MM:SS[:FF]' timestamp by offset_seconds (wraps midnight)."""
    secs = _timestamp_to_seconds(timestamp)
    if secs is None:
        return timestamp
    secs = (secs + int(offset_seconds)) % 86400
    return f"{secs // 3600:02d}:{(secs % 3600) // 60:02d}:{secs % 60:02d}"


def estimate_time_offset(annotation_data, search_data, sample_limit=15, min_ratio=75, min_text_len=20):
    """
    Constant clock offset (seconds) between annotation timestamps and the
    published draft's timestamps.

    Live CaseView lines were historically stamped with the SERVER's wall clock
    while the published draft carries the reporter's hearing-local times — a
    whole-hours offset that pushes every timestamp window off target and
    orphans the entire transfer. Text is the tz-independent signal: fuzzy-anchor
    a sample of annotation lines to the draft by content alone, then take the
    median (draft - mark) delta. Median across the sample discards the odd
    wrong-line anchor; short/generic lines are skipped for the same reason.

    Returns whole seconds rounded to 15-minute steps; 0 when the evidence is
    thin (<3 anchors) or the offset is under 30 minutes (window search already
    absorbs small skew, and shifting on weak evidence is worse than not).
    """
    deltas = []
    for annotation in annotation_data:
        detail = annotation.get('detail') or []
        if not detail:
            continue
        text = (detail[0].get('originallinetext') or '').strip()
        mark_secs = _timestamp_to_seconds(detail[0].get('timestamp'))
        if len(text) < min_text_len or mark_secs is None:
            continue
        best = find_best_match(search_data, text)
        if not best or best.get('match_ratio', 0) < min_ratio:
            continue
        draft_secs = _timestamp_to_seconds(best.get('timestamp'))
        if draft_secs is None:
            continue
        delta = draft_secs - mark_secs
        if delta >= 43200:
            delta -= 86400
        elif delta < -43200:
            delta += 86400
        deltas.append(delta)
        if len(deltas) >= sample_limit:
            break
    if len(deltas) < 3:
        return 0
    deltas.sort()
    median = deltas[len(deltas) // 2]
    offset = int(round(median / 900.0)) * 900
    if abs(offset) < 1800:
        return 0
    return offset


def apply_time_offset(annotation_data, offset_seconds):
    """Shift every detail timestamp in place; call before window matching."""
    for annotation in annotation_data:
        for d in annotation.get('detail') or []:
            if d.get('timestamp'):
                d['timestamp'] = shift_timestamp(d['timestamp'], offset_seconds)


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
