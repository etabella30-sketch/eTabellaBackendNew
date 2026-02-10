import fitz
import math
import sys
import json
import logging
from datetime import datetime
import time
import concurrent.futures
import os
import shutil
import boto3
from botocore.client import Config
from botocore.exceptions import NoCredentialsError, PartialCredentialsError, ClientError

def get_date():
    date = datetime.now()
    year = date.year
    month = date.month
    day = date.day
    return f"{year:04d}-{month:02d}-{day:02d}"

lgfile = get_date()

def hex_to_rgba(hex_color):
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return (r, g, b)

def rotate_rect(rect, angle, center):
    x1, y1, x2, y2 = rect.x0, rect.y0, rect.x1, rect.y1
    x1 -= center[0]
    y1 -= center[1]
    x2 -= center[0]
    y2 -= center[1]
    x1_rotated = x1 * math.cos(math.radians(angle)) - y1 * math.sin(math.radians(angle))
    y1_rotated = x1 * math.sin(math.radians(angle)) + y1 * math.cos(math.radians(angle))
    x2_rotated = x2 * math.cos(math.radians(angle)) - y2 * math.sin(math.radians(angle))
    y2_rotated = x2 * math.sin(math.radians(angle)) + y2 * math.cos(math.radians(angle))
    x1_rotated += center[0]
    y1_rotated += center[1]
    x2_rotated += center[0]
    y2_rotated += center[1]
    rotated_rect = fitz.Rect(min(x1_rotated, x2_rotated), min(y1_rotated, y2_rotated), max(x1_rotated, x2_rotated), max(y1_rotated, y2_rotated))
    return rotated_rect

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def are_rects_intersecting(rect1, rect2):
    rect1Left = rect1["x"]
    rect1Right = rect1["x"] + rect1["width"]
    rect1Top = rect1["y"]
    rect1Bottom = rect1["y"] + rect1["height"]
    rect2Left =  rect2["x"]
    rect2Right =  rect2["x"] + rect2["width"]
    rect2Top = rect2["y"]
    rect2Bottom =  rect2["y"] + rect2["height"]
    if rect1Left < rect2Right and rect1Right > rect2Left and rect1Top < rect2Bottom and rect1Bottom > rect2Top :
        return True
    return False

def check_position(annotpages, ind, obj):
    def check_position_inner(rect):
        for z in annotpages[ind]['icons']:
            if are_rects_intersecting(obj, z):
                return True
        return False
    count = 0
    while check_position_inner(obj):
        count += 1
        obj['y'] = obj['y'] - obj['height']
        if count > 5:
            break
    return obj

def get_max_min_value(array, colm1, colm):
    try:
        result = {'frm': 0, 'to': 0}
        if not array:
            return result
        for item in array:
            if colm in item:
                result['frm'] = min(result['frm'], item[colm1])
                result['to'] = max(result['to'], item[colm])
        result['frm'] =  float(result['frm']) + float(array[0]["y"])
        result['to'] =  float(result['to']) + float(array[0]["height"])
        logging.error(f"get_max_min_value : {result}")
        return result
    except Exception as e:
        logging.error(f"get_max_min_value error : {e}")
        return 0

