
import fitz  # PyMuPDF
import sys
import json
from typing import Union, List, Dict, Tuple


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
    text_to_file = {entry["link_text"].strip(): entry["target_file_path"]
                for entry in hyperlinks_data if "link_text" in entry and "target_file_path" in entry}

    doc = fitz.open(pdf_path)
    
    try:
        for page in doc:
            links = page.get_links()
            for link in links:
                rect = fitz.Rect(link["from"])
                text_in_link = page.get_textbox(rect).strip()

        
                if not text_in_link:
                    continue
                
                # Look up mapping
                if text_in_link in text_to_file:
                    new_file = text_to_file[text_in_link]

                    print(f"Updating link for '{text_in_link}' -> {new_file}")

                    # Update link to point to external PDF (GoToR type)
                    link["kind"] = fitz.LINK_GOTOR
                    link["file"] = new_file
                    link["page"] = 0  # open first page in the target

                    page.update_link(link)

                # print(f"Link: {link}, Text: '{text_in_link}'")
                    
                # new_file = f"hyperlink/{text_in_link}.pdf"

                # # --- Option A: simple URI ---
                # # link["kind"] = fitz.LINK_URI
                # # link["uri"] = new_file

                # # --- Option B: GoToR (remote PDF, recommended) ---
                # # link["kind"] = fitz.LINK_GOTOR
                # # link["file"] = new_file
                # # link["page"] = 0   # open first page in the target

                # # now update in place
                # # page.update_link(link)
        
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
    print(f"DEBUG: INDEX SCRIPT RUNNING. Received {len(hyperlinks_data)} items.")
    for i, item in enumerate(hyperlinks_data[:5]):
        print(f"DEBUG: Item {i}: {item}")
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