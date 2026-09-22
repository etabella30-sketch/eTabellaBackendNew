
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
import gc
from pydo import Client

def get_date():
    
    # Get the current time with the desired timezone
    date = datetime.now()
    
    # Extract date components
    year = date.year
    month = date.month
    day = date.day

    return f"{year:04d}-{month:02d}-{day:02d}"

lgfile = get_date()

log_dir = f'{os.getenv('ROOT_PATH')}logs/{get_date()}/'
lgfile = get_date()

log_file = os.path.join(log_dir, f'{lgfile}.log')



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




def remove_old_pagination(page, old_prefix, old_prefix_start, page_number):
    """
    Removes old pagination more carefully to prevent PDF deterioration.
    Uses a white rectangle overlay instead of redaction which can be less destructive.
    
    Args:
        page: The PDF page object
        old_prefix: The prefix of the old page number
        old_prefix_start: Starting number for old pagination
        page_number: Current page number being processed
    """
    if not old_prefix or not old_prefix_start or int(old_prefix_start) <= 0:
        return

    old_start = page_number + int(old_prefix_start)
    search_text = f"{old_prefix}-{old_start}"
    
    # Find all instances of the old page number
    text_instances = page.search_for(search_text)
    
    if text_instances:
        for inst in text_instances:
            # Add some padding to the rectangle
            padding = 2
            rect = fitz.Rect(
                inst.x0 - padding,
                inst.y0 - padding,
                inst.x1 + padding,
                inst.y1 + padding
            )
            
            # Instead of redaction, use a white rectangle overlay
            # This is less destructive to the PDF structure
            page.draw_rect(
                rect,
                color=(1, 1, 1),  # White color
                fill=(1, 1, 1),   # White fill
                overlay=True      # Place on top
            )
            
            
def to_excel_suffix(n: int) -> str:
    # Convert a 1-based index to an Excel-style suffix:
    # 1 -> 'A', 26 -> 'Z', 27 -> 'AA', etc.
    s = ""
    while n > 0:
        n -= 1  # zero-base for modulo
        s = chr(65 + (n % 26)) + s
        n //= 26
    return s
def suffix_to_number(s: str) -> int:
    # Convert an Excel-style suffix to a 1-based index:
    # 'A' -> 1, 'Z' -> 26, 'AA' -> 27, etc.
    num = 0
    for ch in s.upper():
        num = num * 26 + (ord(ch) - 64)
    return num