def draw_image(annotpages, page, type, maxmin, pgwidth, pageNo, size='S'):
    try:
        # Define size mapping
        size_map = {
            'S': {'width': 8, 'height': 9},
            'M': {'width': 12, 'height': 14},
            'L': {'width': 18, 'height': 21},
        }
        # Fallback to 'L' if invalid size
        img_size = size_map.get(size.upper(), size_map['L'])
        # Define offset mapping for gap between line and image (dramatic values for testing)
        offset_map = {
            'S': 0,
            'M': 8,
            'L': 20,
        }
        offset = offset_map.get(size.upper(), 8)  # Default to 8 if size is invalid
        startX = max(pgwidth - 20, 20)
        startY = maxmin['frm'] - 10 if type == 'D' else maxmin['frm']
        endX = (pgwidth) - 20
        endY = maxmin['to'] + 10 if type == 'D' else maxmin['to']
        color = hex_to_rgb('#000000')
        logging.error(f"{[startX, startY], [endX, endY]} drow line")
        page.draw_line([startX, startY], [endX, endY], color=color, width=2)
        # Debug log for offset and size
        logging.error(f"Image size: {size}, offset: {offset}, y: {startY + offset}")
        obj = {
            'x': endX - 25,
            'y': startY + offset,
            'width': img_size['width'] if type == 'D' else img_size['width'] + 1,
            'height': img_size['height'] if type in ['F', 'W'] else img_size['height'] + 2,
        }
        inds = next((i for i, a in enumerate(annotpages) if a['pg'] == pageNo), -1)
        if inds > -1:
            obj = check_position(annotpages, inds, obj)
            annotpages[inds]['icons'].append(obj)
        img_path = fact_img if type == 'F' else factq_img if type == 'QF' else doc_img if type == 'D' else web_img
        logging.error(f"{obj['x'], obj['y'], obj['x'] + obj['width'], obj['y'] + obj['height']} image inserting {type}")
        page.insert_image(
            fitz.Rect(obj["x"], obj["y"], obj["x"] + obj["width"], obj["y"] + obj["height"]),
            filename=img_path,
            overlay=True
        )
    except FileNotFoundError:
        logging.error(f"drawing annot{{error}}")

def draw_rounded_rect(page, rect, radius, colour, width):
    c = 0.5522847498 * radius
    x0, y0, x1, y1 = rect.x0, rect.y0, rect.x1, rect.y1
    p1 = (x0 + radius, y0)
    p2 = (x1 - radius, y0)
    p3 = (x1, y0 + radius)
    p4 = (x1, y1 - radius)
    p5 = (x1 - radius, y1)
    p6 = (x0 + radius, y1)
    p7 = (x0, y1 - radius)
    p8 = (x0, y0 + radius)
    shape = page.new_shape()
    shape.draw_line(p1, p2)
    shape.draw_bezier(p2, (x1 - c, y0), (x1, y0 + c), p3)
    shape.draw_line(p3, p4)
    shape.draw_bezier(p4, (x1, y1 - c), (x1 - c, y1), p5)
    shape.draw_line(p5, p6)
    shape.draw_bezier(p6, (x0 + c, y1), (x0, y1 - c), p7)
    shape.draw_line(p7, p8)
    shape.draw_bezier(p8, (x0, y0 + c), (x0 + c, y0), p1)
    shape.finish(color=colour, fill=None, width=width)
    shape.commit()

def rotate_point(pt, angle_deg, centre):
    if angle_deg % 360 == 0:
        return pt
    x, y = pt
    cx, cy = centre
    rad = math.radians(angle_deg)
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    nx = cx + cos_a * (x - cx) - sin_a * (y - cy)
    ny = cy + sin_a * (x - cx) + cos_a * (y - cy)
    return nx, ny

def drow_ract(annotpages, x, page, rotation):
    try:
        pgh = page.rect.height
        pgw = page.rect.width
        colour = hex_to_rgba(x["color"])
        if x.get("type") == "drawing" and x.get("lines"):
            centre = (pgw/2, pgh/2)
            pts = [rotate_point((float(px), float(py)), rotation, centre) for px, py in x["lines"]]
            ink = page.add_ink_annot([pts])
            ink.set_colors(stroke=colour)
            ink.set_border(width=4)
            ink.set_opacity(0.8)
            ink.update()
            ys = [pt[1] for pt in pts]
            draw_image(annotpages, page, x["linktype"], {"frm":min(ys), "to":max(ys)}, pgw, x["page"])
            return
        if x.get("type") == "area" and x.get("rects"):
            for ls in x["rects"]:
                right_margin = 50
                page_right = page.rect.width
                intended_right = ls["x"] + ls["width"]
                max_right = page_right - right_margin
                if intended_right > max_right:
                    ls["width"] = max_right - ls["x"]
                    if ls["width"] < 0:
                        ls["width"] = 0
                rect = fitz.Rect(ls["x"], ls["y"], ls["x"]+ls["width"], ls["y"]+ls["height"])
                centre = ((rect.x0+rect.x1)/2, (rect.y0+rect.y1)/2)
                rect = rotate_rect(rect, rotation, centre)
                radius = 12
                draw_rounded_rect(page, rect, radius=radius, colour=colour, width=1.8)
            maxmin = {"frm": min(r["y"] for r in x["rects"]),
                       "to":  max(r["y"]+r["height"] for r in x["rects"]) }
            draw_image(annotpages, page, x["linktype"], maxmin, pgw, x["page"])
            return
        if x.get("rects"):
            for ls in x["rects"]:
                rect = fitz.Rect(ls["x"], ls["y"], ls["x"]+ls["width"], ls["y"]+ls["height"])
                centre = ((rect.x0+rect.x1)/2, (rect.y0+rect.y1)/2)
                rect = rotate_rect(rect, rotation, centre)
                hl = page.add_highlight_annot(rect)
                hl.set_colors(stroke=colour, fill=colour)
                hl.set_opacity(0.8)
                hl.update()
            maxmin = {"frm": min(r["y"] for r in x["rects"]),
                      "to":  max(r["y"]+r["height"] for r in x["rects"]) }
            draw_image(annotpages, page, x["linktype"], maxmin, pgw, x["page"])
    except Exception as e:
        logging.error(f"Error in drow_ract: {e}")


