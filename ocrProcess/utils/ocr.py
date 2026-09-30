# pip install ocrmypdf
# pip install tesseract

import asyncio
import ocrmypdf
from datetime import datetime
import time
import os
import subprocess
import re  # Import regex module
import json  # Import regex module


from datetime import datetime, timedelta
import logging
import boto3
from botocore.client import Config
from utils.ocrprogress import handle_data
from services.pgConnection import execute_query, query_builder
from utils.Producerkafka import emit_message
from utils.delete_old_version import remove_old_versions

from dotenv import load_dotenv
import os

bucket_name = f"{os.getenv("DO_SPACES_BUCKET_NAME")}"
access_key = f"{os.getenv("DO_SPACES_KEY")}"  # Your access key
secret_key = f"{os.getenv("DO_SPACES_SECRET")}"   # Your secret key
endpoint_url = f"{os.getenv("DO_SPACES_ENDPOINT")}"

def get_date():    
    # Get the current time with the desired timezone
    date = datetime.now()    
    # Extract date components
    year = date.year
    month = date.month
    day = date.day
    return f"{year:04d}-{month:02d}-{day:02d}"
lgfile = get_date()




def download_pdf_to_disk(bucket_name, file_key, access_key, secret_key, endpoint_url, download_path):
    try:
        if os.path.exists(download_path):
            logging.info(f"File '{download_path}' already exists. Skipping download.")
            return
        # print(f'S3 params {bucket_name}, {file_key}, {access_key}, {secret_key}, {endpoint_url}, {download_path}')
        logging.info(f"Downloading file from S3: {file_key} to {download_path}")
        # print(f"Downloading file from S3: {file_key} to {download_path}")
        s3 = boto3.client('s3',
                        region_name='sgp1',
                        endpoint_url=endpoint_url,
                        aws_access_key_id=access_key,
                        aws_secret_access_key=secret_key,
                        config=Config(signature_version='s3v4'))

        with open(download_path, 'wb') as f:
            s3.download_fileobj(bucket_name, file_key, f)
        # logging.info(f'Successfully downloaded {data["cPath"]}')
        logging.info(f"Successfully downloaded '{file_key}' to '{download_path}'.")
        # print(f"Successfully downloaded '{file_key}' to '{download_path}'.")
    except Exception as e:                
        # print(f"Failed to download file: {file_key}. Error: {str(e)}")
        logging.error(f"Failed to download file: {file_key}. Error: {str(e)}", exc_info=True)
        raise

# Function to upload the processed PDF from disk back to S3
async def upload_pdf_from_disk_to_s3(bucket_name, file_key, access_key, secret_key, endpoint_url, file_path,id):
    try:        
        logging.info(f"Uploading file at S3: {file_key} to {file_path}")
        s3 = boto3.client('s3',
                        region_name='sgp1',
                        endpoint_url=endpoint_url,
                        aws_access_key_id=access_key,
                        aws_secret_access_key=secret_key,
                        config=Config(signature_version='s3v4'))

        with open(file_path, 'rb') as f:
            s3.upload_fileobj(f, bucket_name, file_key, ExtraArgs={
                'CacheControl': 'max-age=86400',  # Cache for 1 day (86400 seconds)
                'ContentType': 'application/pdf'  # Set the correct content type for PDF
            })

        lversion = remove_old_versions(file_key)
        await remove_old_versions_from_db(lversion,id)

        logging.info(f"Successfully uploaded '{file_key}' from '{file_path}'.")
    except Exception as e:
        logging.error(f"Failed to upload file: {file_key}. Error: {str(e)}", exc_info=True)
        raise

async def remove_old_versions_from_db(version_id: str,id) -> None:
    """Remove old versions from the database."""
    try:
        logging.info(f'Removing old versions from DB: {version_id}')
        
        query = query_builder('upload_update_fver', json.dumps({"nBundledetailid": id, "cFVer": version_id,"cLVer":version_id}))
        logging.info(f'Query : {query}')
        result = await execute_query(query)
        logging.info('Old versions removed from DB successfully!')
    except Exception as error:
        logging.error(f'Error removing old versions from DB: {str(error)}')
        raise

