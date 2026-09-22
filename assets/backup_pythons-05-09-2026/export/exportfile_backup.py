
import fitz  # Import the fitz library
import math
import sys
import json
import logging
from datetime import datetime, timedelta
import time
import concurrent.futures
import os
import shutil
import boto3
from botocore.client import Config

def get_date():
    
    # Get the current time with the desired timezone
    date = datetime.now()
    
    # Extract date components
    year = date.year
    month = date.month
    day = date.day

    return f"{year:04d}-{month:02d}-{day:02d}"

lgfile = get_date()
logging.basicConfig(
    filename=f'{os.getenv('ROOT_PATH')}logs/export/{lgfile}.log',  # Specify the log file name
    level=logging.INFO,   # Set the logging level (e.g., INFO, WARNING, ERROR)
    format='%(asctime)s [%(levelname)s]: %(message)s'  # Define log message format
)


def hex_to_rgba(hex_color):
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16) / 255.0
    g = int(hex_color[2:4], 16) / 255.0
    b = int(hex_color[4:6], 16) / 255.0
    return (r, g, b)


def rotate_rect(rect, angle, center):
    # Calculate the coordinates of the four corners of the rectangle
    x1, y1, x2, y2 = rect.x0, rect.y0, rect.x1, rect.y1

    # Translate to the origin
    x1 -= center[0]
    y1 -= center[1]
    x2 -= center[0]
    y2 -= center[1]

    # Rotate the coordinates
    x1_rotated = x1 * math.cos(math.radians(angle)) - y1 * math.sin(math.radians(angle))
    y1_rotated = x1 * math.sin(math.radians(angle)) + y1 * math.cos(math.radians(angle))
    x2_rotated = x2 * math.cos(math.radians(angle)) - y2 * math.sin(math.radians(angle))
    y2_rotated = x2 * math.sin(math.radians(angle)) + y2 * math.cos(math.radians(angle))

    # Translate back to the original position
    x1_rotated += center[0]
    y1_rotated += center[1]
    x2_rotated += center[0]
    y2_rotated += center[1]

    # Create a new rotated rectangle
    rotated_rect = fitz.Rect(min(x1_rotated, x2_rotated), min(y1_rotated, y2_rotated), max(x1_rotated, x2_rotated), max(y1_rotated, y2_rotated))

    return rotated_rect


def get_rect(page, text_width, text_height, font_size):
    margin = 5
    rect_height = text_height + 2 * margin
    rect_width = text_width + 2 * margin
    x0 = page.rect.width - rect_width - margin
    y0 = page.rect.height - rect_height - margin
    x1 = x0 + rect_width
    y1 = y0 + rect_height
    return fitz.Rect(x0, y0, x1, y1)

def get_text_dimensions(text, font_size):
    text_width = fitz.get_text_length(text, fontsize=font_size)
    text_height = font_size
    return text_width, text_height


def get_max_min_value(array,colm1, colm):
    try:
        result = {
            'frm': 0,
            'to': 0,
        }
        
        if not array:
            return result

        for item in array:
            if colm in item:
                
                # logging.error(f"get_max_m zvfsdf zsdfgin_value : { min(result['frm'] , float(item["Y"]))}")   
                result['frm'] = min(result['frm'] , item[colm1])
                result['to'] = max(result['to'] , item[colm])
        # if array:
        #     hhg = array[0]['height']
        #     # Sort the array by the specified column in ascending order and update 'frm'
        #     array_sorted_ascending = sorted(array, key=lambda x: x[colm])
        #     result['frm'] = array_sorted_ascending[0][colm]
            
        #     # Sort the array by the specified column in descending order and update 'to'
        #     # Since sorting is stable in Python, we can simply reverse the previously sorted list
        #     array_sorted_descending = sorted(array, key=lambda x: x[colm], reverse=True)
        #     result['to'] = array_sorted_descending[0][colm] + hhg
        result['frm'] =  float(result['frm']) + float(array[0]["y"])
        result['to'] =  float(result['to']) + float(array[0]["height"])
        logging.error(f"get_max_min_value : {result}")    
        return result
    except Exception as e:        
        logging.error(f"get_max_min_value error : {e}")
        return 0



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
        """Check if the rectangle intersects with any existing icons."""
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

