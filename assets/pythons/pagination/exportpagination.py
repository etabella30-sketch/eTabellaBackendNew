
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
    filename=f'{os.getenv('ROOT_PATH')}logs/pagination/{lgfile}.log',  # Specify the log file name
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




def add_footer_polygon(doc, start_page, end_page, font_size):
    # Open the PDF

    # Define the font
        font_name = "helv"
        font = fitz.Font(font_name)  # Create a font object

        batch_start_time = time.time()  # Start time for the batch

        for page_number in range(start_page, end_page):
            # Get the current page
            page = doc[page_number]       
            page.wrap_contents()
            rotation = page.rotation
            # print(page_number)
            margin = font_size/2  # Margin around the text
            text = f"{page_number + int(startPg)}"
            
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

        
            
            # if page_number==0:
            #     print(x0,y0,'\n',page.rect.width,page.rect.height,'\n',width,height,margin,'\n',rect)

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
            # if page_number==0:
            #     print(page.rect.width,page.rect.height,width,height,'\n',rect,'\n',rotated_rect,'\n',poly_rotated_rect)


            # polygon_annot = page.add_polygon_annot(points)      
            # polygon_annot.set_colors(stroke=background_color)             
            # # polygon_annot.set_border(width=font_size/4)   
            # # polygon_annot.set_border(fitz.Annotation.BORDER_NONE)        
            # polygon_annot.update()


            annot = page.draw_rect(poly_rotated_rect, color=border_color, fill=background_color, overlay=True)  # 'Square'
            # annot.set_border(width=1)
            # annot.set_colors(stroke=border_color, fill=background_color)
            # annot.update(opacity=0.5)
            # print_descr(annot)
            # url = "https://www.example.com"
            # page.insert_link({
            #         "from": poly_rotated_rect,
            #         "name": "Roshan",
            #         "kind": fitz.LINK_URI
            #     })


            insert_txt = page.insert_textbox(rotated_rect, text, fontname=font_name, fontsize=font_size, align=fitz.TEXT_ALIGN_CENTER,rotate=rotation,color=text_color)

            
        batch_end_time = time.time()  # End time for the batch
        return batch_end_time - batch_start_time  # Return the time taken for this batch
    #     document.save(outputPath + pdf_path)
        
    #     logging.info(f"Pagination done {data["cPath"]}")
    #     success = json.dumps({"code":1,"err":'Pagination done'})
    #     sys.stdout.write(success)    
    
    # except FileNotFoundError:
    #     error = json.dumps({"code":-1,"err":f"The file '{pdf_path}' does not exist."})
    #     logging.error(f"The file '{pdf_path}' does not exist.")
    #     sys.stderr.write(f"{error}")
    # except Exception as e:
    #     logging.error(f"{e}")
    #     error = json.dumps({"code":-2,"err":f"{e}"})
    #     sys.stderr.write(f"{error}")
        
    
def insert_footer_parallel(pdf_path,new_path, font_size=10, batch_size=20):
    try:
       
        if not os.path.isfile(sourcePath + pdf_path):
            directory_path = os.path.dirname(pdf_path)
            if not os.path.exists(sourcePath + directory_path):                
                try:
                    os.makedirs(sourcePath + directory_path)                    
                    logging.info(f"Directory created: {sourcePath + directory_path}")
                except Exception as e:
                    logging.error(f"An error occurred while copying the file: {e}")
        # If the file does not exist, copy it from the source
            try:
                shutil.copy(outputPath + pdf_path, sourcePath + pdf_path)
                logging.info(f"File copied: {outputPath + pdf_path} to {sourcePath + pdf_path}")
            except Exception as e:
                logging.error(f"An error occurred while copying the file: {e}")


        total_start_time = time.time()
        doc = fitz.open(sourcePath+pdf_path)
        total_pages = len(doc)


        max_workers = os.cpu_count()/2
        # print(max_workers)
        cumulative_time = 0  # Initialize cumulative time for "work done"

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {}
            for start_page in range(0, total_pages, batch_size):
                end_page = min(start_page + batch_size, total_pages)
                future = executor.submit(add_footer_polygon, doc, start_page, end_page, font_size)
                futures[future] = (start_page, end_page)

            for future in concurrent.futures.as_completed(futures):
                batch_time = future.result()
                start_page, end_page = futures[future]
                cumulative_time += batch_time  # Increment cumulative time
                # print(f"Processed pages {start_page} to {end_page} in {batch_time:.2f} seconds. Cumulative time: {cumulative_time:.2f} seconds.")

        total_end_time = time.time()  # Wall-clock time for the entire process
        total_time = total_end_time - total_start_time
        doc.save(outputPath + new_path)
        # print(f"Total wall-clock time: {total_time:.2f} seconds")
    
    except FileNotFoundError:
        error = json.dumps({"code":-1,"err":f"The file '{pdf_path}' does not exist."})
        logging.error(f"The file '{pdf_path}' does not exist.")
        sys.stderr.write(f"{error}")
    except Exception as e:
        logging.error(f"{e}")
        error = json.dumps({"code":-2,"err":f"{e}"})
        sys.stderr.write(f"{error}")
        

