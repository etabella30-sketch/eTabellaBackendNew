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

def merge_rects(rect1, rect2):
    """Merge two rectangles into one that encompasses both"""
    return fitz.Rect(
        min(rect1.x0, rect2.x0),
        min(rect1.y0, rect2.y0),
        max(rect1.x1, rect2.x1),
        max(rect1.y1, rect2.y1)
    )

def process_page(document, page_num, search_terms):
    print(f"Processing page {page_num + 1}")
    results = []
    page = document.load_page(page_num)
    words = page.get_text("words")
    
    # Pre-process search terms into a set for O(1) lookup
    search_terms_set = set(search_terms)
    found_terms = set()
    
    # Create word information with optimized data structure
    word_info = [(word[4], fitz.Rect(word[0], word[1], word[2], word[3])) for word in words]
    
    # First pass: Check for exact matches
    for word, rect in word_info:
        if word in search_terms_set and word not in found_terms:
            results.append(create_result(page_num, word, rect))
            found_terms.add(word)
            
    # Second pass: Check for split terms (only for unfound terms)
    remaining_terms = search_terms_set - found_terms
    if remaining_terms:
        # Create a lookup for starting characters to reduce unnecessary checks
        term_starts = {term[0] for term in remaining_terms}
        
        # Process words in chunks for split terms
        chunk_size = 5  # Adjust based on typical term length
        for i in range(len(word_info)):
            word, rect = word_info[i]
            
            # Skip if first character doesn't match any term starts
            if not word or word[0] not in term_starts:
                continue
                
            current_term = word
            current_rect = rect
            
            # Look ahead up to chunk_size words
            for j in range(1, min(chunk_size, len(word_info) - i)):
                next_word, next_rect = word_info[i + j]
                current_term += next_word.replace(" ", "")
                
                # Check if the combined term is in our search set
                if current_term in remaining_terms:
                    current_rect = merge_rects(current_rect, next_rect)
                    results.append(create_result(page_num, current_term, current_rect))
                    found_terms.add(current_term)
                    break
                
                # Early termination if term is too long
                if len(current_term) > max(len(term) for term in remaining_terms):
                    break

    return results


def search_and_associate_terms(pdf_path, search_terms, max_workers=4):
    document = fitz.open(pdf_path)
    total_pages = len(document)
    filtered_search_terms = [term.strip() for term in search_terms if term.strip()]
    
    print(f"Processing PDF with {total_pages} pages")
    # print(f"Search terms: {filtered_search_terms}")

    all_results = []
    # with ThreadPoolExecutor(max_workers=max_workers) as executor:
    #     all_results = process_page(document, 2055, filtered_search_terms)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_page, document, page_num, filtered_search_terms) 
                  for page_num in range(total_pages)]
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
