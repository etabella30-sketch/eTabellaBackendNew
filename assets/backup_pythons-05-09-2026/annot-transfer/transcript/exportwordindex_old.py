import json
from collections import defaultdict, Counter
import math
import html
import sys
from datetime import datetime
import re
import os
import shutil
import subprocess

# --- PILLOW for text measurement ---
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("FATAL ERROR: The 'Pillow' library is required.")
    print("Please install it using: pip install Pillow")
    sys.exit(1)

# Make sure this import is at the top of your file
import asyncio
# You will also need Pyppeteer
try:
    import pyppeteer
except ImportError:
    print("FATAL ERROR: The 'pyppeteer' library is required for reliable PDF generation.")
    print("Please install it using: pip install pyppeteer")
    sys.exit(1)



# --- Configuration ---
COLUMNS_PER_PAGE, LINES_PER_COLUMN = 5, 52
LINES_PER_PAGE = COLUMNS_PER_PAGE * LINES_PER_COLUMN
PAGE_WIDTH_PX, MARGIN_PX = 794, 48
CONTENT_WIDTH_PX = PAGE_WIDTH_PX - (2 * MARGIN_PX)
COLUMN_GAP_PX = 20
TOTAL_GAP_WIDTH = (COLUMNS_PER_PAGE - 1) * COLUMN_GAP_PX
COLUMN_WIDTH_PX = (CONTENT_WIDTH_PX - TOTAL_GAP_WIDTH) / COLUMNS_PER_PAGE

try:
    FONT_FILE = 'cour.ttf'
    FONT_SIZE_PX = 10
    FONT = ImageFont.truetype(FONT_FILE, FONT_SIZE_PX)
except FileNotFoundError:
    print(f"FATAL ERROR: Font file '{FONT_FILE}' not found."); sys.exit(1)

STOP_WORDS = set()
HEADER_PLACEHOLDER = "<HEADER_PLACEHOLDER>"
TIMESTAMP_RE = re.compile(r'^\d{1,2}:\d{2}:\d{2}$')


def load_stop_words(filename='defwords.txt'):
    global STOP_WORDS
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            STOP_WORDS = set(line.strip().upper() for line in f if line.strip())
        print(f"   - Loaded {len(STOP_WORDS)} stop words.")
    except FileNotFoundError:
        print(f"   - Warning: Stop words file '{filename}' not found. Using empty set.")
        STOP_WORDS = set()

def create_word_index(json_file):
    print(f"\n[Stage 1] Reading and processing {json_file}...")
    try:
        with open(json_file, 'r', encoding='utf-8') as f: data = json.load(f)
    except Exception as e: print(f"FATAL ERROR reading JSON: {e}"); sys.exit(1)
    
    temp_index = defaultdict(list)
    for entry in data:
        page, line, text = entry.get('pageno'), entry.get('lineno'), entry.get('linetext', '')
        timestamp = entry.get('timestamp')
        if page is not None and line is not None:
            all_tokens = text.split()
            if timestamp:
                all_tokens.append(timestamp)
            for word in all_tokens:
                display_word = re.sub(r'^\W+|\W+$', '', word)
                if not display_word: continue
                normalized_key = display_word.lower()
                if normalized_key.upper() in STOP_WORDS: continue
                temp_index[normalized_key].append({'original': display_word, 'ref': (page, line)})
    final_index = {}
    for key, occurrences in temp_index.items():
        capitalizations = [occ['original'] for occ in occurrences]
        canonical_word = Counter(capitalizations).most_common(1)[0][0]
        unique_refs = sorted(list(set(occ['ref'] for occ in occurrences)), key=lambda r: (int(r[0]), int(r[1])))
        final_index[key] = {'display': canonical_word, 'refs': unique_refs}
    print(f"   - Indexed {len(final_index)} unique words.")
    return final_index

def custom_sort_key(key):
    if not key: return (4, [])
    if TIMESTAMP_RE.match(key): return (1, [int(p) for p in key.split(':')])
    parts = [int(s) if s.isdigit() else s.lower() for s in re.split(r'(\d+)', key)]
    first_char = key[0]
    if first_char.isalpha(): return (0, parts)
    if first_char.isdigit(): return (2, parts)
    return (3, parts)

