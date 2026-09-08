# pip install pywin32
# pip install comtypes
# pip install Pillow 
# pip install pypff-python
# pip install html2text
# pip install reportlab
# pip install extract_msg 


import os
import platform
import subprocess
import extract_msg
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import html2text
import time

if platform.system() == 'Windows':
    from win32com import client
    import comtypes.client


def wrap_text(text, max_width, pdf):
    wrapped_lines = []
    words = text.split()
    current_line = ""

    for word in words:
        if pdf.stringWidth(current_line + word + " ", "Helvetica", 10) <= max_width:
            current_line += word + " "
        else:
            wrapped_lines.append(current_line)
            current_line = word + " "
    
    if current_line:
        wrapped_lines.append(current_line)
    
    return wrapped_lines

def convert_doc_to_pdf_windows(input_file, output_file):
    try:
        word = client.DispatchEx("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(input_file)
        print("Progress: 25%")
        doc.SaveAs(output_file, FileFormat=17)  # 17 is the PDF format code for PDFs
        print("Progress: 75%")
        doc.Close()
        word.Quit()
        print("Progress: 100%")
        print(f"Successfully converted Word to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting Word to PDF: {e}")

def convert_xls_to_pdf_windows(input_file, output_file):
    try:
        excel = client.DispatchEx("Excel.Application")
        excel.Visible = False
        wb = excel.Workbooks.Open(input_file)
        print("Progress: 25%")
        wb.ExportAsFixedFormat(0, output_file)  # 0 is the PDF format code
        print("Progress: 75%")
        wb.Close()
        excel.Quit()
        print("Progress: 100%")
        print(f"Successfully converted Excel to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting Excel to PDF: {e}")

def convert_ppt_to_pdf_windows(input_file, output_file):
    try:
        powerpoint = comtypes.client.CreateObject("Powerpoint.Application")
        powerpoint.Visible = 1
        deck = powerpoint.Presentations.Open(input_file)
        print("Progress: 25%")
        deck.SaveAs(output_file, 32)  # 32 is the PDF format code
        print("Progress: 75%")
        deck.Close()
        powerpoint.Quit()
        print("Progress: 100%")
        print(f"Successfully converted PowerPoint to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting PowerPoint to PDF: {e}")

def convert_img_to_pdf(input_file, output_file):
    try:
        image = Image.open(input_file)
        print("Progress: 50%")
        image.save(output_file, "PDF", resolution=100.0)
        print("Progress: 100%")
        print(f"Successfully converted image to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting image to PDF: {e}")


def convert_msg_to_pdf(input_file, output_file):
    try:
        print("Progress: 0%")
        
        # Load the .msg file
        msg = extract_msg.Message(input_file)
        print("Progress: 25%")
        
        # Extract plain text from the HTML body
        text_maker = html2text.HTML2Text()
        text_maker.ignore_links = True
        text_body = text_maker.handle(msg.body)
        
        # Create a PDF document
        pdf = canvas.Canvas(output_file, pagesize=letter)
        width, height = letter
        
        # Define text wrapping and margin
        margin = 0.5 * inch
        max_width = width - 2 * margin
        text_object = pdf.beginText(margin, height - margin)
        text_object.setFont("Helvetica", 10)
        
        # Add email details
        text_object.textLine(f"Subject: {msg.subject}")
        text_object.textLine(f"From: {msg.sender}")
        text_object.textLine(f"To: {msg.to}")
        text_object.textLine(f"Date: {msg.date}")
        text_object.textLine("")
        
        # Add email body with text wrapping
        wrapped_lines = wrap_text(text_body, max_width, pdf)
        for line in wrapped_lines:
            text_object.textLine(line)
        
        pdf.drawText(text_object)
        print("Progress: 75%")
        
        # Save the PDF document
        pdf.showPage()
        pdf.save()
        
        print("Progress: 100%")
        print(f"Successfully converted MSG to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting MSG to PDF: {e}")

def convert_doc_to_pdf_linux_test(input_file, output_file):
    try:
        print("Progress: 10%")
        process = subprocess.Popen(
            ['libreoffice', '--headless', '--convert-to', 'pdf', input_file, '--outdir', os.path.dirname(output_file)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )

        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print("Progress: 50%")
                print(output.strip())
        
        stderr = process.communicate()[1]
        if stderr:
            print(stderr)

        if process.returncode != 0:
            raise subprocess.CalledProcessError(process.returncode, process.args)
        
        print("Progress: 100%")
        print(f"Successfully converted Word to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting Word to PDF: {e}")

def convert_doc_to_pdf_linux(input_file, output_file):
    try:
        print("Progress: 10%")
        process = subprocess.Popen(
            ['unoconv', '-f', 'pdf', '-o', output_file, input_file],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )

        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print("Progress: 50%")
                print(output.strip())
        
        stderr = process.communicate()[1]
        if stderr:
            print(f"unoconv stderr: {stderr}")

        if process.returncode != 0:
            raise subprocess.CalledProcessError(process.returncode, process.args)
        
        print("Progress: 100%")
        print(f"Successfully converted Word to PDF: {output_file}")
    except subprocess.CalledProcessError as e:
        print(f"Error converting Word to PDF: {e}")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise
    
def convert_xls_to_pdf_linux(input_file, output_file):
    try:
        print("Progress: 10%")
        print(f"Converting Excel to PDF: {input_file} to {output_file}")
        process = subprocess.Popen(
            ['unoconv', '-f', 'pdf', '-o', output_file, input_file],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )

        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print("Progress: 50%")
                print(output.strip())
        
        stderr = process.communicate()[1]
        if stderr:
            print(f"unoconv stderr: {stderr}")

        if process.returncode != 0:
            raise subprocess.CalledProcessError(process.returncode, process.args)
        
        print("Progress: 100%")
        print(f"Successfully converted Excel to PDF: {output_file}")
    except subprocess.CalledProcessError as e:
        print(f"Error converting Excel to PDF: {e}")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise    
    
def convert_xls_to_pdf_linux_test(input_file, output_file):
    try:
        print("Progress: 10%")
        process = subprocess.Popen(
            ['libreoffice', '--headless', '--convert-to', 'pdf', input_file, '--outdir', os.path.dirname(output_file)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )

        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print("Progress: 50%")
                print(output.strip())
        
        stderr = process.communicate()[1]
        if stderr:
            print(stderr)

        if process.returncode != 0:
            raise subprocess.CalledProcessError(process.returncode, process.args)
        
        print("Progress: 100%")
        print(f"Successfully converted Excel to PDF: {output_file}")
    except Exception as e:
        print(f"Error converting Excel to PDF: {e}")

def convert_ppt_to_pdf_linux(input_file, output_file):
    try:
        print("Progress: 10%")
        process = subprocess.Popen(
            ['libreoffice', '--headless', '--convert-to', 'pdf', input_file, '--outdir', os.path.dirname(output_file)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )

        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print("Progress: 50%")
                print(output.strip())
        
        stderr = process.communicate()[1]
        if stderr:
            print(stderr)

        if process.returncode != 0:
            raise subprocess.CalledProcessError(process.returncode, process.args)
        
        print("Progress: 100%")
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
    print(f"File Extension: {file_extension}")
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
            convert_msg_to_pdf(input_file, output_file)           
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
