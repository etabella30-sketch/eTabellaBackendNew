import fitz  # PyMuPDF
import re
import concurrent.futures
import csv
import os
import sys
import math
import boto3
from botocore.client import Config
import psycopg2


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

def search_in_page(document, page_num, pattern):
    page = document.load_page(page_num)
    text = page.get_text("text")
    results = []
    rotation = page.rotation

    matches = pattern.finditer(text)
    for match in matches:
        matched_text = match.group(0)
        spans = page.search_for(matched_text)
        for span in spans:
            rect = fitz.Rect(span)
            center = ((rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2)
            if rotation != 0:
                rect = rotate_rect(rect, rotation, center)

            results.append({
                'page': page_num + 1,
                'Hword': re.sub(r'\s*\n\s*', '', match.group(1)),
                'x0': round(rect.x0, 2),
                'y0': round(rect.y0, 2),
                'x1': round(rect.x1, 2),
                'y1': round(rect.y1, 2),
                'pref': 'None'
            })

    return results

def rotate_rect(rect, angle, center):
    x1, y1, x2, y2 = rect.x0, rect.y0, rect.x1, rect.y1
    x1 -= center[0]
    y1 -= center[1]
    x2 -= center[0]
    y2 -= center[1]

    x1_rotated = x1 * math.cos(math.radians(angle)) - y1 * math.sin(math.radians(angle))
    y1_rotated = x1 * math.sin(math.radians(angle)) + y1 * math.cos(math.radians(angle))
    x2_rotated = x2 * math.cos(math.radians(angle)) - y2 * math.sin(math.radians(angle))
    y2_rotated = x2 * math.sin(math.radians(angle)) + y2 * math.cos(math.radians(angle))

    x1_rotated += center[0]
    y1_rotated += center[1]
    x2_rotated += center[0]
    y2_rotated += center[1]

    rotated_rect = fitz.Rect(min(x1_rotated, x2_rotated), min(y1_rotated, y2_rotated), max(x1_rotated, x2_rotated), max(y1_rotated, y2_rotated))

    return rotated_rect

def search_terms_in_batch(document, page_nums, pattern):
    batch_results = []
    for page_num in page_nums:
        batch_results.extend(search_in_page(document, page_num, pattern))
    return batch_results

def write_results_to_csv(results, output_file):
    with open(output_file, 'a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        for result in results:
            writer.writerow([result['page'], result['Hword'], result['x0'], result['y0'], result['x1'], result['y1'], sys.argv[2]])

def search_terms_in_pdf(pdf_path, output_file, batch_size=100):
    document = fitz.open(pdf_path)
    total_pages = len(document)
    pattern = re.compile(r'\{([^}]*)\}')

    with concurrent.futures.ThreadPoolExecutor() as executor:
        for i in range(0, total_pages, batch_size):
            batch_pages = range(i, min(i + batch_size, total_pages))
            future = executor.submit(search_terms_in_batch, document, batch_pages, pattern)
            batch_results = future.result()
            write_results_to_csv(batch_results, output_file)

    document.close()

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
    output_file = sys.argv[3]  # CSV output path

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


    nBundledetailid = sys.argv[2]  # Get nBundledetailid from command-line argument

    try: 
        # Step 1: Download the PDF from the S3 bucket
        download_pdf_to_disk(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path)

        # Step 2: Clear existing content in the output file before starting
        if os.path.exists(output_file):
            os.remove(output_file)

        # Step 3: Perform the search and write results to CSV
        search_terms_in_pdf(download_path, output_file)

        # Step 4: Insert CSV data into PostgreSQL (after deleting old records)
        insert_csv_to_postgres(output_file, conn_params, nBundledetailid)

    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        # Step 5: Clean up: Remove the downloaded file
        if os.path.exists(download_path):
            os.remove(download_path)