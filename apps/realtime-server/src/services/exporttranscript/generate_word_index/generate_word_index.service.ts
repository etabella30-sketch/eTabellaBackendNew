import { LogService } from '@app/global/utility/log/log.service';
import { Inject, Injectable } from '@nestjs/common';
import { UtilityService } from '../../utility/utility.service';
import { DbService } from '@app/global/db/pg/db.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { promisify } from 'util';
import { exec, spawn } from 'child_process';
import { createCanvas } from 'canvas';
const execAsync = promisify(exec);

@Injectable()
export class GenerateWordIndexService {

  private readonly logApplication: string = 'realtime/export';
  exportPath: string = `${this.config.get('REALTIME_PATH')}exports/`;
  helpingVerbs = new Set([
    'a', 'is', 'am', 'are', 'was', 'were', 'be', 'being', 'been', 'have', 'has', 'had',
    'do', 'does', 'did', 'may', 'might', 'must', 'shall', 'should', 'will', 'would', 'can', 'could'
  ]);

  // Add additional stop words if needed
  stopWords = new Set([
    'the', 'and', 'to', 'of', 'in', 'for', 'on', 'with', 'by', 'at', 'from',
    'an', 'this', 'that', 'these', 'those', 'it', 'its', 'we', 'our', 'they', 'their'
  ]);

  constructor(private config: ConfigService, private log: LogService, readonly utility: UtilityService,
    private readonly db: DbService,
  ) {
    // this.intitData()
  }

  async generateIndexFromFile(filePath: string, cTransid: string): Promise<Buffer> {
    try {
      const pdfFilePath = filePath.replace(/\.json$/, '.pdf');
      // Ensure the export directory exists
      if (!fs.existsSync(this.exportPath)) {
        fs.mkdirSync(this.exportPath, { recursive: true });
      }

      let res1 = await this.db.executeRef('get_transcript_detail', { cTransid: cTransid }, 'transcript');
      let filedata;
      filedata = res1.data[0][0]
      const transData = {
        cCasename: filedata.cCasename,
        cTVolume: filedata.cTVolume,
        dTranscribedDate: filedata.dTranscribedDate,
        cCompany: filedata.cCompany,
        cCompanyinfo: filedata.cCompanyinfo
      }
      const res = await this.generateFile(filePath, pdfFilePath, transData);
      if (res.msg === -1) {
        this.log.report(`Index generation error: ${res.error}`, this.logApplication, 'E');
        throw new Error(res.value || 'Error generating index');
      }
      this.log.report(`Index generation started for ${filePath}`, this.logApplication, 'I');

      const pdfBuffer = fs.readFileSync(pdfFilePath);
      return pdfBuffer;

    } catch (error) {
      this.log.report(`Index generation error: ${error?.message}`, this.logApplication, 'E');
      return Buffer.from(`Error generating index: ${error?.message}`, 'utf-8');
    }
  }

  generateFile(filePath: string, pdfFilePath: string, transData: any): Promise<{ msg: number, value?: string, error?: string }> {
    try {
      const pythonProcess = spawn(this.config.get('pythonV'), [
        this.config.get('PY_TRANSCRIPT_WINDEX'),
        filePath,
        pdfFilePath, transData.cCasename,transData.cTVolume, transData.dTranscribedDate,transData.cCompany, transData.cCompanyinfo
      ]);


      let dataBuffer = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        dataBuffer += data.toString();
        console.log('DATA:', data.toString());
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        console.log('ERROR:', data.toString());
      });

