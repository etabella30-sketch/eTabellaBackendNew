import fitz  # PyMuPDF
from PIL import Image
import io
import sys

def generate_first_page_screenshot(pdf_path, output_image_path):
    # Open the PDF file
    with fitz.open(pdf_path) as pdf_document:
        # Get the first page
        page = pdf_document.load_page(0)  # 0 is the index of the first page

        # Get the page dimensions and set zoom level
        zoom = 2  # 2x zoom for better resolution
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)

        # Convert to Image object using PIL for better memory management
        img = Image.open(io.BytesIO(pix.tobytes()))

        # Save the image
        img.save(output_image_path)

# Example usage
pdf_file = sys.argv[1]
output_image_file = sys.argv[2]
generate_first_page_screenshot(pdf_file, output_image_file)
