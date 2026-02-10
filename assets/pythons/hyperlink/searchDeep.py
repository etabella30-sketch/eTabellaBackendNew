import fitz  # PyMuPDF
import re
import csv
import sys
import boto3
from botocore.client import Config
import psycopg2
import os
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

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

def read_search_terms(file_path):
    try:
        with open(file_path, 'r') as file:
            # return [line.strip() for line in file if line.strip()]        
            # Clean terms to remove 'Â' (U+00C2) and non-breaking space (U+00A0) artifacts
            terms = [line.strip().replace('\u00C2', '').replace('\u00A0', ' ') for line in file if line.strip()]
            # Ensure we strip again after replacement just in case
            terms = [t.strip() for t in terms if t.strip()]

        # Separate terms into exact matches and pattern matches
        exact_terms = [term for term in terms if "-" not in term]
        pattern_terms = [term for term in terms if "-" in term]
        
        # Precompile regex patterns for pattern terms
        # pattern_compiled = [
        #     re.compile(rf'\b{re.escape(term.split('-')[0])}[-\n]*{re.escape(term.split('-')[1])}\b', re.IGNORECASE)
        #     for term in pattern_terms
        # ]

        # Precompile regex patterns for flexible patterns and exact terms with varied structures
        pattern_compiled = []

        for term in pattern_terms:
            parts = term.split('-')
            
            # Option 1: Pattern with optional hyphens or spaces
            flexible_pattern = {'pattern' : re.compile(rf'\b{re.escape(term)}\b', re.IGNORECASE),'term':term}
            
            # # Option 2: Pattern split by hyphens, allowing optional line breaks between parts
            if len(parts) > 1 and len(parts) == 2:
                # split_hyphen_pattern = {'pattern' : re.compile(rf'\b{re.escape(parts[0])}[-\n]*{re.escape(parts[1])}\b', re.IGNORECASE) ,'term':term}
                # Updated to allow spaces (\s) and unicode dashes (en-dash \u2013, em-dash \u2014)
                split_hyphen_pattern = {'pattern' : re.compile(rf'\b{re.escape(parts[0])}[\s\-\u2013\u2014\n]*{re.escape(parts[1])}\b', re.IGNORECASE) ,'term':term}
            else:
                split_hyphen_pattern = flexible_pattern  # Fallback to flexible pattern if splitting is unnecessary
            
        # Add both patterns to the compiled patterns list
            pattern_compiled.append(flexible_pattern)
            pattern_compiled.append(split_hyphen_pattern)
        
        print(f"DEBUG: Exact Terms ({len(exact_terms)}): {exact_terms}")
        print(f"DEBUG: Pattern Terms ({len(pattern_terms)}): {pattern_terms}")

        return exact_terms, pattern_compiled
    except Exception as e:
        sys.exit(f"Failed to read search terms: {e}")


def search_page_for_terms(page_num, page, exact_terms, pattern_compiled):
    
    """Search for exact and pattern terms on a given page."""
    results = []
    unique_rects = set()
    
    try:
        for term in exact_terms:
            rects = page.search_for(term)
            for rect in rects:
                rect_tuple = (rect.x0, rect.y0, rect.x1, rect.y1)
                if rect_tuple not in unique_rects:
                    unique_rects.add(rect_tuple)
                    results.append({"page": page_num + 1, "term": term, "x0": rect.x0, "y0": rect.y0, "x1": rect.x1, "y1": rect.y1})
        
        # Use regex pattern matches for complex terms
        text = page.get_text()
        for pattern in pattern_compiled:
            matches = list(pattern["pattern"].finditer(text))
            for match in matches:
                term = pattern["term"]           
                if "-" in term:
                    replace_term = term.replace("-", "")
                    rects = page.search_for(replace_term)
                    pretext = ''
                    prerect = {}

                    for rect in rects:
                        rect_tuple = (rect.x0, rect.y0, rect.x1, rect.y1)
                        if rect_tuple not in unique_rects:
                            unique_rects.add(rect_tuple)
                            word_in_rect = page.get_text("text", clip=rect).strip()
                            
                            if word_in_rect != replace_term and pretext + '-' + word_in_rect == term:
                                results.append(prerect)
                                prerect = {}
                                pretext = ''
                                results.append({
                                    "page": page_num + 1,
                                    "term": term,
                                    "x0": rect.x0,
                                    "y0": rect.y0,
                                    "x1": rect.x1,
                                    "y1": rect.y1
                                })
                            else:
                                pretext = word_in_rect
                                prerect = {
                                    "page": page_num + 1,
                                    "term": term,
                                    "x0": rect.x0,
                                    "y0": rect.y0,
                                    "x1": rect.x1,
                                    "y1": rect.y1
                                }

                    # Process other patterns normally
                # print(f'term {term} matches {match}')
                rects = page.search_for(term)
                for rect in rects:
                    rect_tuple = (rect.x0, rect.y0, rect.x1, rect.y1)    
                    if rect_tuple not in unique_rects: 
                        unique_rects.add(rect_tuple)
                        results.append({"page": page_num + 1, "term": term, "x0": rect.x0, "y0": rect.y0, "x1": rect.x1, "y1": rect.y1})

    except Exception as e:
        print(f"Error on page {page_num + 1}: {e}")
    return results
