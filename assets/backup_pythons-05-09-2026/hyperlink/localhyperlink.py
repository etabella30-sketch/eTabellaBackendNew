
import fitz  # PyMuPDF
import sys
import json
from typing import Union, List, Dict, Tuple

def add_file_hyperlink_to_pdf(pdf_path, output_path, page_number, rect_coords, target_file_path, link_text="A1", add_border=True):
    """
    Add a file hyperlink with text to a PDF at specified coordinates
    
    Args:
        pdf_path (str): Path to the input PDF file
        output_path (str): Path where the modified PDF will be saved
        page_number (int): Page number (0-based, so page 2 = index 1)
        rect_coords (tuple): Rectangle coordinates (x0, y0, x1, y1)
        target_file_path (str): Relative or absolute path to the target file
        link_text (str): Text to display in the hyperlink area
        add_border (bool): Whether to add a border around the text
    """
    # Open the PDF
    doc = fitz.open(pdf_path)
    
    # Get the specific page
    print(f'page_number2 {page_number}')
    page = doc[page_number]
    
    # Create rectangle for the hyperlink area
    rect = fitz.Rect(rect_coords)
    
    # Add border/background if requested
    # if add_border:
    #     # Draw a light border around the rectangle
    #     page.draw_rect(rect, color=(0, 0, 1), width=1)  # Blue border
        # Optional: Add light background
        # page.draw_rect(rect, color=(0.9, 0.9, 1), fill=(0.9, 0.9, 1))  # Light blue fill
    
    # Insert text "A1" at the rectangle position
    # Calculate font size based on rectangle height
    font_size = min(rect.height * 0.6, 12)  # Adjust as needed
    
    # Center the text in the rectangle
    text_width = fitz.get_text_length(link_text, fontname="helv", fontsize=font_size)
    x_center = rect.x0 + (rect.width - text_width) / 2
    y_center = rect.y0 + (rect.height + font_size) / 2
    
    # Insert text
    page.insert_text(
        (x_center, y_center),  # Centered position
        link_text,
        fontsize=font_size,
        color=(0, 0, 1),  # Blue color for link appearance
        fontname="helv"  # Helvetica font
    )
    
    if add_border:
        # Calculate underline position
        underline_y = y_center + 2  # Slightly below the text baseline
        underline_start = (x_center, underline_y)
        underline_end = (x_center + text_width, underline_y)
        
        # Draw the underline
        page.draw_line(underline_start, underline_end, color=(0, 0, 1), width=1)  # Blue underline
    
    
    
    # Create the link annotation
    link = {
        "kind": fitz.LINK_LAUNCH,  # For file links
        "from": rect,
        "file": target_file_path,
        "page": 5  # Opens to first page of target PDF
    }
    
    # Add the link to the page
    # print(f'{link}')
    page.insert_link(link)
    
    # Save the modified PDF
    doc.save(output_path)
    doc.close()
    
    print(f"Text '{link_text}' and hyperlink added successfully!")
    print(f"Modified PDF saved to: {output_path}")

def add_web_hyperlink_to_pdf(pdf_path, output_path, page_number, rect_coords, url):
    """
    Add a web hyperlink to a PDF at specified coordinates
    
    Args:
        pdf_path (str): Path to the input PDF file
        output_path (str): Path where the modified PDF will be saved
        page_number (int): Page number (0-based)
        rect_coords (tuple): Rectangle coordinates (x0, y0, x1, y1)
        url (str): Web URL to link to
    """
    doc = fitz.open(pdf_path)
    
    print(f'page_number {page_number}')
    page = doc[page_number]
    rect = fitz.Rect(rect_coords)
    
    link = {
        "kind": fitz.LINK_URI,  # For web links
        "from": rect,
        "uri": url
    }
    
    page.insert_link(link)
    doc.save(output_path)
    doc.close()
    
    print(f"Web hyperlink added successfully!")
    print(f"Modified PDF saved to: {output_path}")


def normalize_rect_coords(rect_data) -> Tuple[float, float, float, float]:
    """
    Convert rectangle coordinate formats to (x0, y0, x1, y1)
    """
    # Handle list/tuple of 4 numbers
    if isinstance(rect_data, (list, tuple)) and len(rect_data) == 4 and all(isinstance(x, (int, float)) for x in rect_data):
        return tuple(rect_data)

    # Handle list containing a dictionary (your case)
    if isinstance(rect_data, list) and len(rect_data) > 0:
        rect_data = rect_data[0]  # take first element

    # Handle dictionary
    if isinstance(rect_data, dict):
        # Format: {"x": ..., "y": ..., "width": ..., "height": ...}
        if all(k in rect_data for k in ['x', 'y', 'width', 'height']):
            x0 = float(rect_data['x'])
            y0 = float(rect_data['y'])
            x1 = x0 + float(rect_data['width'])
            y1 = y0 - float(rect_data['height'])
            print(f'rect_data {rect_data}')
            print(f'rect {x0}, {y0}, {x1}, {y1}')
            return (x0, y0, x1, y1)

        # Alternative format: {"x0": ..., "y0": ..., "x1": ..., "y1": ...}
        if all(k in rect_data for k in ['x0', 'y0', 'x1', 'y1']):
            return (float(rect_data['x0']), float(rect_data['y0']),
                    float(rect_data['x1']), float(rect_data['y1']))

    raise ValueError(f"Unsupported rectangle format: {rect_data}")



