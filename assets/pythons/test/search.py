from datetime import datetime
from startedge import search_consecutive_words,find_best_overall_match
from lastedge import search_consecutive_words_lastindex,find_best_overall_match_last

def perform_search(destination, filtered_line_texts, details,id):
    search_data = filtered_line_texts[:2]
    #print(json.dumps(search_data,indent=4))
    results = search_consecutive_words(destination, search_data)
   # print('destination:', destination);
   # print('results:', json.dumps(results,indent=4))
    best_match = find_best_overall_match(results)
  #  print('best_match:', best_match)
    
    if best_match is None:
     #   print("best_match is none for trying with.", id)
        if len(details) > 1:
            destination = details[1]['originallinetext'].lower()
        else:
            destination = details[0]['originallinetext'].lower()
      #  print('destination:', destination,'\n');
        results = search_consecutive_words(destination, search_data)
        best_match = find_best_overall_match(results)
    if best_match is None and len(filtered_line_texts) > 2:
      best_match =  perforResearch(details[0]['originallinetext'].lower(), filtered_line_texts[:3], details,id)
        

    return best_match

def perforResearch(destination, search_data, details,id):
   # print('\n\n re search',destination);
   # print(search_data)
    results = search_consecutive_words(destination, search_data)
    #print('results:', results)
    best_match = find_best_overall_match(results)
   # print('best_match:', best_match)
    if best_match is None:
    #    print("perforResearch : best_match is none for trying with.", id)
        if len(details) > 1:
            destination = details[1]['originallinetext'].lower()
        else:
            destination = details[0]['originallinetext'].lower()
     #   print('perforResearch :  destination:', destination,'\n');
        results = search_consecutive_words(destination, search_data)
        best_match = find_best_overall_match(results)
    return best_match



def perform_search_last(destination, filtered_line_texts, details,id):
    ln = len(details)
    filtered_line_texts_sorted =   sorted(filtered_line_texts, key=lambda x: datetime.strptime(x['timestamp'], '%H:%M:%S'), reverse=True)
    destination = details[ln-1]['originallinetext'].lower();
    search_data = filtered_line_texts_sorted[:2]
    #print('search_data = ',json.dumps(search_data,indent=4))
    results = search_consecutive_words_lastindex(destination, search_data)
    #print('destination:', destination);
    #print('results:', json.dumps(results,indent=4))
    best_match = find_best_overall_match_last(results)
    #print('best_match:', best_match)
    
    if best_match is None:
     #   print("best_match is none for trying with.", id)
        if ln > 1:
            destination = details[ln-2]['originallinetext'].lower()
        else:
            destination = details[ln-1]['originallinetext'].lower()
      #  print('destination:', destination,'\n');
        results = search_consecutive_words_lastindex(destination, search_data)
        best_match = find_best_overall_match_last(results)
    if best_match is None and len(filtered_line_texts_sorted) > 2:
      best_match =  perforResearch_last(details[ln-1]['originallinetext'].lower(), filtered_line_texts_sorted[:3], details,id)
        

    return best_match

def perforResearch_last(destination, search_data, details,id):
    ln = len(details)
    destination = details[ln-1]['originallinetext'].lower()
   # print('\n\n re search',destination);
   # print(search_data)
    results = search_consecutive_words_lastindex(destination, search_data)
    #print('results:', results)
    best_match = find_best_overall_match_last(results)
   # print('best_match:', best_match)
    if best_match is None:
    #    print("perforResearch : best_match is none for trying with.", id)
        if len(details) > 1:
            destination = details[ln-2]['originallinetext'].lower()
        else:
            destination = details[ln-1]['originallinetext'].lower()
     #   print('perforResearch :  destination:', destination,'\n');
        results = search_consecutive_words_lastindex(destination, search_data)
        best_match = find_best_overall_match_last(results)
    return best_match




