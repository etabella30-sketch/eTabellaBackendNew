# pip install ocrmypdf
# pip install tesseract


import ocrmypdf
from datetime import datetime
import os
import subprocess
import re  # Import regex module

from datetime import datetime, timedelta
import logging


def get_date():
    
    # Get the current time with the desired timezone
    date = datetime.now()
    
    # Extract date components
    year = date.year
    month = date.month
    day = date.day

    return f"{year:04d}-{month:02d}-{day:02d}"





def ocrmy_pdf(input_pdf,output_pdf,sharp_image):

    # Record the start time
    start_time = datetime.now()
    # print(f"Start time: {start_time}",input_pdf)
    
    logging.info(f"Start time: {start_time} {input_pdf}")


    # os.environ['TMPDIR'] = '/tmp/ocr/'

    
    # os.environ['TMPDIR'] = f'${os.getenv('TMP_PATH')}' #'D:/temp'
    # Perform OCR
    try:
        logging.info(f"{input_pdf} {output_pdf } language='eng',fast_web_view=999999, force_ocr=True, optimize=1,jbig2_lossy=False,sharp_image=int({sharp_image}),progress_bar=True,skip_text=False, deskew=True")
        ocrmypdf.ocr(input_pdf, output_pdf, language='eng',fast_web_view=999999, force_ocr=True, optimize=1,jbig2_lossy=False,sharp_image=int(sharp_image),progress_bar=True,skip_text=False, deskew=True)         
        sys.stdout.flush()
    except ocrmypdf.exceptions.OCRmyPDFError as e:        
        # logging.info(f"OCRmyPDFError: {e} {input_pdf}")
        print(f"OCRmyPDFError: {e}")
    except Exception as e:
        # logging.info(f"An error occurred: {e} {input_pdf}")
        print(f"An error occurred: {e}")
    # Record the end time
    end_time = datetime.now()
    logging.info(f"End time: {end_time} {input_pdf}")
    # print(f"End time: {end_time}")

    # Calculate and print the duration
    duration = end_time - start_time
    # print(f"Duration: {duration}")
    
    
    

if __name__ == "__main__":  
    lgfile = get_date()
    import sys
    if len(sys.argv) != 5:
        logging.error(f"Usage: python ocrmypdf.py <input_file> <output_file> <sharp_image> <log_file>")        
        print("Usage: python ocrmypdf.py <input_file> <output_file>")
    else:
        if(sys.argv[4] and sys.argv[4] !=''):
            # Ensure the log directory exists          
            log_dir = f'{os.getenv('ROOT_PATH')}logs/{lgfile}/'
            log_dir = f'{log_dir}/{sys.argv[4]}'
            # print(f"log_dir: {log_dir}")
            os.makedirs(log_dir, exist_ok=True)
            logging.basicConfig(
                filename=f'{log_file}{sys.argv[4]}/ocr.log',  # Specify the log file name
                level=logging.INFO,   # Set the logging level (e.g., INFO, WARNING, ERROR)
                format='%(asctime)s [%(levelname)s]: %(message)s'  # Define log message format
            )
        

        ocrmy_pdf(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])