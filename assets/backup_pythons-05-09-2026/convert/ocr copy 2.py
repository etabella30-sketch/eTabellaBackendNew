# pip install ocrmypdf
# pip install tesseract


import ocrmypdf
from datetime import datetime
import os
import subprocess
import re  # Import regex module


def ocrmy_pdf(input_pdf,output_pdf,sharp_image):

    # Record the start time
    start_time = datetime.now()
    print(f"Start time: {start_time}",input_pdf)


    os.environ['TMPDIR'] = '/tmp/ocr/'

    
    os.environ['TMPDIR'] = 'D:/temp'
    # Perform OCR
    ocrmypdf.ocr(input_pdf, output_pdf, language='eng', force_ocr=True, optimize=1,jbig2_lossy=False,sharp_image=sharp_image) 

    # Record the end time
    end_time = datetime.now()
    print(f"End time: {end_time}")

    # Calculate and print the duration
    duration = end_time - start_time
    print(f"Duration: {duration}")
    
    
    

def run_ocr(input_pdf, output_pdf, sharp_image):
    # Construct the OCR command with verbosity
    command = [
        'ocrmypdf', 
        '--force-ocr', 
        '--verbose',  # Increase verbosity to capture more details
        '--optimize', '1', 
        '--jbig2-lossy', 'no', 
        '--output-type', 'pdf',
        '--tesseract-timeout', '0',  # Ensure it doesn't timeout
        f'--tesseract-config', f'--dpi 300 --psm 1',  # Example of additional config
        '--sharp_image', sharp_image,
        input_pdf, 
        output_pdf
    ]
    
    #  ocrmypdf.ocr(input_pdf, output_pdf, language='eng', force_ocr=True, optimize=1,jbig2_lossy=False,sharp_image=sharp_image) 

    
    # Run the command and capture output
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    progress_pattern = re.compile(r'\d+%')
    while True:
        output = process.stderr.readline()
        if output == '' and process.poll() is not None:
            break
        if progress_pattern.search(output):
            sys.stdout.write(output)
            sys.stdout.flush()



if __name__ == "__main__":
    import sys
    if len(sys.argv) != 4:
        print("Usage: python ocrmypdf.py <input_file> <output_file>")
    else:
        ocrmy_pdf(sys.argv[1], sys.argv[2], sys.argv[3])