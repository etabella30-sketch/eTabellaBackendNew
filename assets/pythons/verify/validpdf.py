import fitz  # PyMuPDF
import os
import sys
import threading  # Import threading for background execution

def analyze_pdf(file_path, is_get_file_size):
    results = {
        'is_corrupted': True,  # Default to True, change to False if PDF opens successfully
        'total_pages': 0,
        'file_size': 0,
        'validviewport': 0  # Default to 0, change if any page has rotation
    
    }

    try:
        # Get file size
        if is_get_file_size == 'true':
            results['file_size'] = os.path.getsize(file_path)

        # Open the PDF file
        doc = fitz.open(file_path)

        # Get total number of pages
        results['total_pages'] = len(doc)
        
        # if results['total_pages'] > 0:
        #     results['validviewport'] = page.rotation
            
        for page in doc:
            if page.rotation != 0:  # Check if the rotation of any page is not 0
                results['validviewport'] = page.rotation
                break


        # If pages are successfully retrieved, mark the PDF as not corrupted
        if results['total_pages'] > 0:
            results['is_corrupted'] = False
        else:
            print(f"Error reading PDF: Page Count 0")
    except Exception as e:
        print(f"Error reading PDF: {e}")
    finally:
        doc.close()  # Make sure to close the document

    return results

def save_first_page_as_image(file_path, output_path):
    try:
        doc = fitz.open(file_path)
        page = doc[0]  # first page
        pix = page.get_pixmap()
        pix.save(output_path)
        return True
    except Exception as e:
        print(f"Error rendering page: {e}")
        return False
    finally:
        doc.close()


def async_save_first_page_as_image(file_path, output_path):
    # This function is a wrapper for the save_first_page_as_image function
    # It will start the save_first_page_as_image function in a new thread
    thread = threading.Thread(target=save_first_page_as_image, args=(file_path, output_path))
    thread.start()  # This will start the thread and the function will run in the background


# Replace 'your_pdf_file.pdf' with the path to your PDF file
file_path = sys.argv[1]  # Example: 'sample.pdf'
# output_image_path =  sys.argv[2]  # "first_page_image.png"
isGetfilesize = sys.argv[2] # previous it was 3 now 2
results = analyze_pdf(file_path, isGetfilesize)

if results['is_corrupted']:
    print("The PDF is corrupted.")
else:
    # save_first_page_as_image(file_path, output_image_path)
    # if save_first_page_as_image(file_path, output_image_path):
        # print("First page saved as image successfully.")
    # else:
    #     print("Failed to save the first page as image.")
    print(f"The PDF is not corrupted.")
    print(f" TotalPages: {results['total_pages']}")
    print(f" FileSize: {results['file_size']} KB")
    print(f" PDFRotation: {results['validviewport']} ")
    # if output_image_path != '':
    #     async_save_first_page_as_image(file_path, output_image_path)  # This will now run in the background