def draw_doclink(annotpages,x,page,rotation):
    try:
     pghight = page.rect.height
     pgwidth = page.rect.width
     logging.error(f"draw_doclink Step 3.1.2  {x}")
     if x and x["rects"] and len(x["rects"]):
        # logging.error(f"Step 3.1.2")
        # pghight = page.mediabox[3]
        # pgwidth = page.mediabox[2]
        for ls in x["rects"]:
            try:
                y_pth = (pghight - ls["y"]) - ls["height"]
                ls["original_y"] = y_pth

                # startX = ls["x"]
                # startY = (ls["y"]) - 80
                # endX = ls["x"] + ls["width"]
                # endY = (ls["y"] + ls["height"]) - 80
                
                
                startX = ls['x']
                startY = ls['y']  # Adjust y-coordinate
                endX = ls["x"] + ls["width"]
                endY = (ls["y"])
                
                    
                logging.error(f"{startX, startY, endX, endY}")
                # logging.error(f"Step 3.1.3  - page-height = {pghight}")
                # x0,y0 = (margin/2) + margin_h,page.rect.height - height-(margin/2) - margin_v
                poly_rect =  fitz.Rect(startX, startY, endX, endY)

            
                poly_center = ((poly_rect.x0 + poly_rect.x1) / 2, (poly_rect.y0 + poly_rect.y1) / 2)    
                poly_rotated_rect = rotate_rect(poly_rect, rotation, poly_center) 
                border_color = hex_to_rgba(x["color"])
                fill_color = hex_to_rgba(x["color"])
                
                # page.draw_rect(poly_rotated_rect, color=border_color, width=2, fill=border_color, stroke_opacity=0.5, fill_opacity=0.5, overlay=True)
                # annot.update(opacity=0.5)
                # page.draw_line((startX, startY), (endX, endY), color=border_color, width=0.5, dashes=[4])
                x1,y1,x2,y2 = startX,startY,endX + 2,endY
                dash_length,space_length = 2,2
                total_length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
                num_dashes = int(total_length / (dash_length + space_length))
                
                logging.error(f"num_dashes ",num_dashes)
                for i in range(num_dashes):
                    segment_start_x = x1 + (x2 - x1) * (i * (dash_length + space_length)) / total_length
                    segment_start_y = y1 + (y2 - y1) * (i * (dash_length + space_length)) / total_length
                    segment_end_x = x1 + (x2 - x1) * ((i * (dash_length + space_length)) + dash_length) / total_length
                    segment_end_y = y1 + (y2 - y1) * ((i * (dash_length + space_length)) + dash_length) / total_length
                    if segment_end_x > x2 or segment_end_y > y2:
                        segment_end_x = x2
                        segment_end_y = y2
                    page.draw_line([segment_start_x, segment_start_y], [segment_end_x, segment_end_y], color=border_color, width=0.5)              
                maxmin = get_max_min_value(x["rects"], 'original_y', 'y')
                draw_image(annotpages, page, 'D', maxmin, pgwidth, x["page"])
            except Exception as e:   
               logging.error(f"doc link error {e}")
            
            logging.error(f"doc link annot created ")              
    except Exception as e:   
        logging.error(f"doc link annot error {e}")