def add_multiple_hyperlinks_to_pdf(pdf_path, output_path, hyperlinks_data):
    """
    Add multiple hyperlinks to a PDF at specified coordinates
    
    Args:
        pdf_path (str): Path to the input PDF file
        output_path (str): Path where the modified PDF will be saved
        hyperlinks_data (list): List of dictionaries containing hyperlink information
            Each dictionary should have:
            - 'page_number' (int): Page number (0-based)
            - 'rect_coords' (tuple): Rectangle coordinates (x0, y0, x1, y1)
            - 'target_file_path' (str): Path to target file (for file links)
            - 'url' (str): URL (for web links) - optional, use instead of target_file_path
            - 'link_text' (str): Text to display (optional, defaults to filename)
            - 'add_border' (bool): Whether to add border/underline (optional, defaults to True)
            - 'link_type' (str): 'file' or 'web' (optional, auto-detected)
    """
    # Open the PDF
    doc = fitz.open(pdf_path)
    
    try:
        for link_data in hyperlinks_data:
            # Extract data with defaults
            # print(f'data - {link_data}')
            page_number = int(link_data['page']) -1
            rect_coords = link_data['rect']
            linkpage = int(rect_coords[0].get('redirectpage', '1'))
            rect_coords = normalize_rect_coords(rect_coords)
            # print(f'rect codes {rect_coords}')
            
            add_border = link_data.get('add_border', True)
            
            # Determine link type
            if 'url' in link_data:
                link_type = 'web'
                target = link_data['url']
                link_text = link_data.get('link_text', 'Link')
            else:
                link_type = 'file'
                target = link_data['target_file_path']
                # Default text is filename without extension
                import os
                default_text = os.path.splitext(os.path.basename(target))[0]
                link_text = link_data.get('link_text', default_text)
            try:
            # Get the specific page
                # print(f'page_number {page_number}')
                page = doc[page_number]
                
                # Create rectangle for the hyperlink area
                rect = fitz.Rect(rect_coords)
                
                # Insert text at the rectangle position
                font_size = min(rect.height * 0.6, 12)  # Adjust font size based on rectangle height
                
                # Center the text in the rectangle
                text_width = fitz.get_text_length(link_text, fontname="helv", fontsize=font_size) + 2
                x_center = rect.x0 # + (rect.width - text_width) / 2
                y_center = rect.y0  # + (rect.height + font_size) / 2
                
                # Insert text
                # page.insert_text(
                #     (x_center, y_center),  # Centered position
                #     link_text,
                #     fontsize=font_size,
                #     color=(0, 0, 1),  # Blue color for link appearance
                #     fontname="helv"  # Helvetica font
                # )
                
                # Add underline if border is requested
                if add_border:
                    underline_y = y_center  # Slightly below the text baseline
                    underline_start = (x_center, underline_y)
                    underline_end = (rect.x1, underline_y)
                    page.draw_line(underline_start, underline_end, color=(0, 0, 1), width=1)
                
                # Create the appropriate link annotation
                if link_type == 'web':
                    link = {
                        "kind": fitz.LINK_URI,  # For web links
                        "from": rect,
                        "uri": target
                    }
                else:  # file link
                    link = {
                        "kind": fitz.LINK_GOTOR,  # For file links
                        "from": rect,
                        "file": target,
                        "page": linkpage - 1 if linkpage and linkpage > 1 else 1  # Opens to first page of target PDF
                    }
                
                print(f'linkpage {link}')
                # Add the link to the page
                page.insert_link(link)
                # print(f"Added {link_type} link '{link_text}' on page {page_number + 1}")
            except Exception as e:
                print(f"page not found - {e}")
        
        # Save the modified PDF
        doc.save(output_path)
        print(f"\nAll hyperlinks added successfully!")
        print(f"Modified PDF saved to: {output_path}")
        
    finally:
        doc.close()


# Example usage for your folder structure
if __name__ == "__main__":
    # Your file paths
    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]  # CSV output path
    target_files = sys.argv[3]  # CSV output path
    cIsindex = sys.argv[4]  # CSV output path
    
    # hyperlinks_data = json.loads(target_files)
    hyperlinks_data = []
    with open(target_files, "r", encoding="utf-8") as f:
        hyperlinks_data = json.load(f)
    print(f"PYTHON SCRIPT RECEIVED {len(hyperlinks_data)} HYPERLINKS")
    for i, link in enumerate(hyperlinks_data[:5]):
        print(f"DEBUG: Link {i+1}: Term='{link.get('link_text', 'N/A')}' Page={link.get('page')} Target='{link.get('target_file_path', 'N/A')}'")


    # print(f'{input_pdf},{output_pdf},{hyperlinks_data[0]}')
    # input_pdf = 'Files/A1_Request_file.pdf' #"Bundle A/basefile.pdf"
    # output_pdf = "Files/A1_Request_for_output.pdf"
    # target_file = "Hyperlink/link.pdf"  # Relative path
    # Page 2 (index 1, since it's 0-based)
    page_index = 1
    
    # Rectangle coordinates (x0, y0, x1, y1)
    # You need to replace these with your actual coordinates
    rectangle = (100, 200, 300, 250)  # Example coordinates
    
    # Add the file hyperlink
    add_multiple_hyperlinks_to_pdf(
        pdf_path=input_pdf,
        output_path=output_pdf,
        hyperlinks_data=hyperlinks_data
    )
    