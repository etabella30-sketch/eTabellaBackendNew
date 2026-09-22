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



def can_preview_file(filename):
    """Check if file type can be previewed"""
    viewable_extensions = {
        # Microsoft Office
        'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        # Images
        'png', 'jpg', 'jpeg', 'gif', 'bmp',
        # PDF
        'pdf',
        # MSG
        'msg'
    }
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    return ext in viewable_extensions

def get_dropdown_buttons(filename, saved_path):
    """Get HTML for dropdown buttons based on file type"""
    buttons = [
        f'<a href="{saved_path}" class="action-button download-button" download>📥 Download</a>',
        f'<a href="{saved_path}" class="action-button view-button" target="_blank">👁️ View</a>'
    ]
    
    return '\n'.join(buttons)

def get_file_icon(filename):
    """Return the appropriate icon based on file extension"""
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    
    icon_map = {
        # Microsoft Office
        'doc': '📄', 'docx': '📄',
        'xls': '📊', 'xlsx': '📊',
        'ppt': '📑', 'pptx': '📑',
        # Web files
        'htm': '🌐', 'html': '🌐',
        # Images
        'jpg': '🖼️', 'jpeg': '🖼️', 
        'png': '🖼️', 'gif': '🖼️', 'bmp': '🖼️',
        # Text files
        'txt': '📝', 'rtf': '📝',
        # PDFs
        'pdf': '📕',
        # MSG
        'msg': '✉️',
        # Archives
        'zip': '📦', 'rar': '📦', '7z': '📦',
        # Default
        '': '📎'
    }
    
    return icon_map.get(ext, '📎')

def save_attachment(attachment, save_dir):
    """Save attachment to the specified directory and return relative path"""
    try:
        filename = attachment.longFilename
        file_path = os.path.join(save_dir, filename)
        
        # Create directory if it doesn't exist
        os.makedirs(save_dir, exist_ok=True)
        
        # Save the attachment
        with open(file_path, 'wb') as f:
            f.write(attachment.data)
            
        print(f"Saved attachment: {filename}")
        return os.path.join('attachments', filename)
    except Exception as e:
        print(f"Error saving attachment {filename}: {str(e)}")
        return None

def format_file_size(size_bytes):
    """Convert file size to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} GB"

def get_attachment_html(attachments, saved_attachments):
    """Generate HTML for attachments section with dropdown buttons"""
    if not attachments:
        return ""
        
    attachment_html = """
    <div class="attachments-section">
        <div class="attachments-header">
            <strong>Attachments</strong>
        </div>
        <div class="attachments-list">
    """
    
    for attachment, saved_path in zip(attachments, saved_attachments):
        if saved_path:
            filename = attachment.longFilename
            icon = get_file_icon(filename)
            size = format_file_size(len(attachment.data))
            dropdown_buttons = get_dropdown_buttons(filename, f'{s3Dir}{saved_path}')
            
            attachment_html += f"""
                <div class="attachment-item">
                    <span class="attachment-icon">{icon}</span>
                    <span class="attachment-name">{filename}</span>
                    <span class="attachment-size">({size})</span>
                    <div class="attachment-actions dropdown">
                        {dropdown_buttons}
                    </div>
                </div>
            """
    
    attachment_html += """
        </div>
    </div>
    """
    
    return attachment_html



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
    attachments_dir = os.path.join(output_dir, 'attachments')
    
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(attachments_dir, exist_ok=True)
    # Read MSG file
    msg = extract_msg.openMsg(msg_file_path)
    embedded_images = []
    regular_attachments = []
    saved_paths = []
    print(f"Processing: {msg_file_path}")
    
    # Process images
    images_dict = {}
    for attachment in msg.attachments:
        print(f'attachment : {attachment}')
        filename = attachment.longFilename
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
            if hasattr(attachment, 'cid') and attachment.cid:
                # Embedded image
                img_path = os.path.join(images_dir, filename)
                with open(img_path, 'wb') as f:
                    f.write(attachment.data)
                images_dict[attachment.cid] = filename
                embedded_images.append(attachment)
            else:
                # Regular image attachment
                regular_attachments.append(attachment)
                saved_path = save_attachment(attachment, attachments_dir)
                saved_paths.append(saved_path)
        else:
            # Non-image attachment
            regular_attachments.append(attachment)
            saved_path = save_attachment(attachment, attachments_dir)
            saved_paths.append(saved_path)

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
                background-color: #ffffff;
            }}
            .container {{
                max-width: fit-content;
                min-width: fit-content;
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
                width: fit-content;
            }}
            	
            .attachments-section {{
                margin-top: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 4px;
            }}
            .attachments-header {{
                margin-bottom: 10px;
                color: #666;
            }}
            .attachment-item {{
                flex-wrap:wrap;
                padding: 8px 12px;
                margin: 5px 0;
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 4px;
                display: flex;
                align-items: center;
            }}
            .attachment-icon {{
                font-size: 20px;
                margin-right: 10px;
            }}
            .attachment-name {{
                flex-grow: 1;
                color: #333;
                font-size: 14px;
            }}
            .attachment-size {{
                color: #666;
                font-size: 12px;
                margin: 0 10px;
            }}
            .attachment-actions {{
                display: flex;
                gap: 8px;
            }}
            .action-button {{
                padding: 6px 12px;
                border-radius: 4px;
                text-decoration: none;
                font-size: 14px;
                transition: background-color 0.2s;
            }}
            .download-button {{
                background-color: #f8f9fa;
                color: #333;
            }}
            .view-button {{
                background-color: #e7f3ff;
                color: #0366d6;
            }}
            .download-button:hover {{
                background-color: #e9ecef;
            }}
            .view-button:hover {{
                background-color: #cce4ff;
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
            .WordSection1{{
                width: fit-content;
            }}
            span:has(img){{
                position:static !important;
                margin:0  !important;                
            }}
            div.WordSection1 {{
                page:auto !important;
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

    # Add attachments section
    if regular_attachments:
        html_content += get_attachment_html(regular_attachments, saved_paths)

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
    html_content += f"""
        <script>
            window.addEventListener('dblclick', () => {{
                parent.postMessage({{ event: 'dblclick' }}, '*');
            }});
        </script>
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