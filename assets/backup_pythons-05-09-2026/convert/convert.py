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

import sys

from datetime import datetime, timedelta

import logging

import socket
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter



def find_free_port(start_port=2002, end_port=2026, retry_delay=2):

    """

    Find a free port within a range. Retry until a port is available.



    :param start_port: The starting port in the range.

    :param end_port: The ending port in the range.

    :param retry_delay: Delay in seconds before retrying if no port is available.

    :return: An available port.

    """

    while True:

        for port in range(start_port, end_port + 1):

            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:

                if sock.connect_ex(('localhost', port)) != 0:  # Port is free if connect_ex returns non-zero

                    return port

        time.sleep(retry_delay)  # Wait before retrying if no port is free







def is_port_open(port):

    """Check if a port is open by attempting to connect to it."""

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:

        sock.settimeout(1)  # Set timeout for quick check

        result = sock.connect_ex(('localhost', port))

        return result == 0  # True if port is open, False otherwise





def start_unoconv_listener(port):

    """Start a unoconv listener on the specified port."""

    logging.info(f"Starting unoconv listener on port {port}")

    try:

        subprocess.Popen(

            ["nohup", "unoconv", "--listener", f"--port={port}"],

            stdout=subprocess.DEVNULL,

            stderr=subprocess.DEVNULL,

            close_fds=True,

        )

    except Exception as e:

        logging.info(f"Failed to start unoconv listener on port {port}: {e}")



def ensure_listeners_running(ports):

    """Ensure that unoconv listeners are running on all specified ports."""

    for port in ports:

        if not is_port_open(port):

            start_unoconv_listener(port)

        else:

            logging.info(f"Listener already running on port {port}")





def start_libreoffice_listener(port, max_retries=10, retry_delay=1):

    """

    Start LibreOffice headless listener on the given port if not already running.



    :param port: The port number to bind the listener (integer).

    :param max_retries: Maximum retries to check if the listener is ready.

    :param retry_delay: Delay in seconds between readiness checks.

    :return: True if the listener starts successfully, False otherwise.

    """

    try:

        port = int(port)



        # Check if the port is already in use

        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:

            if sock.connect_ex(('localhost', port)) == 0:

                logging.info(f"LibreOffice listener already running on port {port}")

                return True



        # Start the LibreOffice listener

        logging.info(f"Starting LibreOffice listener on port {port}...")

        process = subprocess.Popen(

            [

                "libreoffice",

                "--headless",

                f"--accept=socket,host=127.0.0.1,port={port};urp;",

            ],

            stdout=subprocess.DEVNULL,

            stderr=subprocess.DEVNULL,

        )



        # Wait for the listener to be ready

        for attempt in range(max_retries):

            time.sleep(retry_delay)

            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:

                if sock.connect_ex(('localhost', port)) == 0:

                    logging.info(f"LibreOffice listener started on port {port}")

                    return True

            logging.info(f"Waiting for LibreOffice listener on port {port}... (attempt {attempt + 1})")



        process.terminate()  # Terminate if the listener fails to start

        logging.error(f"Failed to start LibreOffice listener on port {port}")

        return False

    except Exception as e:

        logging.error(f"Error starting LibreOffice listener on port {port}: {e}")

        return False






def response(message):

    print(message)  # Replace with actual response handling if needed

    

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

    word = client.DispatchEx("Word.Application")

    word.Visible = False

    try:

        responce("Progress: 10")

        doc = word.Documents.Open(input_file)      

        # sys.stdout.flush()

        doc.SaveAs(output_file, FileFormat=17)  # 17 is the PDF format code for PDFs

        responce("Progress: 75")          

        doc.Close()

        word.Quit()       

        responce("Progress: 100")     

        logging.info(f'Successfully converted Word to PDF  {output_file}')

        responce("Successfully converted Word to PDF: {output_file}")

    except Exception as e:

        word.Quit()  

        logging.error(f"Error converting Word to PDF: {e}")

        responce(f"Error converting Word to PDF: {e}")

        sys.exit(1)

        return 1

        