def search_terms_in_pdf(pdf_path, exact_terms, pattern_compiled):
    try:
        print(f"Opening PDF file: {pdf_path}")
        document = fitz.open(pdf_path)
    except Exception as e:
        print(f"Failed to open PDF: {e}")
        sys.exit(f"Failed to open PDF: {e}")

    all_results = []
    start_time = datetime.now()
    with ThreadPoolExecutor() as executor:
        futures = {executor.submit(search_page_for_terms, page_num, document[page_num], exact_terms, pattern_compiled): page_num for page_num in range(len(document))}
        
        for future in as_completed(futures):
            try:
                page_results = future.result()
                all_results.extend(page_results)
                page_num = futures[future]
            except Exception as e:
                print(f"Error processing page {page_num + 1}: {e}")
    
    return all_results

def save_to_csv(results, output_file):
    with open(output_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        for result in results:
            writer.writerow([
                result['page'],
                result['term'],
                result['x0'],
                result['y0'],
                result['x1'],
                result['y1'],
                sys.argv[4]
            ])

def insert_csv_to_postgres(csv_file, conn_params, nBundledetailid):
    try:
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        print(f"Connected to the PostgreSQL database: {conn_params['dbname']}")
        
        # Step 1: Delete existing records for the given nBundledetailid
        delete_query = 'DELETE FROM pdf_data WHERE "nBundledetailid" = %s;'
        cursor.execute(delete_query, (nBundledetailid,))
        print(f"Deleted records with nBundledetailid = {nBundledetailid}")

        # Step 2: Insert new CSV data
        print(f"Inserting data from {csv_file} into the PostgreSQL table...")
        with open(csv_file, 'r') as f:
            # Uncomment the following line only if you have a header row in your CSV
            # next(f)  # Skip header row if exists
            copy_query = """
                COPY pdf_data (page, extracted_text, x0, y0, x1, y1, "nBundledetailid")
                FROM STDIN
                WITH (FORMAT csv)
            """
            cursor.copy_expert(copy_query, f)
        
        conn.commit()
        print(f"Successfully inserted data from {csv_file} into the PostgreSQL table.")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error inserting data into PostgreSQL: {e}")

if __name__ == "__main__":
    file_key = sys.argv[1]
    search_terms_file = sys.argv[2]
    output_csv = sys.argv[3]
    
    # S3-related arguments
    bucket_name = sys.argv[5]
    access_key = sys.argv[6]
    secret_key = sys.argv[7]
    endpoint_url = sys.argv[8]
    download_path = sys.argv[9]  # Temporary download location

    # PostgreSQL connection parameters
    conn_params = {
        'dbname': os.getenv('DB_DATABASE'),
        'user': os.getenv('DB_USERNAME'),
        'password': os.getenv('DB_PASSWORD'),
        'host': os.getenv('DB_HOST'),
        'port': int(os.getenv('DB_PORT'))  # Default port to 5432 if not set
    }

    nBundledetailid = sys.argv[4]  # Get nBundledetailid from command-line argument

    try:
        # Step 1: Download the PDF from the S3 bucket
        download_pdf_to_disk(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path)

        # Step 2: Read search terms
        # search_terms = read_search_terms(search_terms_file)        
        exact_terms, pattern_compiled = read_search_terms(search_terms_file)

        # Step 3: Perform the search and write results to CSV
        # search_results = search_terms_in_pdf(download_path, search_terms)        
        search_results = search_terms_in_pdf(download_path, exact_terms, pattern_compiled)
        print('output_csv',output_csv)
        save_to_csv(search_results, output_csv)

        print(f"Searched for {len(exact_terms)} terms.")
        print(f"Found {len(search_results)} unique results. Saved to {output_csv}")

        # Step 4: Insert CSV data into PostgreSQL (after deleting old records)
        insert_csv_to_postgres(output_csv, conn_params, nBundledetailid)

        # Optionally, print results to console as well
        for result in search_results:
            print(f"[{result['page']},{result['term']},{result['x0']},{result['y0']},{result['x1']},{result['y1']}]")
            
    except Exception as e:
        print(f"Error: {e}")

    finally:
        # Step 5: Clean up: Remove the downloaded file
        if os.path.exists(download_path):
            os.remove(download_path)
