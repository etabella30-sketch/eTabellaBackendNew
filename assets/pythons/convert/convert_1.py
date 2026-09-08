import os
import platform
import subprocess
from PIL import Image
import time

if platform.system() == 'Windows':
    from win32com import client
    import comtypes.client

def convert_doc_to_pdf_windows(input_file, output_file):
    try:
        word = client.DispatchEx("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(input_file)
        doc.SaveAs(output_file, FileFormat=17)  # 17 is the PDF format code for PDFs
        doc.Close()
        word.Quit()
        print(f"Successfully converted Word to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting Word to PDF: {e}")

def convert_xls_to_pdf_windows(input_file, output_file):
    try:
        excel = client.DispatchEx("Excel.Application")
        excel.Visible = False
        wb = excel.Workbooks.Open(input_file)
        wb.ExportAsFixedFormat(0, output_file)  # 0 is the PDF format code
        wb.Close()
        excel.Quit()
        print(f"Successfully converted Excel to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting Excel to PDF: {e}")

def convert_ppt_to_pdf_windows(input_file, output_file):
    try:
        powerpoint = comtypes.client.CreateObject("Powerpoint.Application")
        powerpoint.Visible = 1
        deck = powerpoint.Presentations.Open(input_file)
        deck.SaveAs(output_file, 32)  # 32 is the PDF format code
        deck.Close()
        powerpoint.Quit()
        print(f"Successfully converted PowerPoint to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting PowerPoint to PDF: {e}")

def convert_img_to_pdf(input_file, output_file):
    try:
        image = Image.open(input_file)
        image.save(output_file, "PDF", resolution=100.0)
        print(f"Successfully converted image to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting image to PDF: {e}")

def convert_msg_to_pdf_windows(input_file, output_file, retries=3):
    for attempt in range(retries):
        try:
            outlook = client.Dispatch("Outlook.Application").GetNamespace("MAPI")
            msg = outlook.OpenSharedItem(input_file)
            msg.SaveAs(output_file, 17)  # 17 is the PDF format code
            print(f"Successfully converted MSG to PDF: {output_file}")
            return
        except Exception as e:
            print(f"Error converting MSG to PDF: {e}")
            if attempt < retries - 1:
                print(f"Retrying... ({attempt + 1}/{retries})")
                time.sleep(5)
            else:
                print("Failed after several attempts")
                raise

def convert_doc_to_pdf_linux(input_file, output_file):
    try:
        subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf', input_file, '--outdir', os.path.dirname(output_file)], check=True)
        print(f"Successfully converted Word to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting Word to PDF: {e}")

def convert_xls_to_pdf_linux(input_file, output_file):
    try:
        subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf', input_file, '--outdir', os.path.dirname(output_file)], check=True)
        print(f"Successfully converted Excel to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting Excel to PDF: {e}")

def convert_ppt_to_pdf_linux(input_file, output_file):
    try:
        subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf', input_file, '--outdir', os.path.dirname(output_file)], check=True)
        print(f"Successfully converted PowerPoint to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting PowerPoint to PDF: {e}")

def convert_to_pdf(input_file, output_file):
    input_file = os.path.abspath(input_file)
    output_file = os.path.abspath(output_file)
    
    if not os.path.exists(input_file):
        print(f"File not found: {input_file}")
        return

    file_extension = os.path.splitext(input_file)[1].lower()
    
    try:
        if file_extension in ['.doc', '.docx']:
            print(f"Attempting to convert Word to PDF: {input_file} to {output_file}")
            if platform.system() == 'Windows':
                convert_doc_to_pdf_windows(input_file, output_file)
            else:
                convert_doc_to_pdf_linux(input_file, output_file)
        elif file_extension in ['.xls', '.xlsx']:
            print(f"Attempting to convert Excel to PDF: {input_file} to {output_file}")
            if platform.system() == 'Windows':
                convert_xls_to_pdf_windows(input_file, output_file)
            else:
                convert_xls_to_pdf_linux(input_file, output_file)
        elif file_extension in ['.ppt', '.pptx']:
            print(f"Attempting to convert PowerPoint to PDF: {input_file} to {output_file}")
            if platform.system() == 'Windows':
                convert_ppt_to_pdf_windows(input_file, output_file)
            else:
                convert_ppt_to_pdf_linux(input_file, output_file)
        elif file_extension in ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff']:
            print(f"Attempting to convert image to PDF: {input_file} to {output_file}")
            convert_img_to_pdf(input_file, output_file)
        elif file_extension in ['.msg']:
            print(f"Attempting to convert MSG to PDF: {input_file} to {output_file}")
            if platform.system() == 'Windows':
                convert_msg_to_pdf_windows(input_file, output_file)
            else:
                print("MSG to PDF conversion is only supported on Windows.")
        else:
            print(f"Unsupported file format: {file_extension}")
    except Exception as e:
        print(f"Error converting {input_file} to PDF: {e}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python convert_to_pdf.py <input_file> <output_file>")
    else:
        convert_to_pdf(sys.argv[1], sys.argv[2])
