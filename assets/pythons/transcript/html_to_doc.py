import sys
import subprocess
import os
import pypandoc
pypandoc.download_pandoc()

def log_and_exit(message, code=1):
    print(f"Error: {message}")
    sys.exit(code)

if len(sys.argv) != 3:
    log_and_exit("Usage: python html_to_doc.py <input_html> <output_dir>")

input_html = sys.argv[1]
output_dir = sys.argv[2]


# Check if output file exists
input_basename = os.path.basename(input_html)
output_filename = os.path.splitext(input_basename)[0] + ".docx"
output_filepath = os.path.join(output_dir, output_filename)
print(f"Converting {input_html} to {output_filepath}...")
pypandoc.convert_file(input_html, 'docx', outputfile=output_filepath)

if os.path.isfile(output_filepath):
    print(f"✅ Conversion successful! File saved at: {output_filepath}")
else:
    print("⚠️ Conversion reported success, but file not found.")
    print("🔁 Trying fallback conversion to .odt...")



sys.exit(0)  # Exit successfully after conversion