def get_section_key(key):
    if not key: return "*"
    if TIMESTAMP_RE.match(key): return "Timestamps"
    first_char = key[0]
    if first_char.isalpha(): return first_char.upper()
    if first_char.isdigit(): return "#"
    return "*"

def write_index_to_text(word_index, output_file, case_title, day_number):
    print(f"\n[TEXT OUTPUT] Writing verification index to '{output_file}'...")
    total_refs = sum(len(entry['refs']) for entry in word_index.values())
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("WORD INDEX VERIFICATION FILE\n" + "=" * 50 + "\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Case: {case_title}\nDay: {day_number}\n")
        f.write(f"Total unique words: {len(word_index):,}\nTotal references: {total_refs:,}\n")
        f.write("=" * 50 + "\n")
        sorted_keys = sorted(word_index.keys(), key=custom_sort_key)
        current_section_key = ''
        for key in sorted_keys:
            entry = word_index[key]
            display_word = entry['display']
            section_key = get_section_key(key)
            if section_key != current_section_key:
                current_section_key = section_key
                f.write(f"\n[{current_section_key}]\n")
            all_ref_strings = [f'{p}:{l}' for p, l in entry['refs']]
            f.write(f"{display_word}\n")
            line_buffer = "    "
            for ref_str in all_ref_strings:
                if len(line_buffer) + len(ref_str) > 80:
                    f.write(line_buffer.rstrip() + "\n")
                    line_buffer = "    "
                line_buffer += ref_str + " "
            f.write(line_buffer.rstrip() + "\n")
    print(f"   - Verification file created.")

def pack_entries_into_lines(word_index):
    print("\n[Stage 2] Typesetting index...")
    def get_text_width(text): return FONT.getbbox(text)[2]
    all_lines, sorted_keys = [], sorted(word_index.keys(), key=custom_sort_key)
    current_section_key = ''
    for key in sorted_keys:
        entry = word_index[key]
        display_word = entry['display']
        section_key = get_section_key(key)
        if section_key and section_key != current_section_key:
            current_section_key = section_key
            all_lines.append(f"[{current_section_key}]")
        formatted_ref_tokens = [f'{p}:{l}' for p, l in entry['refs']]
        full_ref_string = ' '.join(formatted_ref_tokens)
        single_line_attempt = f"{display_word} {full_ref_string}"
        if get_text_width(single_line_attempt) <= COLUMN_WIDTH_PX:
            all_lines.append(single_line_attempt)
        else:
            all_lines.append(display_word)
            current_line_text = "    "
            for token in formatted_ref_tokens:
                if get_text_width(current_line_text + token + " ") > COLUMN_WIDTH_PX and len(current_line_text) > 4:
                    all_lines.append(current_line_text.rstrip())
                    current_line_text = "    " + token + " "
                else:
                    current_line_text += token + " "
            if current_line_text.strip():
                all_lines.append(current_line_text.rstrip())
    print(f"   - Generated a total of {len(all_lines)} raw content lines.")
    return all_lines

def structure_lines_into_pages(all_lines):
    print("\n[Stage 3] Structuring lines into pages...")
    all_pages_content = []
    current_page_content, lines_used_on_page = [], 0
    for line_text in all_lines:
        is_header = line_text.startswith('[') and line_text.endswith(']')
        cost = 2 if is_header else 1
        if lines_used_on_page + cost > LINES_PER_PAGE:
            padding_needed = LINES_PER_PAGE - lines_used_on_page
            current_page_content.extend([""] * padding_needed)
            all_pages_content.append(current_page_content)
            current_page_content, lines_used_on_page = [], 0
        current_page_content.append(line_text)
        if is_header: current_page_content.append(HEADER_PLACEHOLDER)
        lines_used_on_page += cost
    if current_page_content:
        padding_needed = LINES_PER_PAGE - lines_used_on_page
        current_page_content.extend([""] * padding_needed)
        all_pages_content.append(current_page_content)
    print(f"   - Structured content into {len(all_pages_content)} perfectly filled pages.")
    return all_pages_content

