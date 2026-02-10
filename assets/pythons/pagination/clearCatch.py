import sys
import json
import os
from pydo import Client


def purge_cdn_cache(file_key):
    try:
        # Purge the cache for the specified CDN
        purge_resp = client.cdn.purge_cache(cdn_id, purge_req)
        print("Purge response:", purge_resp)
    except Exception as e:
        print(f"Error purging CDN cache: {e}")


cdn_id = f'{os.getenv('DO_CDN_ID')}'
cPath = sys.argv[1]

# for data in jsonData:   
if cPath:    
    output_file_key = cPath    
    purge_req = {"files": [output_file_key]}
    purge_cdn_cache(purge_req)
else:    
    sys.stdout.write(error)