def draw_weblink(annotpages,x,page,rotation):
    try:
     pghight = page.rect.height
     pgwidth = page.rect.width
     if x["rects"] and len(x["rects"]):
        # logging.error(f"Step 3.1.2")
        for ls in x["rects"]:
            try:
                # pghight = page.mediabox[3]
                # pgwidth = page.mediabox[2]
                y_pth = (pghight - ls["y"]) - ls["height"]
                ls["original_y"] = y_pth

                # startX = ls["x"]
                # startY = (ls["y"]) - 80
                # endX = ls["x"] + ls["width"]
                # endY = (ls["y"] + ls["height"]) - 80
                
                
                startX = ls['x']
                startY = ls['y']  # Adjust y-coordinate
                endX = ls["x"] + ls["width"]
                endY = (ls["y"])
                
                
                    
                # logging.error(f"{startX, startY, endX, endY}")
                # logging.error(f"Step 3.1.3  - page-height = {pghight}")
                # x0,y0 = (margin/2) + margin_h,page.rect.height - height-(margin/2) - margin_v
                poly_rect =  fitz.Rect(startX, startY, endX, endY)

            
                poly_center = ((poly_rect.x0 + poly_rect.x1) / 2, (poly_rect.y0 + poly_rect.y1) / 2)    
                poly_rotated_rect = rotate_rect(poly_rect, rotation, poly_center)       
                points = [
                    fitz.Point(poly_rotated_rect[0], poly_rotated_rect[1]), 
                    fitz.Point(poly_rotated_rect[2], poly_rotated_rect[1]),
                    fitz.Point(poly_rotated_rect[2],poly_rotated_rect[3]), 
                    fitz.Point(poly_rotated_rect[0], poly_rotated_rect[3])
                ]
                border_color = hex_to_rgba(x["color"])
                fill_color = hex_to_rgba(x["color"])
                
                # page.draw_rect(poly_rotated_rect, color=border_color, width=2, fill=border_color, stroke_opacity=0.5, fill_opacity=0.5, overlay=True)
                # annot.update(opacity=0.5)
                page.draw_line((startX, startY), (endX, endY), color=border_color, width=0.5)
                maxmin = get_max_min_value(x["rects"], 'original_y', 'y')
                draw_image(annotpages, page, 'W', maxmin, pgwidth, x["page"])
            except Exception as e:   
               logging.error(f"doc link error {e}")
            
            logging.error(f"doc link annot created ")  
                  
    except Exception as e:   
        logging.error(f"web link annot error {e}")      
           
           
def draw_drawing(mdl,x,page,rotation):
    
    try:
     pghight = page.rect.height
     pgwidth = page.rect.width
     if x["rects"] and len(x["rects"]):
        # logging.error(f"Step 3.1.2")
        for ls in x["rects"]:
            # pghight = page.mediabox[3]
            # pgwidth = page.mediabox[2]
            y_pth = (pghight - ls["y"]) - ls["height"]
            ls["original_y"] = y_pth

            # startX = ls["x"]
            # startY = (ls["y"]) - 80
            # endX = ls["x"] + ls["width"]
            # endY = (ls["y"] + ls["height"]) - 80
            
            
            startX = ls['x']
            startY = ls['y']  # Adjust y-coordinate
            endX = ls["x"] + ls["width"]
            endY = (ls["y"])
            
            
                
            # logging.error(f"{startX, startY, endX, endY}")
            # logging.error(f"Step 3.1.3  - page-height = {pghight}")
            # x0,y0 = (margin/2) + margin_h,page.rect.height - height-(margin/2) - margin_v
            poly_rect =  fitz.Rect(startX, startY, endX, endY)

        
            poly_center = ((poly_rect.x0 + poly_rect.x1) / 2, (poly_rect.y0 + poly_rect.y1) / 2)    
            poly_rotated_rect = rotate_rect(poly_rect, rotation, poly_center)       
            points = [
                fitz.Point(poly_rotated_rect[0], poly_rotated_rect[1]), 
                fitz.Point(poly_rotated_rect[2], poly_rotated_rect[1]),
                fitz.Point(poly_rotated_rect[2],poly_rotated_rect[3]), 
                fitz.Point(poly_rotated_rect[0], poly_rotated_rect[3])
            ]
            border_color = hex_to_rgba(x["color"])
            fill_color = hex_to_rgba(x["color"])
            
            # page.draw_rect(poly_rotated_rect, color=border_color, width=2, fill=border_color, stroke_opacity=0.5, fill_opacity=0.5, overlay=True)
            # annot.update(opacity=0.5)
            page.draw_line((startX, startY), (endX, endY), color=border_color, width=0.5)
                         
    except Exception as e:   
        logging.error(f"drawing annot error{e}")


