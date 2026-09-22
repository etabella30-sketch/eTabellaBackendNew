import ocrmypdf
from datetime import datetime
import os


def ocrmy_pdf(input_pdf,output_pdf,sharp_image):

    # Record the start time
    start_time = datetime.now()
    print(f"Start time: {start_time}",input_pdf)


    os.environ['TMPDIR'] = 'D:/temp'
    # Perform OCR
    ocrmypdf.ocr(input_pdf, output_pdf, language='eng', force_ocr=True, optimize=1,jbig2_lossy=False,sharp_image=sharp_image) 

    # Record the end time
    end_time = datetime.now()
    print(f"End time: {end_time}")

    # Calculate and print the duration
    duration = end_time - start_time
    print(f"Duration: {duration}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 4:
        print("Usage: python ocrmypdf.py <input_file> <output_file>")
    else:
        ocrmy_pdf(sys.argv[1], sys.argv[2], sys.argv[3])