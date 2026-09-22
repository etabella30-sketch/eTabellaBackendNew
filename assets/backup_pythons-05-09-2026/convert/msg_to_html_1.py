import os
import extract_msg
from datetime import datetime
import re
from bs4 import BeautifulSoup
import shutil
import logging
import traceback
from logging.handlers import RotatingFileHandler
import sys


def fix_image_references(html_content, images_dict):
    """Replace CID image references with local file paths"""
    for cid, filename in images_dict.items():
        html_content = html_content.replace(f'src="cid:{cid}"', f'src="{s3Dir}images/{filename}"')
        html_content = html_content.replace(f'src=\\"cid:{cid}\\"', f'src=\\"{s3Dir}images/{filename}\\"')
    return html_content

def format_email_addresses(addresses):
    if not addresses:
        return ""
    addr_list = addresses.split(';')
    formatted = []
    for addr in addr_list:
        addr = addr.strip()
        if '<' not in addr and '@' in addr:
            formatted.append(f'<a href="mailto:{addr}">{addr}</a>')
        else:
            formatted.append(addr)
    return '; '.join(formatted)

def msg_to_html(msg_file_path):
    # Create output directory
    output_dir = os.path.dirname(msg_file_path)
    images_dir = os.path.join(output_dir, 'images')
    if not os.path.exists(images_dir):
        os.makedirs(images_dir)
    
    # Read MSG file
    msg = extract_msg.openMsg(msg_file_path)
    print(f"Processing: {msg_file_path}")
    
    # Process images
    images_dict = {}
    for attachment in msg.attachments:
        filename = attachment.longFilename
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
            img_path = os.path.join(images_dir, filename)
            with open(img_path, 'wb') as f:
                f.write(attachment.data)
            print(f"Saved image: {filename}")
            if hasattr(attachment, 'cid'):
                images_dict[attachment.cid] = filename

    # Get email metadata
    subject = msg.subject or "No Subject"
    sender = msg.sender or "No Sender"
    to = msg.to or "No Recipients"
    cc = msg.cc if msg.cc else None
    date = msg.date.strftime("%d %B %Y %I:%M %p") if msg.date else "No Date"
    importance = "High" if hasattr(msg, 'header') and msg.header.get('Importance', '').lower() == 'high' else "Normal"

    # Get HTML content
    body_content = msg.htmlBody
    if isinstance(body_content, bytes):
        body_content = body_content.decode('utf-8', errors='ignore')
    
    # If no HTML content, use plain text
    if not body_content:
        body_content = msg.body.replace('\n', '<br>') if msg.body else ""
    
    # Fix image references
    body_content = fix_image_references(body_content, images_dict)
    
    # Create final HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>{subject}</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                max-width: 900px;
                margin: 0 auto;
                background: white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                border-radius: 4px;
            }}
            .header {{
                background: #f8f9fa;
                padding: 20px;
                border-bottom: 1px solid #ddd;
            }}
            .header-row {{
                display: flex;
                margin: 5px 0;
                align-items: baseline;
            }}
            .header-label {{
                font-weight: bold;
                color: #666;
                width: 80px;
                flex-shrink: 0;
            }}
            .header-value {{
                flex-grow: 1;
            }}
            .importance-high {{
                color: #d9534f;
                font-weight: bold;
            }}
            .body-content {{
                padding: 20px;
            }}
            img {{
                max-width: 100%;
                height: auto;
            }}
            a {{
                color: #0366d6;
                text-decoration: none;
            }}
            a:hover {{
                text-decoration: underline;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="header-row">
                    <div class="header-label">From:</div>
                    <div class="header-value">{format_email_addresses(sender)}</div>
                </div>
                <div class="header-row">
                    <div class="header-label">Date:</div>
                    <div class="header-value">{date}</div>
                </div>
                <div class="header-row">
                    <div class="header-label">To:</div>
                    <div class="header-value">{format_email_addresses(to)}</div>
                </div>
    """

    if cc:
        html_content += f"""
                <div class="header-row">
                    <div class="header-label">CC:</div>
                    <div class="header-value">{format_email_addresses(cc)}</div>
                </div>
        """

    if importance == "High":
        html_content += f"""
                <div class="header-row">
                    <div class="header-label">Importance:</div>
                    <div class="header-value importance-high">High</div>
                </div>
        """

    html_content += f"""
                <div class="header-row">
                    <div class="header-label">Subject:</div>
                    <div class="header-value">{subject}</div>
                </div>
            </div>
            <div class="body-content">
                {body_content}
            </div>
        </div>
    </body>
    </html>
    """
    
    # Save HTML file
    output_filename = os.path.splitext(os.path.basename(msg_file_path))[0] + '.html'
    output_path = os.path.join(output_dir, output_filename)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return output_path
def process_directory(self):
    """Process all MSG files in the directory"""
    success_count = 0
    error_count = 0
    
    self.logger.info(f"Starting to process directory: {self.base_dir}")
    self.logger.info("=" * 50)
    
    for filename in os.listdir(self.base_dir):
        if filename.lower().endswith('.msg'):
            msg_path = os.path.join(self.base_dir, filename)
            try:
                output_path = msg_to_html(msg_path)
                # self.logger.info(f"Successfully converted: {filename}")
                # self.logger.info(f"Output: {output_path}")
                success_count += 1
            except Exception as e:
                # self.logger.error(f"Failed to process {filename}: {str(e)}")
                error_count += 1
    
    # self.logger.info("\nConversion Summary:")
    # self.logger.info(f"Successfully converted: {success_count} files")
    # self.logger.info(f"Failed conversions: {error_count} files")
    
    return success_count, error_count

def responce(res):
    print(res)
    sys.stdout.flush()

if __name__ == "__main__":
    if len(sys.argv) != 5:

        responce("Usage: python convert_to_pdf.py <input_file> <output_file>")

        sys.exit(1)

    else:
        input_file = sys.argv[1]
        output_file = sys.argv[2]
        nId = sys.argv[3]
        s3Dir = f'{sys.argv[4]}/{nId}/'
        try:            
            # processor = EmailProcessor(nId)
            output_path = msg_to_html(input_file)
            responce(f"Successfully converted: {input_file} to {output_path}")
            sys.exit(0)
        except Exception as e:
            responce(f"Failed to convert {input_file}: {str(e)}")