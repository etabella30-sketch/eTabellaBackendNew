import os
import sys
import subprocess
import re
import json
from datetime import datetime
import math
os.environ['TMPDIR'] = f'${os.getenv('TMP_PATH')}' # 'D:/temp'

def ocrmy_pdf(data, batch_size=50):
    try:
        total_files = len(data)
        total_batches = math.ceil(total_files / batch_size)

        for batch_num in range(total_batches):
            start_time = datetime.now().strftime('%Y%m%d_%H%M%S')
            print(f"Start time for batch {batch_num + 1}/{total_batches}: {start_time}")
            sys.stdout.flush()
            
            filename = f"ocr_commands_batch_{batch_num + 1}_{start_time}.txt"
            with open(filename, 'w') as f:
                start_index = batch_num * batch_size
                end_index = min(start_index + batch_size, total_files)

                for index in range(start_index, end_index):
                    i = data[index] 
                    input_file = i[0].replace('\\', '/')
                    output_file = i[1].replace('\\', '/') 
                    command = f"ocrmypdf --skip-text --sharp-image {int(i[2])} --language eng --fast-web-view 999999 --optimize 1 --deskew --jobs 2"
                    command += f" {input_file} {output_file}"
                    # Add the index as a tag to the command
                    f.write(f"echo 'Index {index}' && {command}\n")
            
            parallel_command = f"parallel --line-buffer --tag -j 2 :::: {filename}"
            print(parallel_command)
            sys.stdout.flush()
            
            # Use subprocess to run the parallel command in the MSYS2 environment
            process = subprocess.Popen(
                ['C:/msys64/usr/bin/bash', '-c', parallel_command,],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1                  
            )

            # Regular expression pattern to match the index and progress line
            index_pattern = re.compile(r'Index (\d+)')
            progress_pattern = re.compile(r'(\d+)%')

            # Read and process the output line by line
            current_index = None
            for line in process.stdout:
                # print(line.strip())
                # Check if the line contains an index
                index_match = index_pattern.search(line)
                if index_match:
                    current_index = index_match.group(1)
                match = progress_pattern.search(line)
                if match:
                    # progress = int(match.group(1))
                    # i want to add  indentifier to the progress
                    
                    identifier = data[int(current_index)][3]
                    

                    print(f"{identifier} {line.strip()}",flush=True)

            # Wait for the process to finish and get the return code
            return_code = process.wait()
            print(f"Return code: {return_code}")
            if return_code != 0:
                print(f"Error occurred while processing OCR tasks. Return code: {return_code}")
        

    except subprocess.CalledProcessError as e:
        print(f"Error occurred while processing OCR tasks: {e.stderr}")
    
    finally:
        if os.path.exists(filename):
            os.remove(filename)
            print(f"Removed {filename}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python ocrmypdf.py <json_data_string>")
    else:
        jsonData_str = sys.argv[1]
        data = json.loads(jsonData_str)
        sys.stdout.flush()
        ocrmy_pdf(data)
