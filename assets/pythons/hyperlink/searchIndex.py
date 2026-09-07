import fitz  # PyMuPDF
import sys
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import boto3
from botocore.client import Config
import os

# Function to download a file from S3-compatible storage directly to disk
def download_pdf_to_disk(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path):
    s3 = boto3.client('s3',
                      region_name='sgp1',
                      endpoint_url=endpoint_url,
                      aws_access_key_id=access_key,
                      aws_secret_access_key=secret_key,
                      config=Config(signature_version='s3v4'))
    print('DOWNLOAD =>', bucket_name, file_key)
    with open(download_path, 'wb') as f:
        s3.download_fileobj(bucket_name, file_key, f)
    print(f"Successfully downloaded '{file_key}' to '{download_path}'.")

def create_result(page_num, term, rect, associated_prefix=None):
    return {
        "page": page_num + 1,
        "term": term,
        "x0": rect.x0,
        "y0": rect.y0,
        "x1": rect.x1,
        "y1": rect.y1,
        "pref": associated_prefix if associated_prefix else "None"
    }

def process_page(document, page_num, compiled_pattern):
    results = []
    page = document.load_page(page_num)
    words = page.get_text("words")  # Extract words and their bounding boxes

    for word_info in words:
        # Unpack the word information
        x0, y0, x1, y1, word, block_number, line_number, word_number = word_info
        rect = fitz.Rect(x0, y0, x1, y1)  # Create a rectangle for the word

        if compiled_pattern.search(word):
            matched_term = word
            results.append(create_result(page_num, matched_term, rect))

    return results

def search_and_associate_terms(pdf_path, search_terms, max_workers=10):
    document = fitz.open(pdf_path)
    total_pages = len(document)

    # Filter out empty or whitespace-only search terms
    filtered_search_terms = [term.strip() for term in search_terms if term.strip()]

    # Construct the regex pattern
    regex_pattern = r'\b(?:ALPHA\$\-)?(' + '|'.join(re.escape(term) for term in filtered_search_terms) + r')(?:-\d+)?\b(?![-\w])'
    compiled_pattern = re.compile(regex_pattern)

    all_results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_page, document, page_num, compiled_pattern) for page_num in range(total_pages)]
        for future in futures:
            actual_res = future.result()
            all_results.extend(actual_res)

    return all_results

def read_search_terms(file_path):
    with open(file_path, 'r') as file:
        return [line.strip() for line in file if line.strip()]

if __name__ == "__main__":
    file_key = sys.argv[1]
    search_terms_file = sys.argv[2]
    
    bucket_name = sys.argv[5]
    access_key = sys.argv[6]
    secret_key = sys.argv[7]
    endpoint_url = sys.argv[8]
    download_path = sys.argv[9]  # Temporary download location
    
    print('SEARCH =>', bucket_name, file_key)

    
    try:

        # Step 1: Download the PDF from the S3 bucket
        download_pdf_to_disk(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path)

        # Step 2: Read search terms
        search_terms = read_search_terms(search_terms_file)

        # Step 3: Perform the search and print results
        search_results = search_and_associate_terms(download_path, search_terms)

        for result in search_results:
            print(f"PAGENO: {result['page']}, Term: {result['term']}, x: {result['x0']}, y: {result['y0']}, x1: {result['x1']}, y1: {result['y1']}, pref: {result['pref']} ,TOEND")

    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        # Step 5: Clean up: Remove the downloaded file
        if os.path.exists(download_path):
            os.remove(download_path)
