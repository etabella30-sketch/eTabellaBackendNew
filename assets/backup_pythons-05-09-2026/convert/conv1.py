import subprocess
from itertools import cycle
from concurrent.futures import ThreadPoolExecutor

# Cycle through listener ports for load balancing
ports = cycle(["2002", "2003","2004"])

def convert_docx_to_pdf(docx_path):
    port = next(ports)  # Select next port
    subprocess.run(["unoconv", f"--port={port}", "-f", "pdf", docx_path], check=True)

docx_files = ["file1.xlsx", "file2.xlsx", "file3.xlsx"]

# Limit the pool size based on the number of listeners
with ThreadPoolExecutor(max_workers=2) as executor:
    executor.map(convert_docx_to_pdf, docx_files)