async def ocrmy_pdf(nMasterid,identifier,id,input_pdf,sharp_image,jobs,nUDid):
    # log_dir = f'logs/{lgfile}/{nMasterid}/{id}/'
    # os.makedirs(log_dir, exist_ok=True)
    # logging.basicConfig(
    #     filename=f'{log_dir}ocr.log',  # Specify the log file name
    #     level=logging.INFO,  # Set log level
    #     format='%(asctime)s [%(levelname)s]: %(message)s'  # Log message format
    # )

    query = query_builder('ocr_update', json.dumps({"nMasterid": nMasterid,"identifier":identifier,"nBundledetailid": id, "cStatus": "OCR","nUDid":nUDid}))
    logging.info(f'Query : {query}')
    # print(f'Query : {query}')    
    result = await execute_query(query)
    # print(f"Result: {result[0]}")

    download_path = f'{os.getenv("ASSETS")}/{input_pdf}'
    os.makedirs(os.path.dirname(download_path), exist_ok=True)
    start_time = datetime.now()
    output_pdf  =''
    try:
            
        download_pdf_to_disk(bucket_name,input_pdf, access_key, secret_key, endpoint_url, download_path)
        logging.info(f"Start time: {start_time} {download_path}")
        msgData = { 'event': 'OCR-START', 'data': { 'identifier':identifier,'id':id, 'nMasterid': nMasterid,'nUDid':nUDid } }
        # print(f'\n\n\n\n msgData - {msgData}\n\n\n\n')
        emit_message('upload-response','key1',msgData)
        

        # os.environ['TMPDIR'] = '/tmp/ocr/'

        # f'${os.getenv('TMP_PATH')}' #
        # os.environ['TMPDIR'] = 'D:/temp'
        # Perform OCR
        filename  = download_path.split('/')[-1]
        output_pdf = download_path.replace(filename, f'ocr_{filename}') # add ocr in start
        # try:
        logging.info(f"{download_path} {output_pdf } language='eng',fast_web_view=999999, force_ocr=True, optimize=1,jbig2_lossy=False,sharp_image=int({sharp_image}),progress_bar=True,skip_text=False, deskew=True")
    
        # await ocrmypdf.ocr(input_pdf, output_pdf, language='eng',fast_web_view=999999, force_ocr=True, optimize=1,jbig2_lossy=False,sharp_image=int(sharp_image),progress_bar=True,skip_text=False, deskew=True,jobs=jobs)         
        resulttype = ''
        if not os.path.exists(download_path):
            raise FileNotFoundError(f"Input file does not exist: {download_path}")
        process = await asyncio.create_subprocess_exec(
            'ocrmypdf',
            download_path,
            output_pdf,
            '--language', 'eng',
            '--fast-web-view', '1',
            '--force-ocr',  # Force OCR even if the PDF is Tagged
            '--optimize', '1',
            '--jbig2-lossy',
            '--sharp-image', '0',
            '--jobs', '2',
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
    # Capture stderr
    
        while True:
            stdout_line = await process.stderr.readline()
            if stdout_line:
                try:
                    stdout_data = stdout_line.decode('utf-8').strip()
                    # print(f"stdout: {stdout_data}")
                    # Emit progress updates
                    resulttype = handle_data(resulttype, stdout_data, identifier,id, nMasterid,nUDid, '')                    
                except Exception as e:                
                    logging.error(f"Subprocess error during OCR for {input_pdf}. Error: {str(e)}", exc_info=True)
            else:
                # print(f"Subprocess error during OCR for {download_path}.")    
                # print(f'\n\n\n\n Break \n\n\n\n\n')
                break

            # logging.info(f"Running command: ocrmypdf {input_pdf} {output_pdf} ...")


        # Process stdout and stderr in real-time
        while True:
            stdout_line = await process.stdout.readline()
            if stdout_line:
                try:
                    stdout_data = stdout_line.decode('utf-8').strip()
                    # print(f"stdout: {stdout_data}")
                    # Emit progress updates
                    resulttype = handle_data(resulttype, stdout_data, identifier,id, nMasterid,nUDid, '')                    
                except Exception as e:   
                    # print(f"Subprocess error during OCR for {download_path}. Error: {str(e)}")             
                    logging.error(f"Subprocess error during OCR for {download_path}. Error: {str(e)}", exc_info=True)
            else:
                # print(f'\n\n\n\n Break success \n\n\n\n\n')
                break
        try:
            await asyncio.wait_for(process.wait(), timeout=600)  # 10 min timeout
        except asyncio.TimeoutError:
            logging.error(f"OCR timeout: killing process for {input_pdf}")
        # process.kill()
        await process.wait()  # Wait for the subprocess to finish
        
        query = query_builder('ocr_update', json.dumps({"nMasterid": nMasterid,"identifier":identifier,"nBundledetailid": id, "cStatus": "C","nUDid":nUDid}))
        logging.info(f'Query : {query}')
        # print(f'Query : {query}')
        result = await execute_query(query)
        # print(f"Result: {result[0]}")
        
        if process.returncode != 0:
            raise Exception(f"OCR process failed with return code: {process.returncode}")

        logging.info(f"OCR process completed successfully for {download_path}")

        
    except FileNotFoundError as e:
        logging.error(f"File not found: {download_path}. Error: {str(e)}", exc_info=True)
        msgData = {'event': 'OCR-ERROR', 'data': {'identifier': identifier,'id':id, 'nMasterid': nMasterid,'nUDid':nUDid, 'error': str(e)}}
        emit_message('upload-response', 'key1', msgData)

    except subprocess.SubprocessError as e:
        logging.error(f"Subprocess error during OCR for {download_path}. Error: {str(e)}", exc_info=True)
        msgData = {'event': 'OCR-ERROR', 'data': {'identifier': identifier,'id':id, 'nMasterid': nMasterid,'nUDid':nUDid, 'error': str(e)}}
        emit_message('upload-response', 'key1', msgData)

    except Exception as e:
        logging.error(f"An unexpected error occurred during OCR for {download_path}. Error: {str(e)}", exc_info=True)
        msgData = {'event': 'OCR-ERROR', 'data': {'identifier': identifier,'id':id, 'nMasterid': nMasterid,'nUDid':nUDid, 'error': str(e)}}
        emit_message('upload-response', 'key1', msgData)

    finally:
        # Record end time
        end_time = datetime.now()
        duration = end_time - start_time
        logging.info(f"End OCR process for {download_path} at {end_time}. Duration: {duration}")
        # print(f"End OCR process for {input_pdf} at {end_time}. Duration: {duration}")
        # rename file at local
        if os.path.exists(output_pdf):  
            if os.path.exists(download_path):            
                os.remove(download_path)
            else:
                # print(f"File '{download_path}' does not exist, cannot remove it.")
                logging.info(f"File '{download_path}' does not exist, cannot remove it.")
                
            os.rename(output_pdf, output_pdf.replace('ocr_', ''))
            # Upload the processed PDF from disk back to S3
            # print(f'{bucket_name}, {input_pdf}, {access_key}, {secret_key}, {endpoint_url}, {download_path}')
            await upload_pdf_from_disk_to_s3(bucket_name, input_pdf, access_key, secret_key, endpoint_url, download_path,id)        

            logging.info(f"Uploaded processed PDF from disk back to S3: {download_path}")
            # Delete the local processed PDF file
            os.remove(download_path)
        
        # Emit success message
        msgData = {'event': 'OCR-SUCCESS', 'data': {'identifier': identifier,'id':id, 'nMasterid': nMasterid,'message':'Success','nUDid':nUDid}}
        emit_message('upload-response', 'key1', msgData)
        logging.info(f"Deleted local processed PDF file: {download_path} && {output_pdf}")