      return new Promise((resolve, reject) => {
        pythonProcess.on('error', (err) => {
          console.log('ERROR:', err);
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.log(`Python process exited with code ${code}`);
            resolve({ msg: -1, value: 'Invalid File format', error: `Error: The transcript does not match the expected format. Please check the draft file format.` });
            return;
          }
          resolve({ msg: 1 });
        });
      });
    } catch (error) {
      console.log('ERROR:', error);
      return Promise.resolve({ msg: -1, value: 'Failed to fetch', error: error });
    }
  }

  async generateIndex(filePath: string, cTransid: string): Promise<Buffer> {
    try {
      const json_path = `${this.config.get('REALTIME_PATH')}${filePath}`;
      return await this.generateIndexFromFile(json_path, cTransid);

      const data = JSON.parse(fs.readFileSync(`${this.config.get('REALTIME_PATH')}${filePath}`, 'utf-8'));
      const wordMap: Record<string, { pageno: number, lineno: number }[]> = {};

      // Process all lines to extract words and their positions
      for (const line of data) {
        const words = line.linetext.split(/\s+/).map(word => this.cleanWord(word)).filter(Boolean);

        for (const word of words) {
          // Skip words that should be excluded
          if (word.length < 2) continue; // Skip single-character words
          if (this.helpingVerbs.has(word)) continue;
          if (this.stopWords.has(word)) continue;
          if (!/^[a-zA-Z]/.test(word)) continue;
          if (!wordMap[word]) wordMap[word] = [];

          // Check if this reference already exists (to avoid duplicates on same line)
          const alreadyExists = wordMap[word].some(
            ref => ref.pageno === line.pageno && ref.lineno === line.lineno
          );

          if (!alreadyExists) {
            wordMap[word].push({ pageno: line.pageno, lineno: line.lineno });
          }
        }
      }

      // Generate HTML for index
      let res = await this.db.executeRef('get_transcript_detail', { cTransid: cTransid }, 'transcript');
      let filedata;
      console.log('res', JSON.stringify(res));
      filedata = res.data[0][0]
      console.log('filedata', filedata);

      const indexHtml = this.generateIndexHtml(wordMap, filedata);
      const htmlFilePath = `${this.exportPath}index_temp.html`;
      const pdfFilePath = `${this.exportPath}index_temp.pdf`;

      fs.writeFileSync(htmlFilePath, indexHtml);
      await this.convertHtmlToPdf(htmlFilePath, pdfFilePath);

      // const pdfBuffer = fs.readFileSync(pdfFilePath);

      // Clean up temp files
      // fs.unlinkSync(htmlFilePath);
      // fs.unlinkSync(pdfFilePath);

      // return pdfBuffer;
    } catch (error) {
      this.log.report(`Index generation error: ${error?.message}`, this.logApplication, 'E');
      throw error;
    }
  }


  distributeContentPageWise(
    grouped: Record<string, [string, { pageno: number, lineno: number }[]][]>,
    columnsPerPage: number
  ): string[][] {
    const pages: string[][] = [];

    // Height calculations per element type - optimized based on canvas measurements
    const BASE_TERM_HEIGHT = 13;
    const BASE_REF_HEIGHT = 6;
    const LETTER_HEIGHT = 16;
    const MAX_COLUMN_HEIGHT = 1250; // Adjusted for header and footer as in your working code

    // Column width calculations for text wrapping
    const PAGE_WIDTH = 794;
    const COLUMN_WIDTH = PAGE_WIDTH / columnsPerPage;
    const COLUMN_PADDING = 20; // 8px on each side
    const AVAILABLE_COLUMN_WIDTH = COLUMN_WIDTH - COLUMN_PADDING;

    // Create canvas for text measurements
    const canvas = createCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    ctx.font = '8pt "Times New Roman"'; // Match CSS font

    // Accurate term width calculation using canvas
    const calculateTermWidth = (word: string): number => {
      ctx.font = 'bold 8pt "Times New Roman"'; // Terms are bold
      return ctx.measureText(word).width + 4; // Add 4px margin
    };

    // Calculate reference width using canvas
    const calculateRefWidth = (ref: { pageno: number, lineno: number }): number => {
      ctx.font = '8pt "Times New Roman"'; // References are normal weight
      const refText = `${ref.pageno}:${ref.lineno}`;
      return ctx.measureText(refText).width + 3; // Add 3px spacing
    };

    // Calculate how references will wrap and their resulting height
    const calculateRefsHeight = (word: string, refs: { pageno: number, lineno: number }[]): number => {
      if (refs.length === 0) return 0;

      // Calculate term width
      const termWidth = calculateTermWidth(word);

      // Available width for references on first line (after term)
      const firstLineWidth = AVAILABLE_COLUMN_WIDTH - termWidth;

      // Subsequent lines have full column width
      const fullLineWidth = AVAILABLE_COLUMN_WIDTH;

      let currentLineWidth = 0;
      let currentLine = 1;
      let isFirstLine = true;

      // Process each reference to determine line breaks
      for (let i = 0; i < refs.length; i++) {
        const refWidth = calculateRefWidth(refs[i]);
        const spaceWidth = ctx.measureText(' ').width;

        // Add space before reference (except first ref on a line)
        if (currentLineWidth > 0) {
          currentLineWidth += spaceWidth;
        }

        // If reference won't fit on current line, move to next line
        if (currentLineWidth + refWidth > (isFirstLine ? firstLineWidth : fullLineWidth)) {
          currentLine++;
          currentLineWidth = refWidth;
          isFirstLine = false;
        } else {
          currentLineWidth += refWidth;
        }
      }

      // Calculate total height based on line count
      return BASE_TERM_HEIGHT + ((currentLine - 1) * BASE_REF_HEIGHT);
    };

    // Flatten all content into a single array of elements
    const flattenContent = () => {
      // Array of all elements (letter headings, terms, references)
      const elements: Array<{
        type: 'letter' | 'term' | 'reference',
        content: string, // HTML content
        height: number,
        letter?: string,
        isFirstTermInLetter?: boolean,
        word?: string // Track word for better continuation handling
      }> = [];

      // Process each letter group
      for (const letter of Object.keys(grouped).sort()) {
        // Add letter heading
        elements.push({
          type: 'letter',
          content: `<div class="letter-heading">${letter}</div>`,
          height: LETTER_HEIGHT,
          letter: letter
        });

        // Process each word in this letter group
        const wordsInThisLetter = grouped[letter];
        for (let i = 0; i < wordsInThisLetter.length; i++) {
          const [word, refs] = wordsInThisLetter[i];
          if (refs.length === 0) continue;

          // Flag to track if this is the first term after a letter heading
          const isFirstTermInLetter = i === 0;

          // Calculate accurate height using canvas measurements
          const entryHeight = calculateRefsHeight(word, refs);

          // Create term with first reference
          // Add line break before term if it's not the first term after a letter heading
          const lineBreak = isFirstTermInLetter ? '' : '<br>';
          const termHtml = `${lineBreak}<span class="term" style="display: inline;">${word}</span> ` +
            `<span class="ref-item" style="display: inline;">${refs[0].pageno}:${refs[0].lineno}</span> `;

          elements.push({
            type: 'term',
            content: termHtml,
            height: BASE_TERM_HEIGHT + (isFirstTermInLetter ? 0 : 4), // Add line break height
            isFirstTermInLetter,
            word
          });

          // Add remaining references as individual elements
          for (let j = 1; j < refs.length; j++) {
            const refHtml = `<span class="ref-item" style="display: inline;">${refs[j].pageno}:${refs[j].lineno}</span> `;

            elements.push({
              type: 'reference',
              content: refHtml,
              height: BASE_REF_HEIGHT,
              word // Track word for each reference
            });
          }
        }
      }

      return elements;
    };

    const elements = flattenContent();

    // Variables to track current state
    let currentPageIndex = 0;
    let currentColumnIndex = 0;
    let currentColumnContent = '';
    let currentColumnHeight = 0;
    let lastLetterShown = '';
    let lastWordShown = '';

    // Initialize first page
    pages[0] = new Array(columnsPerPage).fill('');

    // Improved distribution algorithm with look-ahead for better column breaks
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const nextElement = i < elements.length - 1 ? elements[i + 1] : null;

      // Special logic to avoid small gaps at bottom of columns
      // If this element is a reference and the next is a term, consider moving both
      // to avoid awkward breaks with small gaps
      const isCurrentElementRef = element.type === 'reference';
      const isNextElementTerm = nextElement && nextElement.type === 'term';
      const remainingHeight = MAX_COLUMN_HEIGHT - currentColumnHeight;
      const wouldLeaveSmallGap = remainingHeight - element.height < 20 && remainingHeight - element.height > 0;

      // If we're about to leave a small gap and the next element is a new term,
      // it's better to move to the next column
      if (isCurrentElementRef && isNextElementTerm && wouldLeaveSmallGap) {
        // Move to next column
        pages[currentPageIndex][currentColumnIndex] = currentColumnContent;

        currentColumnIndex++;
        if (currentColumnIndex >= columnsPerPage) {
          currentPageIndex++;
          currentColumnIndex = 0;
          pages[currentPageIndex] = new Array(columnsPerPage).fill('');
        }

        // Reset column tracking
        currentColumnContent = '';
        currentColumnHeight = 0;

        // Reset letter tracking if needed
        if (currentColumnIndex === 0) {
          lastLetterShown = '';
        }

        continue; // Reconsider this element for the new column
      }

      // Regular overflow check
      if (currentColumnHeight + element.height > MAX_COLUMN_HEIGHT) {
        // Save column and move to next
        pages[currentPageIndex][currentColumnIndex] = currentColumnContent;

        currentColumnIndex++;
        if (currentColumnIndex >= columnsPerPage) {
          currentPageIndex++;
          currentColumnIndex = 0;
          pages[currentPageIndex] = new Array(columnsPerPage).fill('');
        }

        // Reset column tracking
        currentColumnContent = '';
        currentColumnHeight = 0;

        // Reset letter tracking if on a new page
        if (currentColumnIndex === 0) {
          lastLetterShown = '';
          lastWordShown = '';
        }

        continue; // Reconsider this element for the new column
      }

      // Process different element types
      if (element.type === 'letter') {
        // Only add letter heading if it's different from the last one shown
        if (element.letter !== lastLetterShown) {
          currentColumnContent += element.content;
          currentColumnHeight += element.height;
          lastLetterShown = element.letter;
        }
      }
      // Handle terms
      else if (element.type === 'term') {
        currentColumnContent += element.content;
        currentColumnHeight += element.height;
        if (element.word) {
          lastWordShown = element.word;
        }
      }
      // Handle references
      else {
        // If this reference belongs to a different word, add the term again for clarity
        if (element.word && element.word !== lastWordShown && element.word) {
          if (lastWordShown !== '') {
            // Add line break and term
            currentColumnContent += `<br><span class="term" style="display: inline;">${element.word}</span> `;
            currentColumnHeight += 4; // Height for line break
          }
          lastWordShown = element.word;
        }

        // Add the reference
        currentColumnContent += element.content;
        currentColumnHeight += element.height;
      }
    }

    // Save the last column
    if (currentColumnContent.trim() !== '') {
      pages[currentPageIndex][currentColumnIndex] = currentColumnContent;
    }

    return pages;
  }

  /**
   * Generates HTML for index with configurable layout settings
   */
  generateIndexHtml(wordMap: Record<string, { pageno: number, lineno: number }[]>, filedata: any): string {
    // **CONFIGURABLE VARIABLES** - Adjust these to control layout
    const PAGE_WIDTH = 794;        // Page width in pixels
    const PAGE_HEIGHT = 1050;      // Page height in pixels  
    const PAGE_PADDING = 80;       // Total padding (top + bottom)
    const HEADER_HEIGHT = 50;      // Height for the header
    const FOOTER_HEIGHT = 30;      // Height for the footer

    // Calculated values based on configuration
    const availableHeight = PAGE_HEIGHT - PAGE_PADDING - HEADER_HEIGHT - FOOTER_HEIGHT;

    // Sort words alphabetically
    const sortedWords = Object.keys(wordMap).sort();

    // Group words by first letter
    const grouped: Record<string, [string, { pageno: number, lineno: number }[]][]> = {};

    for (const word of sortedWords) {
      const letter = word[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push([word, wordMap[word]]);
    }

    // Configuration for layout
    const columnsPerPage = 4;

    // Begin HTML template with configurable styling
    let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Transcript Word Index</title>
<style>
  @page {
    size: 794px 1123px;
    margin: 40px;
  }


  p,pre,div,span{
  font-family: "Times New Roman", Times, serif;
  }
  
  body {
    font-family: "Times New Roman", Times, serif;
    margin: 0;
    padding: 0;
    line-height: 1.2;
    font-size: 9pt;
    width: 794px;
  }
  
  .page {
    page-break-after: always;
    position: relative;
    width: 794px;
    height: 1100px;
    box-sizing: border-box;
    padding: 40px 40px;
    overflow: hidden; /* Prevent any page overflow */
  }
  
  .page:last-child {
    page-break-after: avoid;
  }
  
  .page-header {
    font-size: 8pt;
    margin-bottom: 10px;
    padding-bottom: 3px;
    position: relative;
    height: ${HEADER_HEIGHT + 5}px;
border-bottom: 1px solid #c2c2c2;
  }
  
  .header-left {
    text-align: left;
    width: 49%;
    display: inline-block;
    height: 100%;
    vertical-align: top;
  }
  
  .header-right {
    text-align: right;
    width: 50%;
    display: inline-block;
    height: 100%;
    vertical-align: top;
  }
  
  .page-footer {
    font-size: 8pt;
    padding-top: 10px;
    margin-top: 10px;
    height: ${FOOTER_HEIGHT - 10}px;
    border-top: 1px solid #c2c2c2;
    display: flex;
    justify-content: space-between;
  }
  
  .footer-left {
    text-align: left;
    width: 49%;
    display: inline-block;
    height: 100%;
    vertical-align: top;
  }
  
  .footer-right {
    width: 50%;
    display: inline-block;
    text-align: right;
    height: 100%;
    vertical-align: top;
  }
  
  .letter-heading {
    font-weight: bold;
    font-size: 11pt;
    margin: 2px 0 1px 0;
    text-decoration: underline;
    line-height: 1.1;
    display: block;
  }
  
  .term {
    font-weight: bold;
    display: inline;
    margin-right: 1mm;
  }
  
  .ref-item {
    display: inline;
    padding-right: 3px; /* Space between references */
  }
  
  .index-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    height: ${availableHeight}px;
    border: 1px solid #c2c2c2;
  }
  
  .index-table td {
    vertical-align: top;
    width: 25%;
    padding: 10px 8px;
    border-right: 1pt solid #c2c2c2;
    height: ${availableHeight}px;
    max-height: ${availableHeight}px;
    overflow: hidden;
    word-wrap: break-word;
    position: relative;
  }
  
  .index-table td:last-child {
    border-right: none;
  }
  
  .column-content {
    height: ${availableHeight}px;
    max-height: ${availableHeight}px;
    overflow: hidden;
    word-wrap: break-word;
  }

  pre{
  margin: 0;
  white-space: pre-line;
  }
</style>
</head>
<body>`;

    // Distribute content across pages and columns with canvas-based measurements
    const pages = this.distributeContentPageWise(grouped, columnsPerPage);

    // Generate current date for header/footer
    const currentDate = new Date().toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate pages with headers and footers
    for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
      const pageContent = pages[pageIdx];
      const pageNumber = pageIdx + 1;
      const totalPages = pages.length;

      html += `
<div class="page">
<!-- Page Header -->
<div class="page-header">
  <div class="header-left"><pre> ${filedata?.cCasename}</pre></div>
  <div class="header-right">
    <div>${filedata?.cTVolume}</div>
    <div>${new Date(filedata?.dTranscribedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
     <div style="text-align: right;font-size: 8pt;">Page ${pageNumber}</div>
  </div>
</div>

<!-- Page Content -->
<table class="index-table">
  <tr>`;
      // Add columns for this page
      for (let colIdx = 0; colIdx < columnsPerPage; colIdx++) {
        const columnContent = pageContent[colIdx] || '';
        // Wrap content in a container div for better overflow control
        html += `<td><div class="column-content">${columnContent}</div></td>`;
      }

      html += `
  </tr>
</table>

<!-- Page Footer -->
<div class="page-footer">
  <div class="footer-left">${filedata?.cCompany}</div>
  <div class="footer-right">${filedata?.cCompanyinfo} </div>
 
</div>
</div>`;
    }

    html += `
</body>
</html>`;

    return html;
  }


  cleanWord(word: string) {
    // More comprehensive cleaning
    return word.toLowerCase()
      .replace(/[^\w]/g, '')  // Remove non-word characters
      .replace(/^\d+$/, '');  // Remove words that are just numbers
  }


  isNumeric(str: string): boolean {
    return /^\d+(\.\d+)?$/.test(str);
  }


  async convertHtmlToPdf(htmlFilePath: string, outputPdfPath: string): Promise<void> {
    try {
      const wkhtmltopdfOptions = [
        '--page-size A4',
        '--margin-top 0',
        '--margin-right 0',
        '--margin-bottom 0',
        '--margin-left 0',
        '--encoding UTF-8',
        '--enable-local-file-access',
        '--print-media-type',
        '--disable-smart-shrinking',
        '--header-spacing 5',
        '--footer-spacing 5'
      ].join(' ');

      const command = `wkhtmltopdf ${wkhtmltopdfOptions} "${htmlFilePath}" "${outputPdfPath}"`;

      await execAsync(command);
      this.log.report(`PDF generated successfully: ${outputPdfPath}`, this.logApplication, 'I');
    } catch (error) {
      this.log.report(`wkhtmltopdf conversion error: ${error?.message}`, this.logApplication, 'E');
      throw error;
    }
  }

}