# Usage
# pdf_path = "3.pdf"  # Your PDF file

# jsonData = [
#     { "cTab": "A1-5", "cPath": "case17/input1.pdf", "cRefpage": "1-32", "jPagination": { "bc": "#fff", "fc": "#000", "fs": "12", "ft": "Arial", "isHide": False, "position": "BR" } },
#     { "cTab": "A1-5", "cPath": "case17/input2.pdf", "cRefpage": "1-3", "jPagination": { "bc": "#fff", "fc": "#000", "fs": "16", "ft": "Arial", "isHide": False, "position": "BR" } },
#     { "cTab": "A1-5", "cPath": "case17/input3.pdf", "cRefpage": "1-23", "jPagination": { "bc": "#fff", "fc": "#000", "fs": "12", "ft": "Arial", "isHide": False, "position": "BR" } },
#     { "cTab": "A1-5", "cPath": "case17/input4.pdf", "cRefpage": "1-261", "jPagination": { "bc": "#fff", "fc": "#000", "fs": "16", "ft": "Arial", "isHide": False, "position": "BR" } },
#     { "cTab": "A1-5", "cPath": "case17/input5.pdf", "cRefpage": "1-424", "jPagination": { "bc": "#fff", "fc": "#000", "fs": "16", "ft": "Arial", "isHide": False, "position": "BR" } },
#     { "cTab": "A1-5", "cPath": "case17/input6.pdf", "cRefpage": "1-7", "jPagination": { "bc": "#fff", "fc": "#000", "fs": "16", "ft": "Arial", "isHide": False, "position": "BR" } },
#     { "cTab": "A1-5", "cPath": "case17/input7.pdf", "cRefpage": "1-45", "jPagination": { "bc": "#fff", "fc": "#000", "fs": "16", "ft": "Arial", "isHide": False, "position": "BR" } },
#     { "cTab": "A1-5", "cPath": "case17/input8.pdf", "cRefpage": "1-8", "jPagination": { "bc": "#fff", "fc": "#000", "fs": "16", "ft": "Arial", "isHide": False, "position": "BR" } }
# ]

# sourcePath = 'D://paginationfiles/'
sourcePath = os.getenv('ASSETS') # '/usr/src/app/assets/'
outputPath = os.getenv('ASSETS') # '/usr/src/app/assets/'

font_size = 24
pg_position ='TL'
margin_v = 0
margin_h = 0
text_color=(1.0, 0.49411764705882355, 0.38823529411764707,1.0)
background_color = hex_to_rgba('#ffffff')   
border_color = hex_to_rgba('#ffffff')


# logging.debug('This is a debug message')
# logging.warning('This is a warning message')
# logging.error('This is an error message')
# logging.critical('This is a critical message')

jsonData_str = sys.argv[1]
data = json.loads(jsonData_str)
# for data in jsonData:   
if "cRefpage" in data  and data["cRefpage"] and len(data["cRefpage"]) > 0:
    
    logging.info(f'data match  {data["cRefpage"]}')
    jPagination = data["jPagination"]
    font_size = int(jPagination["fs"])
    pg_position =jPagination["position"]
    margin_v = 0
    margin_h = 25
    if "fc" in jPagination and jPagination["fc"]!='' and len(jPagination["fc"]) > 6:        
        text_color= hex_to_rgba(jPagination["fc"])    
        # print(text_color)    
    if "bc" in jPagination  and jPagination["bc"]!='' and len(jPagination["bc"]) > 6:
         background_color = hex_to_rgba(jPagination["bc"])        
    if "cb" in jPagination and jPagination["cb"]!='' and len(jPagination["cb"]) > 6:
        border_color = hex_to_rgba(jPagination["cb"])        
    startPg = int(data["cRefpage"].split('-')[0])
    print(startPg)
    # Your desired font size
    logging.info(f'Start pagination {data["cPath"]}  {data["cRefpage"]} - {startPg}')
    insert_footer_parallel(data["cPath"],data["cNewpath"], font_size)    
elif os.path.isfile(outputPath + data["cPath"]):
    shutil.copy(sourcePath + data["cPath"],outputPath + data["cPath"])     
else:    
    logging.warning(f"Pagination not done parameters not proper")
    error = json.dumps({"code":-1,"err":'Pagination not done parameters not proper'})
    sys.stdout.write(error)