def responce(message):

    print(f"{message}")

    sys.stdout.flush()

    



def convert_xls_to_pdf_windows(input_file, output_file):

    excel = client.DispatchEx("Excel.Application")

    excel.Visible = False

    try:

        responce("Progress: 10")

        wb = excel.Workbooks.Open(input_file)

        responce(f"Progress: 25")

        wb.ExportAsFixedFormat(0, output_file)  # 0 is the PDF format code

        responce("Progress: 75")

        wb.Close()

        excel.Quit()

        logging.info(f'Successfully converted Excel to PDF  {output_file}')

        responce(f"Successfully converted Excel to PDF: {output_file}")

    except Exception as e:

        excel.Quit()

        logging.error(f"Error converting Excel to PDF: {e}")

        responce(f"Error converting Excel to PDF: {e}")

        sys.exit(1)

        return 1



def convert_ppt_to_pdf_windows(input_file, output_file):

    powerpoint = comtypes.client.CreateObject("Powerpoint.Application")

    powerpoint.Visible = 1

    try:

        deck = powerpoint.Presentations.Open(input_file)

        responce(f"Progress: 25")

        deck.SaveAs(output_file, 32)  # 32 is the PDF format code

        responce(f"Progress: 75")

        deck.Close()

        powerpoint.Quit()

        responce(f"Progress: 100")

        logging.info(f'Successfully converted PowerPoint to PDF  {output_file}')

        responce(f"Successfully converted PowerPoint to PDF: {output_file}")

    except Exception as e:

        powerpoint.Quit()

        logging.error(f"Error converting PowerPoint to PDF: {e}")

        responce(f"Error converting PowerPoint to PDF: {e}")

        sys.exit(1)

        return 1



def convert_img_to_pdf(input_file, output_file):

    try:        

        responce(f"Progress: 10")

        image = Image.open(input_file)

        responce(f"Progress: 30")

        # image.save(output_file, "PDF", resolution=100.0)
        image_width, image_height = image.size

        # PDF page size (using letter size here)
        page_width, page_height = letter

        # Calculate scale to fit the image within the page while maintaining aspect ratio
        scale = min(page_width / image_width, page_height / image_height)
        scaled_width = image_width * scale
        scaled_height = image_height * scale

        # Calculate coordinates to center the scaled image
        x = (page_width - scaled_width) / 2
        y = (page_height - scaled_height) / 2

        # Create a PDF canvas
        c = canvas.Canvas(output_file, pagesize=letter)
        responce(f"Progress: 60")
        # Draw the scaled image at the calculated position
        c.drawImage(input_file, x, y, width=scaled_width, height=scaled_height)

        # Save the PDF
        c.save()

        responce(f"Progress: 100")

        responce(f"Successfully converted image to PDF: {output_file}")

        logging.info(f'Successfully converted Word to PDF  {output_file}')

    except Exception as e:

        logging.error(f"Error converting image to PDF: {e}")

        responce(f"Error converting image to PDF: {e}")

        sys.exit(1)

        return 1





def convert_msg_to_pdf(input_file, output_file):

    try:

        responce(f"Progress: 0")        

        # Load the .msg file

        msg = extract_msg.Message(input_file)

        responce(f"Progress: 25")

        

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

        responce(f"Progress: 75")

        

        # Save the PDF document

        pdf.showPage()

        pdf.save()

        responce(f"Progress: 100")

        responce(f"Successfully converted MSG to PDF: {output_file}")

    except Exception as e:

        responce(f"Error converting MSG to PDF: {e}")

        sys.exit(1)

        return 1