def add_footer_polygon(doc, start_page, end_page, footer_text,old_prefix,old_prefix_start, font_size):
    # Open the PDF

    # Define the font
        font_name = "helv"
        font = fitz.Font(font_name)  # Create a font object

        batch_start_time = time.time()  # Start time for the batch        
        for page_number in range(start_page, end_page):
            # Get the current page
            # page = doc[page_number]   
            # if old_prefix !='' and old_prefix_start and int(old_prefix_start) > 0:
            #     old_start = page_number + int(old_prefix_start)
                
            #     # sys.stderr.write(f"Step 3 {old_prefix}-{old_start} \n")
            #     text_instances = page.search_for(f"{old_prefix}-{old_start}")
            #     if text_instances:
            #         # print(f"Redacting old pagination '{old_prefix}-{old_start}' from page {old_start}...")
            #         for inst in text_instances:
            #             # Redact old pagination
            #             page.add_redact_annot(inst, fill=(1, 1, 1))
            #             page.apply_redactions()  
            page = doc[page_number]
        
            # Remove old pagination more carefully
            # remove_old_pagination(page, old_prefix, old_prefix_start, page_number)
            
            # Only wrap contents if necessary
            if page.is_wrapped:
                page.wrap_contents()  
            rotation = page.rotation
            margin = font_size/2  # Margin around the text
            if not bIslater:
                text = f"{footer_text}-{page_number + int(startPg)}"
            else:    
                print(f'step 1 ${prefix} {page_number}')
                startIndex = suffix_to_number(startPg)
                print(f'step 1 {prefix} {page_number}')
                newIndex = startIndex + page_number
                print(f'step 1 ${prefix} {startIndex} {newIndex}')
                text = to_excel_suffix(newIndex)
                text = f'{footer_text}-{prefix}{text}'
                print(f'step 1 {text}')
            # text = f"{footer_text}-{page_number + int(startPg)}"
            
            text_dimensions = get_text_dimensions(text, font_size)
            # text_width = font.text_length(text, font_size)  # Width of the text
            # text_height = font_size  # Height of the text            
            text_width, text_height = text_dimensions  # Use precomputed dimensions
            # text_width = text_width + margin
            width, height = text_width + 2 * margin, text_height + 2 * margin
            # width, height = text_width + text_height, text_height + text_height

            x0,y0 = (margin/2) + margin_h,page.rect.height - height-(margin/2) - margin_v
            rect = fitz.Rect(x0 + (margin/2), y0, x0 + width + (margin/2), y0 + height)
            poly_rect = fitz.Rect(x0 + (margin/2), y0 + height - (margin - margin/3), x0 + width + (margin/2), y0 -(margin - margin/3))      

            if pg_position =='BL':
                if rotation == 90:
                    x0,y0 = page.rect.height - (width/2 + height) + (margin + margin_v),page.rect.width -(width/2 + height ) + (margin + margin_h) 
                    rect = fitz.Rect(x0 , y0 , x0 + width , y0 + height)
                    poly_rect = fitz.Rect(x0 -(margin - margin/3), y0, x0 + width -(margin - margin/3), y0 + height)
                if rotation == 180:
                    x0,y0 = page.rect.width -  width - (margin + margin_h),margin +  margin_v
                    rect = fitz.Rect(x0 , y0 - (margin/3), x0 + width , y0 + height - (margin - margin/3) )
                    poly_rect = fitz.Rect(x0 , y0 + height, x0 + width , y0)
                if rotation == 270:
                    x0,y0 = - width/2 + height - (margin -margin_v),(width/2) -(margin - margin_h)
                    rect = fitz.Rect(x0 - (margin - margin/3), y0, x0 + width - (margin - margin/3), y0 + height )
                    poly_rect = fitz.Rect(x0, y0 + height, x0 + width , y0)
                
            if pg_position =='BR':
                x0,y0 = page.rect.width -(width) - (margin + margin_h),page.rect.height - height - (margin + margin_v)
                rect = fitz.Rect(x0 , y0 + (margin/2), x0 + width , y0 + height + (margin/2))
                poly_rect = fitz.Rect(x0 , y0 + height , x0 + width, y0)
            
                if rotation == 90:
                    x0,y0 =page.rect.height-(width/2 + height) + (margin - margin_v),width/2 - (margin - margin_h)
                    rect = fitz.Rect(x0 +(margin - margin/2), y0 , x0 + width +(margin - margin/3), y0 + height)
                    poly_rect = fitz.Rect(x0, y0 + height, x0 + width, y0)
                if rotation == 180:                
                    x0,y0 = margin + margin_h,margin + margin_v
                    rect = fitz.Rect(x0   , y0 - (margin - margin/3), x0 + width , y0 + height- (margin - margin/3))
                    poly_rect = fitz.Rect(x0 , y0 + height , x0 + width , y0 )           
                if rotation == 270:
                    x0,y0 = - width/2 + height/2 + (margin + margin_v),page.rect.width - ((width/2 + height )) + (margin - margin_h)
                    rect = fitz.Rect(x0 -(margin - margin/3), y0 , x0 + width - (margin - margin/3), y0 + height)
                    poly_rect = fitz.Rect(x0, y0 + height, x0 + width , y0)

            if pg_position =='TR':
                x0,y0 = page.rect.width - width  - (margin) - margin_h, (margin) + margin_v
                rect = fitz.Rect(x0 , y0 + (margin/2), x0 + width , y0 + height + (margin/2))
                poly_rect = fitz.Rect(x0 , y0 + height , x0 + width, y0 )
                            
                if rotation == 90:
                    x0,y0 = - width/2 + height - (margin - margin_v),width/2 - (margin - margin_h)
                    rect = fitz.Rect(x0 + (margin/2), y0, x0 + width + (margin/2), y0 + height )
                    poly_rect = fitz.Rect(x0, y0 + height, x0 + width , y0)
                if rotation == 180:
                    x0,y0 = margin  + margin_h,page.rect.height - (height) - (margin + margin_v)
                    rect = fitz.Rect(x0 , y0 - (margin - margin/3), x0 + width , y0 + height - (margin - margin/3))
                    poly_rect = fitz.Rect(x0 , y0 + height, x0 + width , y0 )
                    
                if rotation == 270:
                    x0,y0 = page.rect.height -(width/2+height) + (margin - margin_v) ,page.rect.width -(width/2+height) + (margin -margin_h)
                    rect = fitz.Rect(x0 -(margin - margin/3), y0, x0 + width -(margin - margin/3), y0 + height)
                    poly_rect = fitz.Rect(x0, y0 + height, x0 + width , y0)

            if pg_position =='TL':
                x0,y0 = (margin) + margin_h, (margin) + margin_v
                
                rect = fitz.Rect( x0, y0 + (margin/2) , x0 + width , y0 + height +(margin/2) )
                poly_rect = fitz.Rect( x0 , y0 , x0 + width , y0 + height  )
                
                if rotation == 90:
                    x0,y0 =  -(width/2 - height) - (margin - margin_v), page.rect.width - (width/2 + height ) + (margin - margin_h)
                    rect = fitz.Rect(x0 + (margin - margin/3), y0 , x0 + width + (margin - margin/3), y0 + height)
                    poly_rect = fitz.Rect(x0 , y0 + height , x0 + width , y0)
                if rotation == 180:
                    x0,y0 = page.rect.width -(width+margin) - margin_h,page.rect.height - (height+margin) - margin_v
                    rect = fitz.Rect(x0 , y0 - (margin - margin/3), x0 + width , y0 + height - (margin - margin/3))
                    poly_rect = fitz.Rect(x0 , y0 + height, x0 + width , y0 )
                    
                if rotation == 270:
                    x0,y0 = page.rect.height -(width/2 + height) + (margin- margin_v),(width/2) - (margin -  margin_h)
                    rect = fitz.Rect(x0 -(margin - margin/3), y0 , x0 + width -(margin - margin/3), y0 + height)
                    poly_rect = fitz.Rect(x0, y0 + height , x0 + width , y0 )

            center = ((rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2)
            poly_center = ((poly_rect.x0 + poly_rect.x1) / 2, (poly_rect.y0 + poly_rect.y1) / 2)
            rotated_rect = rotate_rect(rect, rotation, center)        
            poly_rotated_rect = rotate_rect(poly_rect, rotation, poly_center)       
            points = [
                fitz.Point(poly_rotated_rect[0], poly_rotated_rect[1]), 
                fitz.Point(poly_rotated_rect[2], poly_rotated_rect[1]),
                fitz.Point(poly_rotated_rect[2],poly_rotated_rect[3]), 
                fitz.Point(poly_rotated_rect[0], poly_rotated_rect[3])
            ]
            annot = page.draw_rect(poly_rotated_rect, color=border_color, fill=background_color, overlay=True)  # 'Square'

            insert_txt = page.insert_textbox(rotated_rect, text, fontname=font_name, fontsize=font_size, align=fitz.TEXT_ALIGN_CENTER,rotate=rotation,color=text_color)

            
        batch_end_time = time.time()  # End time for the batch
        return batch_end_time - batch_start_time  # Return the time taken for this batch

    
def insert_footer_parallel(pdf_path, footer_text,old_prefix,old_prefix_start, font_size=10, batch_size=10):
    try:
        
        dir_name = os.path.dirname(pdf_path)
        base_name = os.path.basename(pdf_path)
        file_name, file_ext = os.path.splitext(base_name)
        total_start_time = time.time()  
        doc = fitz.open(pdf_path)
        total_pages = len(doc)


        max_workers = os.cpu_count()/2
        cumulative_time = 0  # Initialize cumulative time for "work done"

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {}
            for start_page in range(0, total_pages, batch_size):
                end_page = min(start_page + batch_size, total_pages)
                future = executor.submit(add_footer_polygon, doc, start_page, end_page, footer_text,old_prefix,old_prefix_start, font_size)
                futures[future] = (start_page, end_page)

            for future in concurrent.futures.as_completed(futures):
                batch_time = future.result()
                start_page, end_page = futures[future]
                cumulative_time += batch_time  # Increment cumulative time

        total_end_time = time.time()  # Wall-clock time for the entire process
        total_time = total_end_time - total_start_time
        if old_prefix and old_prefix !='':
            logging.info(f"PDF Save with clear gurbage.")
            doc.save(output_path,  garbage=4,deflate=True)
            doc.close()
        else:
            logging.info(f"PDF Save without clear gurbage.")
            doc.save(output_path, deflate=True)
            doc.close()
        
    except FileNotFoundError:
        error = json.dumps({"code":-1,"err":f"The file '{pdf_path}' does not exist."})
        logging.error(f"The file '{pdf_path}' does not exist.")
        sys.stderr.write(f"{error}")
    except Exception as e:
        logging.error(f"{e}")
        error = json.dumps({"code":-2,"err":f"{e}"})
        sys.stderr.write(f"{error}")
        
footer_text = ""  # Your footer text
old_prefix = ""
old_prefix_start = ""
font_size = 24
pg_position ='TL'
margin_v = 0
margin_h = 0
text_color=(1.0, 0.49411764705882355, 0.38823529411764707,1.0)
background_color = hex_to_rgba('#ffffff')   
border_color = hex_to_rgba('#ffffff')

jsonData_str = sys.argv[1]
data = json.loads(jsonData_str)

download_path = (f'{data["input"]}')  # Path to download PDF
output_path = (f'{data["output"]}')   # Path for processed PDF

if sys.argv[2]:
    log_dir= f'{log_dir}{sys.argv[2]}/files'
    log_file = f'{log_dir}/{data["nID"]}.log' 

    # Ensure the log directory exists
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    filename=log_file,  # Specify the log file name
    level=logging.INFO,   # Set the logging level (e.g., INFO, WARNING, ERROR)
    format='%(asctime)s [%(levelname)s]: %(message)s'  # Define log message format
)

