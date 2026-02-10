# file ocr.py

import asyncio
import logging
import os
from datetime import datetime

bucket_name = os.getenv("DO_SPACES_BUCKET_NAME")
access_key = os.getenv("DO_SPACES_KEY")
secret_key = os.getenv("DO_SPACES_SECRET")
endpoint_url = os.getenv("DO_SPACES_ENDPOINT")


async def ocrmy_pdf(input_pdf, output_pdf):
    process = await asyncio.create_subprocess_exec(
        'ocrmypdf',
        input_pdf,
        output_pdf,
        '--language', 'eng',
        '--fast-web-view', '1',
        '--optimize', '1',
        '--jbig2-lossy',
        '--sharp-image', '0',
        '--jobs', '2',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    while True:
        stderr_line = await process.stderr.readline()
        if not stderr_line:
            break
        try:
            stderr_data = stderr_line.decode('utf-8').strip()
            print(stderr_data)
        except Exception as e:
            logging.error(f"Subprocess error during OCR for {input_pdf}. Error: {str(e)}", exc_info=True)

    while True:
        stdout_line = await process.stdout.readline()
        if not stdout_line:
            break
        try:
            stdout_data = stdout_line.decode('utf-8').strip()
            print(stdout_data)
        except Exception as e:
            logging.error(f"Subprocess error during OCR for {input_pdf}. Error: {str(e)}", exc_info=True)

    await process.wait()  # Wait for the subprocess to finish


if __name__ == "__main__":
    input_pdf = 'F160_DPG-0040_Extension_of_Time_Submission__1_.pdf'
    output_pdf = 'F160_DPG-0040_Extension_of_Time_Submission__1_-ocr.pdf'
    asyncio.run(ocrmy_pdf(input_pdf, output_pdf))