def convert_doc_to_pdf_linux(input_file, output_file, port=2002):

    try:

        responce(f"Progress: 10.1")

        process = subprocess.Popen(

            ['unoconv', f'--port={port}', '-f', 'pdf', '-o', output_file, input_file],

            stdout=subprocess.PIPE,

            stderr=subprocess.PIPE,

            universal_newlines=True

        )



        responce(f"Opend")

        while True:

            output = process.stdout.readline()

            if output == '' and process.poll() is not None:

                break

            if output:

                responce(f"Progress: 50")

                print(output.strip())

        

        responce(f"Step 3")

        stderr = process.communicate()[1]

        if stderr:

            responce(f"unoconv stderr: {stderr}")

            logging.info(f"unoconv stderr: {stderr}")                

            sys.exit(1)



        responce(f"Step 4")

        if process.returncode != 0:

            raise subprocess.CalledProcessError(process.returncode, process.args)

        

        responce(f"Progress: 100")

        logging.info(f'Successfully converted Word to PDF  {output_file}')

        responce(f"Successfully converted Word to PDF: {output_file}")

    except subprocess.CalledProcessError as e:

        logging.error(f'Error converting Word to PDF: {e}')

        responce(f"Error converting Word to PDF: {e}")

        responce(f"Failed 1")

        sys.exit(1)

        return 1

    except Exception as e:

        logging.error(f'Unexpected Error converting Word to PDF: {e}')

        responce(f"Unexpected error: {e}")

        responce(f"Failed 2")

        sys.exit(1)

        return 1

 

 