# Retain your other draw functions here (draw_doclink, draw_weblink, draw_drawing) as in your original code.

def add_footer_polygon(new_doc, start_page, end_page, data):
    font_name = "helv"
    font = fitz.Font(font_name)
    batch_start_time = time.time()
    annotpages = []
    logging.warning(f"batch {start_page},{end_page}")
    try:
        for page_number in range(start_page, end_page):
            page = new_doc[page_number]
            if data['cOrientation'] =='P':
                page.set_rotation(0)
            page.wrap_contents()
            rotation = page.rotation
            annotations_array = []
            if data['highlights'] and len(data['highlights']):
                for item in data['highlights']:
                    if(item["page"] == (page_number+1)):
                        annotations_array.append(item)
            for x in annotations_array:
                try:
                    if x:
                        if x["linktype"] == 'QF' or x["linktype"] == 'F':
                            drow_ract(annotpages, x, page, rotation)
                        elif x["linktype"] == 'D':
                            draw_doclink(annotpages, x, page, rotation)
                        elif x["linktype"] == 'W':
                            draw_weblink(annotpages, x, page, rotation)
                        logging.error(f"Next annot")
                except Exception as e:
                    logging.error(f"annotations_array error {e}")
    except Exception as e:
        print(f"Error processing pages {start_page} to {end_page}: {e}")
    batch_end_time = time.time()
    return batch_end_time - batch_start_time

def insert_annotation(data, pdf_path, batch_size=20):
    try:
        total_start_time = time.time()
        doc = fitz.open(sourcePath + pdf_path)
        total_pages = len(doc)
        # No new_doc creation; work directly on doc
        max_workers = max(1, int(os.cpu_count()/2))
        cumulative_time = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {}
            for start_page in range(0, total_pages, batch_size):
                end_page = min(start_page + batch_size, total_pages)
                future = executor.submit(add_footer_polygon, doc, start_page, end_page, data)
                futures[future] = (start_page, end_page)
            for future in concurrent.futures.as_completed(futures):
                batch_time = future.result()
                start_page, end_page = futures[future]
                cumulative_time += batch_time
                print(f"Processed pages {start_page} to {end_page} in {batch_time:.2f} seconds. Cumulative time: {cumulative_time:.2f} seconds.")
        total_end_time = time.time()
        total_time = total_end_time - total_start_time
        doc.save(outputPath + file_name)
        doc.close()
        logging.warning(f"Total wall-clock time: {total_time:.2f} seconds")
    except FileNotFoundError:
        error = json.dumps({"code":-1,"err":f"The file '{pdf_path}' does not exist."})
        logging.error(f"The file '{pdf_path}' does not exist.")
        sys.stderr.write(f"{error}")
    except Exception as e:
        doc = fitz.open(sourcePath+pdf_path)
        doc.save(outputPath + file_name)
        doc.close()
        logging.error(f"unknown error {e}")
        error = json.dumps({"code":-2,"err":f"{e}"})
        sys.stderr.write(f"{error}")