def generate_fixed_height_html(all_pages, output_file, case_title, day_number):
    print(f"\n[Stage 4] Generating final HTML...")
    current_date = formatted_trans_date #datetime.now(trans_date).strftime("%d %B %Y")
    html_output = f'''<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Word Index - {case_title}</title><style>
    @page {{ size: A4 portrait; margin: 0; }}
    body {{ margin: 0; font-family: '{FONT.font.family}', 'Courier New', monospace; font-size: 13pt; line-height: 1.3; }}
    pre {{ margin: 0; white-space: pre-wrap; font-family: '{FONT.font.family}', 'Courier New', monospace; }}
    .page {{ break-after: page;padding:40px; }} .page:last-child {{ break-after: auto; }}
    .header, .footer {{ padding: 0; font-size: 10pt; }}
    .header {{ display: flex; justify-content: space-between; border-bottom: 1px solid #c2c2c2; padding-bottom: 10px; margin-bottom: 15px; }}
    .footer {{ border-top: 1px solid #c2c2c2; padding-top: 20px; margin-top: 20px; text-align: center; }}
    .content-area {{ display: grid; grid-template-columns: repeat({COLUMNS_PER_PAGE}, 1fr); gap: 0px;border: 1px solid #c2c2c2; }}
    .column {{ border-right: 1px solid #c2c2c2; padding:10px;}} .column:last-child {{ border-right: none; }}
    .line {{ height: 17.4pt; white-space: pre; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; letter-spacing: -0.5px; word-spacing: -7px;}}
    .line.header {{ font-weight: bold; justify-content: center; font-size: 14pt;margin-bottom: 0px;margin-top: 5px; border-top: 1px solid #c2c2c2; padding-top: 5px;padding-bottom: 5px; }}
    .line .word {{ font-weight: bold; }}
    @media print {{ * {{ -webkit-print-color-adjust: exact; color-adjust: exact; }} }}
</style></head><body>'''
    for page_num, page_content in enumerate(all_pages, 1):
        print(f"   - Rendering Page {page_num}/{len(all_pages)}...")
        html_output += f'<div class="page"><div class="header" style="flex"><pre style="width:50%;margin:0" >{html.escape(case_title)}</pre><div style="width:50%; text-align:right" >{html.escape(day_number)}<br/>{current_date}<br/>Page {page_num}</div></div><div class="content-area">'
        for col_num in range(COLUMNS_PER_PAGE):
            col_start, col_end = col_num * LINES_PER_COLUMN, (col_num + 1) * LINES_PER_COLUMN
            column_lines = page_content[col_start:col_end]
            html_output += '<div class="column">'
            for line_text in column_lines:
                if line_text == HEADER_PLACEHOLDER: html_output += ''; continue
                escaped = html.escape(line_text)
                if line_text.startswith('[') and line_text.endswith(']'): html_output += f'<div class="line header">{escaped}</div>'
                elif not line_text.strip(): html_output += ''
                else:
                    if not line_text.startswith("    "):
                        parts = escaped.split(' ', 1)
                        if len(parts) > 1 and parts[1]:
                            word, refs = f'<span class="word">{parts[0]}</span>', parts[1]
                            html_output += f'<div class="line"><span>{word} {refs}</span></div>'
                        else:
                            word = f'<span class="word">{parts[0]}</span>'
                            html_output += f'<div class="line"><span>{word}</span></div>'
                    else:
                        html_output += f'<div class="line"><span>{escaped}</span></div>'
            html_output += '</div>'
        html_output += f'</div><div class="footer" style="display:flex;"> <pre style="width:50%;whitespace:pre-line;text-align:left"> {comp_name} </pre> <pre style="width:50%;whitespace:pre-line;margin-left:auto;text-align:right">   {comp_info}  </pre> </div></div>'
    html_output += '</body></html>'
    with open(output_file, 'w', encoding='utf-8') as f: f.write(html_output)
    print(f"\n HTML file '{output_file}' generated successfully!")