def hex_to_rgb(hex_color):
    """Convert a hex color string to an RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def draw_image(annotpages, page, type, maxmin, pgwidth, pageNo):
    
    try:
        startX = pgwidth - extraWidth
        startY = maxmin['frm'] - 20
        endX = pgwidth - extraWidth
        endY = maxmin['to']  - 20

        # Drawing line
        color = hex_to_rgb('#000000')
        logging.error(f"{[startX, startY], [endX, endY]} drow line")
        page.draw_line([startX, startY], [endX, endY], color=color, width=1)

        # Determining image dimensions
        obj = {
            'x': endX - 25,
            'y': endY - 15,
            'width': 11 if type == 'D' else 12,
            'height': 12 if type in ['F', 'W'] else 14,
        }

        inds = next((i for i, a in enumerate(annotpages) if a['pg'] == pageNo), -1)
        if inds > -1:
            # Modify obj based on some conditions, possibly adjusting position
            obj = check_position(annotpages, inds, obj)  # You'll need to define this function
            annotpages[inds]['icons'].append(obj)

        # Selecting the image based on type and drawing it
        img_path = fact_img if type == 'F' else doc_img if type == 'D' else web_img
    # Correctly drawing an image on the page
        img_path = fact_img if type == 'F' else doc_img if type == 'D' else web_img
        
        logging.error(f"{obj['x'], obj['y'], obj['x'] + obj['width'], obj['y'] + obj['height']} image inserting {type}")
        page.insert_image(fitz.Rect(obj['x'], obj['y'], (obj['x'] + obj['width']), obj['y'] + obj['height']), filename=img_path)


    except FileNotFoundError:
        logging.error(f"drawing annot{error}")
# Example usage would require defining the mdl, page, type, maxmin, pgwidth, pageNo, extraWidth,
# fact_img, doc_img, and web_img variables appropriately.


# footer_text, font_size

def drow_ract(annotpages,x,page,rotation):
     if x["rects"] and len(x["rects"]):
        # logging.error(f"Step 3.1.2")
        for ls in x["rects"]:
            pghight = page.mediabox[3]
            pgwidth = page.mediabox[2]
            y_pth = (pghight - ls["y"]) - ls["height"]
            ls["original_y"] = y_pth

            # startX = ls["x"]
            # startY = (ls["y"]) - 80
            # endX = ls["x"] + ls["width"]
            # endY = (ls["y"] + ls["height"]) - 80
            
            
            startX = ls['x']
            startY = ls['y']  # Adjust y-coordinate
            endX = ls["x"] + ls["width"]
            endY = (ls["y"] + ls["height"])
            
                
            # logging.error(f"{startX, startY, endX, endY}")
            # logging.error(f"Step 3.1.3  - page-height = {pghight}")
            # x0,y0 = (margin/2) + margin_h,page.rect.height - height-(margin/2) - margin_v
            poly_rect =  fitz.Rect(startX, startY, endX, endY)

        
            poly_center = ((poly_rect.x0 + poly_rect.x1) / 2, (poly_rect.y0 + poly_rect.y1) / 2)    
            poly_rotated_rect = rotate_rect(poly_rect, rotation, poly_center)       
           
            border_color = hex_to_rgba(x["color"])
            
            # logging.error(f"drow ract {startX, startY, endX, endY}")
            page.draw_rect(poly_rotated_rect, color=border_color, width=2, fill=border_color, stroke_opacity=0.5, fill_opacity=0.5, overlay=True)
            # annot.update(opacity=0.5)
            # logging.warning(f"annotation {x}, {pghight}")
        maxmin = get_max_min_value(x["rects"], 'original_y', 'y')
        draw_image(annotpages, page, 'F', maxmin, pgwidth, x["page"])

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


def add_footer_polygon(new_doc, start_page, end_page, data):
    # Open the PDF

    # Define the font
        font_name = "helv"
        font = fitz.Font(font_name)  # Create a font object

        batch_start_time = time.time()  # Start time for the batch
        annotpages = []
        logging.warning(f"batch {start_page},{end_page}")
        for page_number in range(start_page, end_page):
            # logging.error(f"Step 1 - {page_number}")
            
            # Get the current page
            page = new_doc[page_number]       
            page.wrap_contents()
            rotation = page.rotation
            
            annotations_array = []  # This will store the items
        
            # logging.warning(f"page_number {page_number}")
            for item in data['highlights']:
                # logging.warning(f"Step 2, {page_number+1}, {item["page"]},'{item}'")
                if(item["page"] == (page_number+1)):
                    # logging.error(f"Step 2.1")
                    annotations_array.append(item)
                  
             # Create a rectangle defining where to place the original page content in the new page
        
        # Copy the content of the original page onto the new page, shifted to the right
            
            for x in annotations_array:
                try:
                    logging.error(f"annotations_array Step 3.1 {x}")
                    if x:
                        # if x["type"] == 'drawing':
                        #     logging.error(f"drawing Step 3.1.1 {x}")
                        #     draw_drawing(annotpages,x,page,rotation)
                    
                        if x["linktype"] == 'FQ' or x["linktype"] == 'F':
                            drow_ract(annotpages,x,page,rotation)
                        elif x["linktype"] == 'D':
                            draw_doclink(annotpages,x,page,rotation)
                        elif x["linktype"] == 'W':
                            draw_weblink(annotpages,x,page,rotation)
                        logging.error(f"Next annot")
                        
                        # if x["type"] == 'highlight':
                        #     drow_ract(annotpages,x,page,rotation)
                        # elif x["type"] == 'strikeout1':
                        #     draw_doclink(annotpages,x,page,rotation)
                        # elif x["type"] == 'strikeout':
                        #     draw_weblink(annotpages,x,page,rotation)                 
                except Exception as e:   
                    logging.error(f"annotations_array error {e}")

        batch_end_time = time.time()  # End time for the batch
        return batch_end_time - batch_start_time  # Return the time taken for this batch
    
        
def insert_annotation(data,pdf_path, batch_size=20):
    try:
                     
        total_start_time = time.time()
        doc = fitz.open(sourcePath+pdf_path)
        total_pages = len(doc)
        new_doc = fitz.open()

        for page in doc:
            original_width = page.rect.width
            original_height = page.rect.height

            new_width = original_width + extraWidth

            # Create a new page with the updated width and original height
            new_page = new_doc.new_page(width=new_width, height=original_height)

            # Calculate the shift amount to the right for placing the original page content
            shift_amount = extraWidth

            # Create a rectangle defining where to place the original page content in the new page
            target_rect = fitz.Rect(0, 0, new_width-shift_amount, original_height)
            
            # Place the original page content onto the new page, shifted by extra_width
            new_page.show_pdf_page(target_rect, doc, page.number)
            
            max_workers = os.cpu_count()/2
        # print(max_workers)
        cumulative_time = 0  # Initialize cumulative time for "work done"
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {}
            for start_page in range(0, total_pages, batch_size):
                end_page = min(start_page + batch_size, total_pages)
                future = executor.submit(add_footer_polygon, new_doc, start_page, end_page, data)
                futures[future] = (start_page, end_page)

            for future in concurrent.futures.as_completed(futures):
                batch_time = future.result()
                start_page, end_page = futures[future]
                cumulative_time += batch_time  # Increment cumulative time
                print(f"Processed pages {start_page} to {end_page} in {batch_time:.2f} seconds. Cumulative time: {cumulative_time:.2f} seconds.")

        total_end_time = time.time()  # Wall-clock time for the entire process
        total_time = total_end_time - total_start_time
        
        
        
        
        # doc.save(outputPath + file_name)
      
        
        new_doc.save(outputPath + file_name)
        new_doc.close()
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


def download_pdf_to_disk(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path):
    try:
        print(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path)
        logging.info(f'Start downloaded {file_key}')

        # Ensure the directory exists
        os.makedirs(os.path.dirname(download_path), exist_ok=True)
        s3 = boto3.client('s3',
                        region_name='sgp1',
                        endpoint_url=endpoint_url,
                        aws_access_key_id=access_key,
                        aws_secret_access_key=secret_key,
                        config=Config(signature_version='s3v4'))

        with open(download_path, 'wb') as f:
            s3.download_fileobj(bucket_name, file_key, f)
        logging.info(f'Successfully downloaded {file_key}')
        print(f"Successfully downloaded '{file_key}' to '{download_path}'.")

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

sourcePath = f'{os.getenv('ROOT_PATH')}assets/'
outputPath = f'{os.getenv('ROOT_PATH')}assets/export/'

footer_text = ""  # Your footer text
font_size = 24
pg_position ='TL'
margin_v = 0
margin_h = 0
text_color=(1.0, 0.49411764705882355, 0.38823529411764707,1.0)
background_color = hex_to_rgba('#ffffff')   
border_color = hex_to_rgba('#ffffff')
startPg = 1
extraWidth = 50

fact_img, doc_img, web_img = f'{os.getenv('ROOT_PATH')}assets/icon/linksicon/fact.png',f'{os.getenv('ROOT_PATH')}assets/icon/linksicon/doc.png',f'{os.getenv('ROOT_PATH')}assets/icon/linksicon/web.png'

jsonData_str = sys.argv[1]
data = json.loads(jsonData_str)
logging.warning(f'Annotation data {data}')
file_name = ''


bucket_name = os.getenv('DO_SPACES_BUCKET_NAME') # "etabella"
access_key = os.getenv('DO_SPACES_KEY') # "DO00GNUKK4DR8GDPAFMU"  # Your access key
secret_key = os.getenv('DO_SPACES_SECRET') # "RSKAW8Qpe6JWptaLbQNHK4wH2bRS7VtCzM+KSlSQKso"  # Your secret key
endpoint_url = os.getenv('DO_SPACES_ENDPOINT') # "https://sgp1.digitaloceanspaces.com"


timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
download_path = (f'{os.getenv('ROOT_PATH')}assets/{data["cPath"]}')  # Path to download PDF
# data["cPath"]  = 'doc/case1043/file_1390456215703.PDF'
logging.info(f'download file {bucket_name}, {data["cPath"]}, {access_key}, {secret_key}, {endpoint_url}, {download_path}')
download_pdf_to_disk(bucket_name, data["cPath"], access_key, secret_key, endpoint_url, download_path)

# logging.info(f'Start pagination {data["cPath"]}  {data["cRefpage"]}')
# for data in jsonData:   
if "cPath" in data and len(data["cPath"]) > 0 :
    try:
        file_name = 'new_pdf.pdf' #os.path.basename(data["cPath"])
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
    insert_annotation(data , data["cPath"])    
elif not os.path.isfile(outputPath + data["cPath"]):
    shutil.copy(outputPath + data["cPath"],sourcePath + data["cPath"])     
else:    
    logging.warning(f"Pagination not done parameters not proper")
    error = json.dumps({"code":-1,"err":'Pagination not done parameters not proper'})
    sys.stdout.write(error)