def convert_xls_to_pdf_linux(input_file, output_file, port=2002):
    """
    Convert document to PDF with improved error handling and connection management.
    """
    try:
        port = int(port)
    except (ValueError, TypeError):
        port = 2002

    if not os.path.exists(input_file):
        responce(f"Input file not found: {input_file}")
        return False

    # Create unique temporary directory with timestamp
    timestamp = int(time.time())
    temp_dir = f"/tmp/LibO_Process_{port}_{timestamp}"
    os.makedirs(temp_dir, exist_ok=True)

    libreoffice_process = None
    max_retries = 3
    retry_count = 0

    while retry_count < max_retries:
        try:
            # Kill any existing hung processes on this port
            cleanup_cmd = f"pkill -f 'soffice.*port={port}'"
            subprocess.run(cleanup_cmd, shell=True)
            time.sleep(1)

            # Start new LibreOffice process
            libreoffice_process = subprocess.Popen([
                'libreoffice',
                f'-env:UserInstallation=file://{temp_dir}',
                '--headless',
                f'--accept=socket,host=127.0.0.1,port={port};urp;',
                '--norestore',
                '--nologo',
                '--nofirststartwizard',
                '--nodefault'
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # Wait for service to start
            time.sleep(3)

            responce(f"Progress: 10")
            
            # Start conversion with shorter timeout
            process = subprocess.Popen(
                ['unoconv', 
                 f'--port={port}',
                 '--timeout=90',  # Set unoconv timeout
                 '-f', 'pdf',
                 '-o', output_file,
                 input_file
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )

            # Monitor conversion with timeout
            stdout, stderr = process.communicate(timeout=120)  # 2 minute timeout
            
            if stderr and "DeprecationWarning" not in stderr:  # Ignore deprecation warnings
                logging.warning(f"unoconv warning: {stderr}")
            
            if process.returncode != 0:
                raise subprocess.CalledProcessError(process.returncode, process.args)
            
            responce(f"Progress: 100")
            logging.info(f'Successfully converted to PDF: {output_file}')
            return True

        except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
            retry_count += 1
            logging.warning(f"Attempt {retry_count} failed: {str(e)}")
            
            if retry_count >= max_retries:
                logging.error(f'Conversion failed after {max_retries} attempts: {str(e)}')
                responce(f"Error converting to PDF after {max_retries} attempts")
                return False
            
            # Cleanup before retry
            if libreoffice_process:
                try:
                    libreoffice_process.terminate()
                    libreoffice_process.wait(timeout=5)
                except:
                    libreoffice_process.kill()
            
            time.sleep(2)  # Wait before retry

        except Exception as e:
            logging.error(f'Unexpected error: {str(e)}')
            responce(f"Unexpected error: {str(e)}")
            return False

        finally:
            # Cleanup
            try:
                if libreoffice_process:
                    libreoffice_process.terminate()
                    try:
                        libreoffice_process.wait(timeout=5)
                    except:
                        libreoffice_process.kill()
                
                # Remove temporary directory
                if os.path.exists(temp_dir):
                    subprocess.run(['rm', '-rf', temp_dir])
                    
            except Exception as e:
                logging.error(f'Cleanup error: {str(e)}')

    return False

def convert_ppt_to_pdf_linux(input_file, output_file, port=2002):

    try:

        responce(f"Progress: 10")  

        # process = subprocess.Popen(

        #     ['libreoffice', '--headless', '--convert-to', 'pdf', input_file, '--outdir', os.path.dirname(output_file)],

        #     stdout=subprocess.PIPE,

        #     stderr=subprocess.PIPE,

        #     universal_newlines=True

        # )

        process = subprocess.Popen(

            ['unoconv', '-f',f"--port={port}", 'pdf', '-o', output_file, input_file],

            stdout=subprocess.PIPE,

            stderr=subprocess.PIPE,

            universal_newlines=True

        )





        while True:

            output = process.stdout.readline()

            if output == '' and process.poll() is not None:

                break

            if output:

                responce(f"Progress: 50")               

        

        stderr = process.communicate()[1]

        if stderr:

            response(f"unoconv stderr: {stderr}")

            logging.error(f"unoconv stderr: {stderr}")

            sys.exit(0)



        if process.returncode != 0:

            raise subprocess.CalledProcessError(process.returncode, process.args)

        

        responce(f"Progress: 100")  

        responce(f"Successfully converted PowerPoint to PDF: {output_file} - {port}")

    except subprocess.CalledProcessError as e:

        logging.error(f'Error converting PowerPoint to PDF: {e}')

        responce(f"Error converting PowerPoint to PDF: {e}")        

        sys.exit(1)

        return 1

    except Exception as e:

        logging.error(f'Unexpected Error converting PowerPoint to PDF: {e}')

        responce(f"Unexpected Error converting PowerPoint to PDF: {e}")

        sys.exit(1)

        return 1   


def cleanup_libreoffice_processes():
    """Cleanup all LibreOffice processes and temporary directories"""
    try:
        # Kill all LibreOffice processes
        subprocess.run("pkill -f soffice", shell=True)
        
        # Remove all temporary directories
        subprocess.run("rm -rf /tmp/LibO_Process_*", shell=True)
        
        # Wait for processes to terminate
        time.sleep(2)
    except Exception as e:
        logging.error(f"Error cleaning up LibreOffice processes: {e}")

conversion_count = 0
MAX_CONVERSIONS_BEFORE_CLEANUP = 10

def convert_to_pdf(input_file, output_file,port = 2002):

    input_file = os.path.abspath(input_file)

    output_file = os.path.abspath(output_file)

    global conversion_count
    
    conversion_count += 1
    if conversion_count >= MAX_CONVERSIONS_BEFORE_CLEANUP:
        cleanup_libreoffice_processes()
        conversion_count = 0
        time.sleep(3)  # Wait for cleanup to complete
    

    if not os.path.exists(input_file):

        responce(f"File not found: {input_file}")

        return



    file_extension = os.path.splitext(input_file)[1].lower()

    # print(f"File Extension: {file_extension}")

    try:

        

        logging.info(f'convert start form file  {input_file} - {port}')

        if file_extension in ['.doc', '.docx']:

            # responce(f"Attempting to convert Word to PDF: {input_file} to {output_file}")

            if platform.system() == 'Windows':

                convert_doc_to_pdf_windows(input_file, output_file)

            else:

                convert_xls_to_pdf_linux(input_file, output_file,port)

        elif file_extension in ['.xls', '.xlsx','.csv']:

            # responce(f"Attempting to convert Excel to PDF: {input_file} to {output_file}")

            if platform.system() == 'Windows':

                convert_xls_to_pdf_windows(input_file, output_file)

            else:

                convert_xls_to_pdf_linux(input_file, output_file,port)

        elif file_extension in ['.ppt', '.pptx']:

            # responce(f"Attempting to convert PowerPoint to PDF: {input_file} to {output_file}")

            if platform.system() == 'Windows':

                convert_ppt_to_pdf_windows(input_file, output_file)

            else:

                convert_xls_to_pdf_linux(input_file, output_file,port)

        elif file_extension in ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff']:

            # responce(f"Attempting to convert image to PDF: {input_file} to {output_file}")

            convert_img_to_pdf(input_file, output_file)

        elif file_extension in ['.msg']:

            # responce(f"Attempting to convert MSG to PDF: {input_file} to {output_file}")

            convert_msg_to_pdf(input_file, output_file)           

        else:

            responce(f"Unsupported file format: {file_extension}")

    except Exception as e:

        responce(f"Error converting {input_file} to PDF: {e}")

        sys.exit(1)




def get_date():

    

    # Get the current time with the desired timezone

    date = datetime.now()

    

    # Extract date components

    year = date.year

    month = date.month

    day = date.day



    return f"{year:04d}-{month:02d}-{day:02d}"



lgfile = get_date()



log_dir = f'{os.getenv('ROOT_PATH')}logs/{get_date()}/convert/'
if __name__ == "__main__":

    
    print('STARTING CONVERTING IN PY',log_dir)
    print('LOG DIRECTORY IN PY',log_dir)
    if len(sys.argv) != 5:

        responce("Usage: python convert_to_pdf.py <input_file> <output_file>")

        sys.exit(1)

    else:
        log_dir  = f'{log_dir}{sys.argv[4]}/info'
        lgfile = f'info'

        log_file = os.path.join(log_dir, f'{lgfile}.log')

        # Ensure the log directory exists

        os.makedirs(log_dir, exist_ok=True)

        logging.basicConfig(

            filename=log_file,  # Specify the log file name

            level=logging.INFO,   # Set the logging level (e.g., INFO, WARNING, ERROR)

            format='%(asctime)s [%(levelname)s]: %(message)s'  # Define log message format

        )

        

        convert_to_pdf(sys.argv[1], sys.argv[2], sys.argv[3])





# pkill -f libreoffice





# netstat -tuln | grep 200







 

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process1 --headless --accept="socket,host=127.0.0.1,port=2001;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process2 --headless --accept="socket,host=127.0.0.1,port=2002;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process3 --headless --accept="socket,host=127.0.0.1,port=2003;urp;" --norestore &



# libreoffice -env:UserInstallation=file:///tmp/LibO_Process4 --headless --accept="socket,host=127.0.0.1,port=2004;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process5 --headless --accept="socket,host=127.0.0.1,port=2005;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process6 --headless --accept="socket,host=127.0.0.1,port=2006;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process7 --headless --accept="socket,host=127.0.0.1,port=2007;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process8 --headless --accept="socket,host=127.0.0.1,port=2008;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process9 --headless --accept="socket,host=127.0.0.1,port=2009;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process10 --headless --accept="socket,host=127.0.0.1,port=2010;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process11 --headless --accept="socket,host=127.0.0.1,port=2011;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process12 --headless --accept="socket,host=127.0.0.1,port=2012;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process13 --headless --accept="socket,host=127.0.0.1,port=2013;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process14 --headless --accept="socket,host=127.0.0.1,port=2014;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process15 --headless --accept="socket,host=127.0.0.1,port=2015;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process16 --headless --accept="socket,host=127.0.0.1,port=2016;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process17 --headless --accept="socket,host=127.0.0.1,port=2017;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process18 --headless --accept="socket,host=127.0.0.1,port=2018;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process19 --headless --accept="socket,host=127.0.0.1,port=2019;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process20 --headless --accept="socket,host=127.0.0.1,port=2020;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process21 --headless --accept="socket,host=127.0.0.1,port=2021;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process22 --headless --accept="socket,host=127.0.0.1,port=2022;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process23 --headless --accept="socket,host=127.0.0.1,port=2023;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process24 --headless --accept="socket,host=127.0.0.1,port=2024;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process25 --headless --accept="socket,host=127.0.0.1,port=2025;urp;" --norestore &

# libreoffice -env:UserInstallation=file:///tmp/LibO_Process26 --headless --accept="socket,host=127.0.0.1,port=2026;urp;" --norestore &