prefix =''
bIslater=False
# for data in jsonData:   
if "cRefpage" in data and "cTab" in data and data["cRefpage"] and len(data["cRefpage"]) > 0 and len(data["cTab"]) > 0:        
    jPagination = data["jPagination"]
    footer_text = data["cTab"]  # Your footer text
    # old_prefix = data["cPTab"]  # Your footer text
    # old_prefix_start = data["nPStart"]
    font_size = int(jPagination["fs"])
    pg_position =jPagination["position"]
    margin_v = 0
    margin_h = 25
    if "fc" in jPagination and jPagination["fc"]!='' and len(jPagination["fc"]) > 6:        
        text_color= hex_to_rgba(jPagination["fc"])    
    if "bc" in jPagination  and jPagination["bc"]!='' and len(jPagination["bc"]) > 6:
         background_color = hex_to_rgba(jPagination["bc"])        
    if "cb" in jPagination and jPagination["cb"]!='' and len(jPagination["cb"]) > 6:
        border_color = hex_to_rgba(jPagination["cb"])        
    if data.get('bislater', False) and data['bislater'] and data['bislater'] == True:  
        bIslater =data['bislater']      
        startPg = data['suffix']
        prefix = data['prefix']
    else:
        startPg = int(data["cRefpage"].split('-')[0])    
    logging.info(f'Pagination start {data["cPath"]}')
    insert_footer_parallel(download_path, footer_text,old_prefix,old_prefix_start, font_size)    
    logging.info(f'Pagination end {data["cPath"]}')
    output_file_key = data["cPath"]
else:    
    logging.warning(f"Pagination not done parameters not proper")
    error = json.dumps({"code":-1,"err":'Pagination not done parameters not proper'})
    sys.stdout.write(error)