def download_pdf_to_disk(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path, bPagination):
    try:
        print(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path)
        logging.info(f"Start downloading {file_key}, Pagination={bPagination}")
        os.makedirs(os.path.dirname(download_path), exist_ok=True)
        s3 = boto3.client(
            's3',
            region_name='sgp1',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(signature_version='s3v4')
        )
        version_id = None
        if bPagination:
            versions_response = s3.list_object_versions(Bucket=bucket_name, Prefix=file_key)
            versions = versions_response.get('Versions', [])
            if not versions:
                logging.error(f"No versions found for {file_key} in bucket {bucket_name}")
                print(f"No versions found for {file_key}")
                return
            sorted_versions = sorted(versions, key=lambda v: v['LastModified'])
            version_id = sorted_versions[0]['VersionId']
            logging.info(f"Downloading oldest version: VersionId={version_id}, LastModified={sorted_versions[0]['LastModified']}")
        with open(download_path, 'wb') as f:
            if version_id:
                s3.download_fileobj(Bucket=bucket_name, Key=file_key, Fileobj=f, ExtraArgs={'VersionId': version_id})
            else:
                s3.download_fileobj(Bucket=bucket_name, Key=file_key, Fileobj=f)
        logging.info(f"Successfully downloaded '{file_key}' to '{download_path}'")
        print(f"Successfully downloaded '{file_key}' to '{download_path}' (VersionId: {version_id or 'LATEST'})")
    except NoCredentialsError:
        logging.error("No AWS credentials provided.")
        print("Error: No AWS credentials provided.")
    except PartialCredentialsError:
        logging.error("Incomplete AWS credentials provided.")
        print("Error: Incomplete AWS credentials provided.")
    except ClientError as e:
        logging.error(f"AWS ClientError: {e}")
        print(f"Error: {e}")
    except FileNotFoundError as e:
        logging.error(f"File not found: {e}")
        print(f"Error: {e}")
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        print(f"An unexpected error occurred: {e}")

# --- Main Execution ---

sourcePath = f'{os.getenv("ROOT_PATH")}assets/'
outputPath = f'{os.getenv("ROOT_PATH")}assets/export/'

footer_text = ""
font_size = 24
pg_position ='TL'
margin_v = 0
margin_h = 0
text_color=(1.0, 0.49411764705882355, 0.38823529411764707,1.0)
background_color = hex_to_rgba('#ffffff')
border_color = hex_to_rgba('#ffffff')
startPg = 1

fact_img, doc_img, web_img, factq_img = (
    f'{os.getenv("ROOT_PATH")}assets/icon/linksicon/fact.png',
    f'{os.getenv("ROOT_PATH")}assets/icon/linksicon/doc.png',
    f'{os.getenv("ROOT_PATH")}assets/icon/linksicon/web.png',
    f'{os.getenv("ROOT_PATH")}assets/icon/linksicon/qfact.png'
)

jsonData_str = sys.argv[1]
data = json.loads(jsonData_str)
logging.warning(f'Annotation data {data}')
file_name = ''

bucket_name = os.getenv('DO_SPACES_BUCKET_NAME')
access_key = os.getenv('DO_SPACES_KEY')
secret_key = os.getenv('DO_SPACES_SECRET')
endpoint_url = os.getenv('DO_SPACES_ENDPOINT')

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
download_path = (f'{os.getenv("ROOT_PATH")}assets/{data["cPath"]}')
logging.info(f'download file {bucket_name}, {data["cPath"]}, {access_key}, {secret_key}, {endpoint_url}, {download_path}')
download_pdf_to_disk(bucket_name, data["cPath"], access_key, secret_key, endpoint_url, download_path, data['bPagination'])

logpath = f'{os.getenv("ROOT_PATH")}logs/{lgfile}/export/'
if not os.path.exists(logpath):
    try:
        os.makedirs(logpath)
        logging.info(f"Directory created: {logpath}")
    except Exception as e:
        logging.error(f"An error occurred while creating the log directory: {e}")

logging.basicConfig(
    filename=f'{os.getenv("ROOT_PATH")}logs/{lgfile}/export/{str(data["nEDid"])}.log',
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s]: %(message)s'
)

if "cPath" in data and len(data["cPath"]) > 0:
    try:
        file_name = 'new_pdf.pdf'
        outputPath = outputPath + 'ed' + str(data["nEDid"]) + '/'
        if not os.path.exists(outputPath):
            try:
                os.makedirs(outputPath)
                logging.info(f"Directory created: {outputPath}")
            except Exception as e:
                logging.error(f"An error occurred while copying the file: {e}")
    except Exception as e:
        logging.error(f"{e}")
        error = json.dumps({"code":-2,"err":f"{e}"})
        sys.stderr.write(f"{error}")
    insert_annotation(data, data["cPath"])
elif not os.path.isfile(outputPath + data["cPath"]):
    shutil.copy(outputPath + data["cPath"], sourcePath + data["cPath"])
else:
    logging.warning(f"Pagination not done parameters not proper")
    error = json.dumps({"code":-1,"err":'Pagination not done parameters not proper'})
    sys.stdout.write(error)
