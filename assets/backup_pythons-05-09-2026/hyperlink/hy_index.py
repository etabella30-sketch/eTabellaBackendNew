import fitz  # PyMuPDF
import sys
import re
import os
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# Validate command-line arguments
if len(sys.argv) < 5:
    print("Usage: python script.py <pdf_path> <search_terms_file> <nBundledetailid> <nHid>")
    sys.exit(1)

# Extract command-line arguments
pdf_path = sys.argv[1]  # Local PDF file path
search_terms_file = sys.argv[2]  # Path to search terms file
nBundledetailid = sys.argv[3]  # Bundle detail ID
nHid = sys.argv[4]  # Hyperlink ID

# Generate dynamic log file path with current date
current_date = datetime.now().strftime("%Y-%m-%d")
log_directory = f"logs/{current_date}/{sys.argv[5]}" #sys.argv[5] #f"logs/{current_date}/hyperlink/{nHid}/{nBundledetailid}"
log_filename = "combined.log"
log_file_path = os.path.join(log_directory, log_filename)

# Ensure log directory exists
os.makedirs(log_directory, exist_ok=True)

# Configure logging
log_format = "%(asctime)s [%(levelname)s]: %(message)s"
logging.basicConfig(
    filename=log_file_path,
    level=logging.INFO,
    format=log_format,
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Also log to console
# console_handler = logging.StreamHandler()
# console_handler.setFormatter(logging.Formatter(log_format, datefmt="%Y-%m-%d %H:%M:%S"))
# logging.getLogger().addHandler(console_handler)

logging.info(f"Logging initialized. Log file: {log_file_path}")

def create_result(page_num, term, rect, associated_prefix=None):
    """Create a dictionary result for a found term."""
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
    try:
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

    except Exception as e:
        logging.error(f"Error processing page {page_num + 1}: {e}")
    return results


def search_and_associate_terms(pdf_path, search_terms, max_workers=4):
    try:
        document = fitz.open(pdf_path)
        total_pages = len(document)
    except Exception as e:
        logging.error(f"Failed to open PDF: {e}")
        sys.exit(f"Failed to open PDF: {e}")

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
            try:
                actual_res = future.result()
                all_results.extend(actual_res)
            except Exception as e:
                logging.error(f"Error processing a page: {e}")

    logging.info(f"Found {len(all_results)} matches in the PDF.")
    return all_results

def read_search_terms(file_path):
    """Read and preprocess search terms from a file."""
    try:
        with open(file_path, 'r') as file:
            terms = [line.strip() for line in file if line.strip()]
        logging.info(f"Loaded {len(terms)} search terms from {file_path}")
        return terms
    except Exception as e:
        logging.error(f"Failed to read search terms: {e}")
        sys.exit(f"Failed to read search terms: {e}")

if __name__ == "__main__":
    logging.info(f"Processing PDF: {pdf_path}")

    try:
        # Step 1: Read search terms
        search_terms = read_search_terms(search_terms_file)

        # Step 2: Perform the search
        search_results = search_and_associate_terms(pdf_path, search_terms)

        # Step 3: Print search results in required format
        for result in search_results:
            print(f"PAGENO: {result['page']}, Term: {result['term']}, x: {result['x0']}, y: {result['y0']}, x1: {result['x1']}, y1: {result['y1']}, pref: {result['pref']} ,TOEND")

        logging.info(f"Completed processing. Found {len(search_results)} matches.")

    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        sys.exit(1)