async def generate_pdf_with_pyppeteer(html_file, pdf_file):
    """
    Generate PDF from HTML using Pyppeteer for full control over the rendering process.
    This is the most reliable method for complex documents.
    """
    print(f"\n[Stage 5] Generating PDF from '{html_file}'...")
    print("   - Using Pyppeteer (automated Chrome) for maximum fidelity.")
    
    browser = None
    try:
        # Launch a new browser instance.
        chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe' 
        browser=None
        args = ['--no-sandbox', '--disable-gpu']

        if sys.platform == "win32":
            # This part works, assuming Chrome is in that specific folder.
            browser = await pyppeteer.launch( executablePath=chrome_path, args=args, headless=True)
        else:
            browser = await pyppeteer.launch( args=args, headless=True)
          
        
        page = await browser.newPage()
        
        # Go to the local HTML file.
        # The 'waitUntil' option ensures network resources are loaded.
        file_path = f'file:///{os.path.abspath(html_file)}'
        print(f"   - Loading page: {file_path}")
        await page.goto(file_path, {'waitUntil': 'networkidle0'})

        # This is the magic step: emulate the print media type.
        # This forces the browser to apply all your @media print CSS rules.
        await page.emulateMedia('print')

        print("   - Generating PDF from fully rendered page...")
        # Now, generate the PDF. We can specify the format and tell it to
        # print background graphics, which includes our borders.
        await page.pdf({
            'path': pdf_file,
            'format': 'A4',
            'printBackground': True,
            'margin': { 'top': '0.5in', 'bottom': '0.5in', 'left': '0.5in', 'right': '0.5in' }
        })

        print(f" PDF file '{pdf_file}' generated successfully!")

    except Exception as e:
        print(f"   - An unexpected error occurred during Pyppeteer PDF generation: {e}")
    finally:
        if browser:
            await browser.close()


def generate_pdf_from_html(html_file, pdf_file):
    """
    Wrapper function to run the asynchronous Pyppeteer logic.
    """
    # Pyppeteer is async, so we need to run it in an event loop.
    # asyncio.get_event_loop().run_until_complete(generate_pdf_with_pyppeteer(html_file, pdf_file))
    asyncio.run(generate_pdf_with_pyppeteer(html_file, pdf_file))


def log_and_exit(message, code=1):
    print(f"Error: {message}")
    sys.exit(code)

print('params lenght - ',len(sys.argv))
# if len(sys.argv) != 7:
#     log_and_exit("Usage: python html_to_doc.py <input_html> <output_dir>")



json_file = sys.argv[1]
output_dir = sys.argv[2]
case_title = sys.argv[3]
day_number = sys.argv[4]
trans_date = sys.argv[5]
comp_name = sys.argv[6]
comp_info = sys.argv[7]

try:
    parsed_date = datetime.strptime(trans_date, "%Y-%m-%d")  # Adjust format as needed
    formatted_trans_date = parsed_date.strftime("%d %B %Y")
except ValueError:
    # If parsing fails, use current date
    formatted_trans_date = datetime.now().strftime("%d %B %Y")


print(f"JSON file: {json_file}")
print(f"Output directory: {output_dir}")
print(f"Case title: {case_title}")
print(f"Day number: {day_number}")
print(f"Transaction date: {trans_date}")
print(f"Company name: {comp_name}")
print(f"Company info: {comp_info}")

print(f"   - Input JSON File: {json_file}")    
# json_file = 'input5.json' 
html_output_file =  os.path.splitext(json_file)[0] + ".html" # 'word_index_print_final.html'
text_output_file =  os.path.splitext(json_file)[0] + ".txt" # 'word_index_verification.txt'
pdf_output_file = output_dir # os.path.splitext(json_file)[0] + ".pdf" # 'word_index_print_final.pdf'

print(f"   - Word Cleaning: Using Regex for robust punctuation removal.")

load_stop_words()
word_index = create_word_index(json_file)
if not word_index: 
    print("\n No words were indexed. Exiting.")
    sys.exit(1)

write_index_to_text(word_index, text_output_file, case_title, day_number)

all_raw_lines = pack_entries_into_lines(word_index)
all_structured_pages = structure_lines_into_pages(all_raw_lines)
generate_fixed_height_html(all_structured_pages, html_output_file, case_title, day_number)

generate_pdf_from_html(html_output_file, pdf_output_file)

print("\n SUCCESS!")
print(f"HTML Output: {html_output_file}")
print(f"PDF Output:  {pdf_output_file}")
print(f"Text Output: {text_output_file}")

