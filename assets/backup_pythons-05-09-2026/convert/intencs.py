import subprocess
import os
from concurrent.futures import ThreadPoolExecutor
from itertools import cycle

def convert_docx_to_pdf(docx_path, output_dir, port):
    try:
        os.makedirs(output_dir, exist_ok=True)
        output_pdf = os.path.join(output_dir, os.path.splitext(os.path.basename(docx_path))[0] + ".pdf")

        # Run unoconv command with specific port
        subprocess.run(
            ["unoconv", "-f", "pdf", "-o", output_pdf, "--port", str(port), docx_path],
            check=True
        )
        print(f"Converted: {docx_path} -> {output_pdf} using port {port}")
    except subprocess.CalledProcessError as e:
        print(f"Error converting {docx_path}: {e}")
    except Exception as e:
        print(f"General error for {docx_path}: {e}")

def batch_convert(docx_files, output_dir, ports, max_workers=5):
    ports_cycle = cycle(ports)  # Cycle through ports
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        executor.map(lambda file: convert_docx_to_pdf(file, output_dir, next(ports_cycle)), docx_files)

if __name__ == "__main__":
    # List of DOCX files to convert
    docx_files = [
        "file1.xlsx",
        "file2.xlsx",
        "file3.xlsx",
    ]
    
    # Output directory for PDFs
    output_dir = "/"
    
    # Ports for LibreOffice listeners
    ports = [6001, 6002, 6003, 6004, 6005]

    # Convert files using multiple ports
    batch_convert(docx_files, output_dir, ports, max_workers=5)
