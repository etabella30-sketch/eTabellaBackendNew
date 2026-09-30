from datetime import datetime
import json



def transform_data_highlights(result):
    annotations = []
   # print(result)
    for row in result:
        #print(f"row = {row} \n",len(row))
        if row[5] is None:
            continue;
        
       # print(f"row = {row} \n")
        nHid = str(row[0])
       # print(nHid,row[5])
        cONote = row[1]
        jCordinates = row[2]
        cPageno = row[3]
        cLineno = row[4]
        
        details = jCordinates
        cNote_lines = [line.strip() for line in cONote.split('\n') if line.strip()]
        timestamp = row[5]
        transformed_details = []
        i = 0
        for detail in details:
            originallinetext = cNote_lines[i] if i < len(cNote_lines) else ''
            #print(detail)
           # timestamp = detail.get("t", "")
            if timestamp == "":
                print("timestmap is empty")
                continue;
            transformed_details.append({
                "timestamp":timestamp,
                "originallinetext": originallinetext,
                "x": detail["x"],
                "y": detail["y"],
                "height": detail.get("height", 22),  # Assuming default height if not provided
                "width": detail.get("width", 100),  # Assuming default width if not provided
                
                
            })
            i += 1
        
        annotations.append({
            "annotid": nHid,
            "cLineno":cLineno,
            "cPageno": cPageno,
            "detail": transformed_details
        })
    
    return annotations

def transform_data(result):
    annotations = []
    
    for row in result:
        nIDid = str(row[0])
        cONote = row[1]
        jCordinates = row[2]
        cPageno = row[3]
        
        details = jCordinates
        cNote_lines = [line.strip() for line in cONote.split('\n') if line.strip()]
        
        transformed_details = []
        i = 0
        for detail in details:
            originallinetext = cNote_lines[i] if i < len(cNote_lines) else ''
            transformed_details.append({
                "timestamp": detail["t"],
                "originallinetext": originallinetext,
                "x": detail["x"],
                "y": detail["y"],
                "height": detail.get("height", 22),  # Assuming default height if not provided
                "width": detail.get("width", 100),  # Assuming default width if not provided
                "pageno": cPageno
            })
            i += 1
        
        annotations.append({
            "annotid": nIDid,
            "detail": transformed_details
        })
    
    return annotations
