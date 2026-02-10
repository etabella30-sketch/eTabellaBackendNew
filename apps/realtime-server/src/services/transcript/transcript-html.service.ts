import { Injectable } from '@nestjs/common';
import { ThemeCssService } from './theme-css.service';
import { HFDetails, ThemeConfig, TranscriptBuilder, TranscriptFormDataDto, TranscriptLineDto } from '../../interfaces/Transcript.interface';
import { UtilityService } from '../utility/utility.service';
import { createCanvas } from 'canvas';

@Injectable()
export class TranscriptHtmlService {
  constructor(private readonly themeCssService: ThemeCssService,
    private readonly utilityService: UtilityService
  ) { }

  // Constants for page dimensions and constraints
  private A4_HEIGHT_PX = 1123; // A4 height at 96 DPI (297mm)
  private PAGE_PADDING = 80; // Total top/bottom padding
  private DIVIDER_HEIGHT = 21; // Height of each divider (1px line + 10px margin-top + 10px margin-bottom)
  private DIVIDER_COUNT = 3; // Number of dividers between sections

  private generatePages(lines: TranscriptLineDto[], type: '4UP' | 'FST'): Array<{ page: number[] }> {
    if (!lines.length) return [];

    const noOfPages = lines.reduce((max, curr) => Math.max(max, curr.pageno), 0);
    const pages = Array.from({ length: noOfPages }, (_, i) => i + 1);

    // Collect pages that contain at least one isIndex: true
    const indexPages = new Set(
      lines.filter(line => line.isIndex).map(line => line.pageno)
    );
    if (type === '4UP') {
      return pages.reduce((acc, curr, i) => {
        if (i % 4 === 0) {
          const groupTemplate = [curr, curr + 2, curr + 1, curr + 3];
          const finalGroup = groupTemplate.map(p => (p <= pages.length ? p : null));
          acc.push({ page: finalGroup });
        }
        return acc;
      }, []);

      // return pages.reduce((acc, curr, i) => {
      //   if (i % 4 === 0) {
      //     // acc.push({
      //     //   page: [curr, curr + 1, curr + 2, curr + 3].filter(p => p <= pages.length)
      //     // });
      //     const group = [curr, curr + 2, curr + 1, curr + 3]
      //       .filter(p => p <= pages.length);

      //     while (group.length < 4) {
      //       group.push(null); // or `null` or 0 based on your need
      //     }

      //     acc.push({ page: group });
      //   }
      //   return acc;
      // }, []);

      // const result: Array<{ page: number[] }> = [];
      // for (let i = 0; i < pages.length; i += 4) {
      //   const group = pages.slice(i, i + 4);
      //   group.forEach(p => {
      //     if (indexPages.has(p)) {
      //       result.push({ page: [p] }); // Add index pages as single-page groups
      //     }
      //   });
      //   // If any page in the group is an index page, skip the group and add each index page separately
      //   if (group.some(p => indexPages.has(p))) {
      //     group.forEach(p => {
      //       if (indexPages.has(p)) {
      //         result.push({ page: [p] }); // Add index pages as single-page groups
      //       }
      //     });
      //   } else {
      //     result.push({ page: group });
      //   }
      // }
      // return result;
    } else {
      return pages.map(page => ({ page: [page] }));
    }
  }

  private getLines(lines: TranscriptLineDto[], page: number, maxLineno: number): TranscriptLineDto[] {
    let res = lines.filter(line => line.pageno === page)
    if (res.length === maxLineno) {
      return res;
    } else if (res.length < maxLineno) {
      const missingLines = maxLineno - res.length;
      const lastLine = res[res.length - 1];
      for (let i = 0; i < missingLines; i++) {
        res.push({
          pageno: page,
          lineno: null,
          linetext: '',
          timestamp: ''
        });
      }
    }
    return res;
  }

  private formatDate(date: Date | string, format: string): string {
    if (!date) return '';
    const d = new Date(date);

    switch (format) {
      case 'EEEE, d MMMM, yyyy':
        return d.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      case 'dd MMM yyyy':
        return d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      default:
        return d.toLocaleDateString();
    }
  }

  private detectPosition(formData: TranscriptBuilder, theme: ThemeConfig): HFDetails {
    const HFDetails: HFDetails = {
      TL: { value1: '', value2: '' },
      TR: { value1: '', value2: '' },
      BL: { value1: '', value2: '' },
      BR: { value1: '', value2: '' }
    };

    // Map positions based on theme settings
    const positions = {
      [theme?.cPCaseName || '']: {
        value1: formData?.cTitle || ''
      },
      [theme?.cPVolumeDate || '']: {
        value1: `${formData?.cTVolume || '#'}`,
        value2: this.formatDate(formData?.dTranscribedDate, 'dd MMM yyyy')
      },
      [theme?.cPCompany || '']: {
        value1: formData?.cCompany || ''
      },
      [theme?.cPCompanyInfo || '']: {
        value1: formData?.cCompanyinfo || ''
      }
    };

    // Update HFDetails for all positions
    (['TL', 'TR', 'BL', 'BR'] as const).forEach(position => {
      if (positions[position]) {
        HFDetails[position].value1 = positions[position].value1 || '';
        HFDetails[position].value2 = positions[position].value2 || '';
      }
    });

    return HFDetails;
  }

  private generatePageNumber(theme: ThemeConfig, pageIndex: number): string {
    if (theme?.cPNPosition === 'B') {
      return `[Page ${pageIndex + 1}]`;
    } else if (theme?.cPNPosition === 'P') {
      return `Page ${pageIndex + 1}`;
    } else {
      return `Page | ${pageIndex + 1}`;
    }
  }

  private calculatePreHeight(text: string, theme: ThemeConfig, width?: number): number {
    const fontFamily = theme?.nBFont ?
      this.themeCssService['fontOptions'].find(f => f.nValue == theme?.nBFont)?.jOther.font || 'courier' :
      'courier';
    const fontSize = theme?.nBFontsize || 17;
    const letterSpacing = theme?.nBLetterspacing || 0.5;
    const lineHeight = 1.2; // Standard line height multiplier
    const containerWidth = width || 554; // Based on your CSS
    const padding = 0; // padding
    const availableWidth = containerWidth - padding;

    // Approximate character width based on font
    let charWidth = fontSize * 0.6; // rough approximation
    if (fontFamily.includes('Courier')) {
      charWidth = fontSize * 0.6; // monospace
    } else if (fontFamily.includes('Times')) {
      charWidth = fontSize * 0.5; // serif
    } else {
      charWidth = fontSize * 0.55; // sans-serif
    }

    // Calculate effective character width including letter spacing
    const effectiveCharWidth = charWidth + letterSpacing;
    const charsPerLine = Math.floor(availableWidth / effectiveCharWidth);

    // Handle empty text
    if (!text || text.length === 0) {
      return fontSize * lineHeight;
    }

    // Split by newlines first (pre elements preserve newlines)
    const lines = text.split('\n');
    let totalLines = 0;

    lines.forEach(line => {
      if (line.length === 0) {
        // Empty line in pre element
        totalLines += 1;
        return;
      }

      // For pre elements, we need to preserve spaces
      // Don't split by spaces, instead process the line as-is
      const lineLength = line.length; // All characters including spaces count

      if (lineLength <= charsPerLine) {
        // Line fits in container
        totalLines += 1;
      } else {
        // Line needs wrapping - break preserving word boundaries when possible
        const wrappedLines = this.wrapLinePreservingSpaces(line, charsPerLine);
        totalLines += wrappedLines;
      }
    });

    // Calculate total height
    const lineHeightPx = fontSize * lineHeight;
    return totalLines * lineHeightPx;
  }

  private wrapLinePreservingSpaces(line: string, charsPerLine: number): number {
    if (line.length === 0) return 1;
    if (charsPerLine <= 0) return Math.ceil(line.length); // Fallback

    let lineCount = 0;
    let currentPos = 0;

    while (currentPos < line.length) {
      let endPos = currentPos + charsPerLine;

      // If we're not at the end of the string, try to find a better break point
      if (endPos < line.length) {
        const breakPos = this.findBetterBreakPoint(line, currentPos, endPos);
        endPos = breakPos;
      } else {
        // We're at the end, take the rest
        endPos = line.length;
      }

      // Ensure we advance at least one character to avoid infinite loop
      if (endPos <= currentPos) {
        endPos = currentPos + 1;
      }

      lineCount++;
      currentPos = endPos;
    }

    return lineCount || 1;
  }

  private findBetterBreakPoint(line: string, start: number, maxEnd: number): number {
    // Don't search too far back to avoid very short lines
    const minSearch = Math.max(start, maxEnd - Math.floor((maxEnd - start) * 0.3));

    // Look backwards from maxEnd to find a good break point
    for (let i = maxEnd - 1; i >= minSearch; i--) {
      const char = line[i];

      // Break after space (this preserves the space on the current line)
      if (char === ' ') {
        return i + 1;
      }

      // Break after punctuation
      if ([',', '.', ';', ':', '!', '?', ')', ']', '}', '-'].includes(char)) {
        return i + 1;
      }
    }

    // No good break point found, use the original position
    return maxEnd;
  }

  private calculateDynamicGap(contentHeight: number, totalLines: number, availableHeight: number): number {
    // Calculate total number of gaps needed (gaps between lines)
    const totalGaps = totalLines > 1 ? totalLines - 1 : 0;

    // Calculate space taken by dividers
    const dividerSpace = this.DIVIDER_COUNT * this.DIVIDER_HEIGHT;

    // Calculate content space (excluding dividers)
    const contentSpace = contentHeight - dividerSpace;

    // Calculate remaining space after content and dividers
    const remainingSpace = availableHeight - contentSpace - dividerSpace;

    // Calculate gap size - distribute remaining space for all line gaps
    let dynamicGap = totalGaps > 0 ? Math.floor(remainingSpace / totalGaps) : 3;

    // Apply constraints
    if (dynamicGap < 3) {
      return 3;
    } else if (dynamicGap > 10) {
      return 10;
    }

    return dynamicGap;
  }

  private detectLineBreak(linetext: string, theme: ThemeConfig): boolean {
    const height = this.calculatePreHeight(linetext, theme);
    const singleLineHeight = (theme?.nBFontsize || 17) * 1.2; // Single line height
    return height > singleLineHeight;
  }

  /**
   * Function to split content based on available lines
   */
  private splitContent(contentLines: string[], maxLines: number): [string[], string[]] {
    maxLines = Math.min(maxLines, contentLines.length);
    return [contentLines.slice(0, maxLines), contentLines.slice(maxLines)];
  }

  /**
   * Generate HTML for appearances section
   */
  private generateAppearancesHtml(contentLines: string[]): string {
    let hasSeenClaimantHeader = false;
    let hasSeenRespondentHeader = false;

    return contentLines.map(line => {
      if (line.includes('On Behalf of Claimant')) {
        hasSeenClaimantHeader = true;
        return `<pre id="cBClaimentH" style="font-style:italic;">${line}</pre>`;
      }

      if (line.includes('On Behalf of Respondent')) {
        hasSeenRespondentHeader = true;
        return `<pre id="cBRespondentH" style="font-style:italic;">${line}</pre>`;
      }
      let className = 'customfont';
      if (!hasSeenClaimantHeader) {
        className = 'cBClaiment';
      } else if (hasSeenClaimantHeader && !hasSeenRespondentHeader) {
        className = 'cBRespondent';
      }

      return `<pre class="${className}">${line}</pre>`;
    }).join('');
  }

  coverPglength: number = 1;

  /**
   * Generate title page(s) with pagination
   */
  private generateTitlePages(formData: any, theme: ThemeConfig, hostorigin: string): string {
    // Get font size and calculate line height
    const fontSize = theme?.nCFontsize || 12;
    const coverlinespacing = formData?.nCSpacing || 1.2; // Default line height multiplier
    const lineHeight = fontSize * coverlinespacing;

    const IsShowBrand = theme.bLMbrand ? true : false;
    this.PAGE_PADDING = IsShowBrand ? 40 : 80; // Adjust padding based on brand visibility 


    // Parse and count lines for each section
    const titleLines = formData?.cCasetype?.split('\n') || [' '];
    const arbitratorLines = formData?.cArbitrator?.split('\n') || [' '];
    const claimantLines = formData?.cClaiment?.split('\n') || [' '];
    const respondentLines = formData?.cRespondent?.split('\n') || [' '];

    // Generate HTML for fixed sections
    const arbitratorHtml = arbitratorLines.map(line => `<pre class="cArbitrator">${line}</pre>`).join('') || '';
    const claimantHtml = claimantLines.map(line => `<pre class="cClaiment">${line}</pre>`).join('') || '';
    const respondentHtml = respondentLines.map(line => `<pre class="cRespondent">${line}</pre>`).join('') || '';

    // Process appearance content
    // const appearanceLines = [
    //   ...(formData?.cBClaiment?.split('\n').filter(line => line.trim().length > 0) || []),
    //   formData?.cBClaimentH ? formData.cBClaimentH : '',
    //   ...(formData?.cBRespondent?.split('\n').filter(line => line.trim().length > 0) || []),
    //   formData?.cBRespondentH ? formData.cBRespondentH : ''
    // ].filter(Boolean);



    // Combine only appearance-related content
    if (!formData?.cBClaiment || formData.cBClaiment == '') { formData.cBClaiment = ' \r ' }
    if (!formData?.cBRespondent || formData?.cBRespondent == '') { formData.cBRespondent = ' \r ' }
    const appearanceLines = [
      ...(formData?.cBClaiment?.split('\n') || [' ']),
      formData?.cBClaimentH ? `<pre id="cBClaimentH">${formData.cBClaimentH}</pre>` : '',
      ...(formData?.cBRespondent?.split('\n') || [' ']),
      formData?.cBRespondentH ? `<pre id="cBRespondentH">${formData.cBRespondentH}</pre>` : ''
    ];


    // Count lines in each section
    const headerLineCount = titleLines.length + 1; // +1 for case number
    const partiesLineCount = 1 + 1 + claimantLines.length + 1 + respondentLines.length; // Between + claimant + and + respondent
    const arbitratorLineCount = 1 + arbitratorLines.length + 2; // Before + arbitrator + day + date
    // Get gap values from theme or use defaults

    const headerGap = 10;
    const betweenGap = 10;
    const beforeGap = 10;
    const appearanceGap = 10;

    // Calculate space requirements
    const dividerSpace = this.DIVIDER_COUNT * this.DIVIDER_HEIGHT;
    const headerSpace = (headerLineCount * lineHeight) + ((headerLineCount - 1) * headerGap);
    const partiesSpace = (partiesLineCount * lineHeight) + ((partiesLineCount - 1) * betweenGap);
    const arbitratorSpace = (arbitratorLineCount * lineHeight) + ((arbitratorLineCount - 1) * beforeGap);

    // Calculate available height
    const availableHeight = this.A4_HEIGHT_PX - this.PAGE_PADDING;

    // Calculate space used by fixed sections
    const fixedContentSpace = headerSpace + partiesSpace + arbitratorSpace + dividerSpace;




    // Calculate remaining space for appearances
    const remainingSpace = availableHeight - fixedContentSpace;

    // Calculate how many appearance lines can fit on first page
    const appearanceLineHeight = lineHeight; // Each line plus gap
    const maxAppearanceLines = Math.floor(remainingSpace / appearanceLineHeight);

    // Split appearance content between pages
    const [firstPageAppearances, remainingAppearances] = this.splitContent(appearanceLines, maxAppearanceLines);

    // Generate HTML for first page appearances
    const firstPageAppearancesHtml = this.generateAppearancesHtml(firstPageAppearances);

    // Generate HTML for first page
    const firstPageHtml = `
      <div class="titlepage page page-break mb-3 bg-white ${IsShowBrand ? 'showBrand' : ''} ">
        <div class="flex flex-col cover-inner" >
          <div class="titlepage-header">
            <pre id="cCasetype" class="text-1 customfont">${formData?.cCasetype || ''}</pre>
            <pre id="cCCaseno" class="text-1 customfont">${formData?.cCCaseno || ''}</pre>
          </div>
          <div class="divider"></div>
          <div class="parties">
            <p class="text-center betweeen" style="${IsShowBrand ? 'color:#F26522' : ''}">Between:</p>
            <div> 
          ${claimantHtml}
          </div>
            <p id="cClaimentH" class="customfont " style="font-weight:400 !important; font-style:italic; ${IsShowBrand ? 'color:#F26522' : ''}">[${formData?.cClaimentH || 'Example Claimant ABC'}]</p>  
            <div> 
            ${respondentHtml}
             </div>
            <p id="cRespondentH" class="customfont" style="font-weight:400 !important; font-style:italic;${IsShowBrand ? 'color:#F26522' : ''}">[${formData?.cRespondentH || 'Example Respondent XYZ'}]</p>

          </div>
          <div class="divider"></div>
          <div class="before">
            <p>&nbsp;&nbsp;Before&nbsp;&nbsp;</p>
           <div> 
            ${arbitratorHtml}
             </div>
            <pre class="customfont" id="cCDay">${formData?.cCDay || '#'}</pre>
            <p class="customfont" id="dCDate">${this.formatDate(formData?.dCDate, 'EEEE, d MMMM, yyyy')}</p>
          </div>
          <div class="divider"></div>
          <div class="appear">
            ${firstPageAppearancesHtml}
          </div>
        </div>
          <img src="${hostorigin}/assets/bglayer.png"  class="bg-layer" style="${IsShowBrand ? '' : 'display: none;'}">


        <div class="brand" style="width:40px;height:100%;${IsShowBrand ? '' : 'display: none;'}">
            <div class="bar"></div>
          <div class="brand-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 0V40H40V0H0ZM8.72772 31.4772C7.80168 31.4772 7.04774 30.7232 7.04774 29.7972C7.04774 28.8711 7.80168 28.1254 8.72772 28.1254C9.65376 28.1254 10.4077 28.8711 10.4077 29.7972C10.4077 30.7232 9.65376 31.4772 8.72772 31.4772ZM16.6114 31.4772C15.6853 31.4772 14.9232 30.7232 14.9232 29.7972C14.9232 28.8711 15.6771 28.1254 16.6114 28.1254C17.5456 28.1254 18.2831 28.8711 18.2831 29.7972C18.2831 30.7232 17.5374 31.4772 16.6114 31.4772ZM24.4868 31.4772C23.5607 31.4772 22.8068 30.7232 22.8068 29.7972C22.8068 28.8711 23.5607 28.1254 24.4868 28.1254C25.4128 28.1254 26.1668 28.8711 26.1668 29.7972C26.1668 30.7232 25.4128 31.4772 24.4868 31.4772ZM31.5755 31.4772C30.6413 31.4772 29.8955 30.7232 29.8955 29.7972C29.8955 28.8711 30.6413 28.1254 31.5755 28.1254C32.5097 28.1254 33.2555 28.8711 33.2555 29.7972C33.2555 30.7232 32.5015 31.4772 31.5755 31.4772Z" fill="#F26522"/>
</svg>

        </div>
        </div>
      </div>
    `;

    // Generate continuation pages if needed
    const continuationPages = [];
    let currentPageAppearances = remainingAppearances;

    while (currentPageAppearances.length > 0) {
      // Calculate how many lines can fit on continuation page
      const continuationMaxLines = Math.floor((availableHeight - 40) / appearanceLineHeight);

      // Split content for this page
      const [pageContent, nextPageContent] = this.splitContent(currentPageAppearances, continuationMaxLines);

      // Generate HTML for this continuation page
      const pageAppearancesHtml = this.generateAppearancesHtml(pageContent);

      // Add continuation page
      continuationPages.push(`
        <div class="titlepage page page-break mb-3 bg-white ${IsShowBrand ? 'showBrand' : ''}" >
          <div class="flex flex-col cover-inner" >
            <div class="appear">
              ${pageAppearancesHtml}
            </div>
          </div>
<img src="assets/bglayer.png"  class="bg-layer" style="${IsShowBrand ? '' : 'display: none;'}">

        <div class="brand" style="width:40px;height:100%;${IsShowBrand ? '' : 'display: none;'}">
            <div class="bar"></div>
          <div class="brand-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 0V40H40V0H0ZM8.72772 31.4772C7.80168 31.4772 7.04774 30.7232 7.04774 29.7972C7.04774 28.8711 7.80168 28.1254 8.72772 28.1254C9.65376 28.1254 10.4077 28.8711 10.4077 29.7972C10.4077 30.7232 9.65376 31.4772 8.72772 31.4772ZM16.6114 31.4772C15.6853 31.4772 14.9232 30.7232 14.9232 29.7972C14.9232 28.8711 15.6771 28.1254 16.6114 28.1254C17.5456 28.1254 18.2831 28.8711 18.2831 29.7972C18.2831 30.7232 17.5374 31.4772 16.6114 31.4772ZM24.4868 31.4772C23.5607 31.4772 22.8068 30.7232 22.8068 29.7972C22.8068 28.8711 23.5607 28.1254 24.4868 28.1254C25.4128 28.1254 26.1668 28.8711 26.1668 29.7972C26.1668 30.7232 25.4128 31.4772 24.4868 31.4772ZM31.5755 31.4772C30.6413 31.4772 29.8955 30.7232 29.8955 29.7972C29.8955 28.8711 30.6413 28.1254 31.5755 28.1254C32.5097 28.1254 33.2555 28.8711 33.2555 29.7972C33.2555 30.7232 32.5015 31.4772 31.5755 31.4772Z" fill="#F26522"/>
</svg>
        </div>
        </div>
        </div>
      `);

      // Set up for next iteration
      currentPageAppearances = nextPageContent;
    }
    this.coverPglength = continuationPages.length + 1; // Update cover page length to include all pages
    // Combine all pages
    return firstPageHtml + continuationPages.join('');
  }


  private generateTitlePages_2(query, theme: ThemeConfig, hostorigin: string): string {

    const IsShowBrand = theme.bLMbrand ? true : false;
    this.PAGE_PADDING = IsShowBrand ? 40 : 80; // Adjust padding based on brand visibility 


    const date = new Date();
    const options: any = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    // Generate HTML for first page
    const firstPageHtml = `
     <div class="titlepage page page-break mb-3 bg-white showBrand">
  <div class="flex flex-col cover-inner" style="justify-content:center;">
    <div class="parties">
      <p id="cClaimentH" class="customfont " style="font-weight:400 !important; font-style:italic;color:#F26522">
        [Session Name]</p>
      <div>
        <p style="font-size:20px">${query.cCasename}</p>
      </div>
      <p id="cClaimentH" class="customfont" style="font-weight:400 !important; font-style:italic;color:#F26522">[Case Name]</p>
      <div>
        <p style="font-size:20px">${query.otherCaseData.cCasename}</p>
      </div>
    </div>
    <div class="divider"></div>

    <p style="font-size:16px"> Exported By ${query.cUsername}</p>
    <pre class="customfont" id="cCDay" style="margin:10px 0px 10px 0px">On</pre>
    <p style="font-size:16px" class="customfont" id="dCDate">${formattedDate}</p>
  </div>


<img src="${hostorigin}/assets/bglayer.png" class="bg-layer" style="${IsShowBrand ? '' : 'display: none;'}">


<div class="brand" style="width:40px;height:100%;${IsShowBrand ? '' : 'display: none;'}">
  <div class="bar"></div>
  <div class="brand-logo">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 0V40H40V0H0ZM8.72772 31.4772C7.80168 31.4772 7.04774 30.7232 7.04774 29.7972C7.04774 28.8711 7.80168 28.1254 8.72772 28.1254C9.65376 28.1254 10.4077 28.8711 10.4077 29.7972C10.4077 30.7232 9.65376 31.4772 8.72772 31.4772ZM16.6114 31.4772C15.6853 31.4772 14.9232 30.7232 14.9232 29.7972C14.9232 28.8711 15.6771 28.1254 16.6114 28.1254C17.5456 28.1254 18.2831 28.8711 18.2831 29.7972C18.2831 30.7232 17.5374 31.4772 16.6114 31.4772ZM24.4868 31.4772C23.5607 31.4772 22.8068 30.7232 22.8068 29.7972C22.8068 28.8711 23.5607 28.1254 24.4868 28.1254C25.4128 28.1254 26.1668 28.8711 26.1668 29.7972C26.1668 30.7232 25.4128 31.4772 24.4868 31.4772ZM31.5755 31.4772C30.6413 31.4772 29.8955 30.7232 29.8955 29.7972C29.8955 28.8711 30.6413 28.1254 31.5755 28.1254C32.5097 28.1254 33.2555 28.8711 33.2555 29.7972C33.2555 30.7232 32.5015 31.4772 31.5755 31.4772Z"
        fill="#F26522" />
    </svg>
  </div>
</div>
</div>
    `;

    // Generate continuation pages if needed
    const continuationPages = [];
    this.coverPglength = continuationPages.length + 1; // Update cover page length to include all pages
    // Combine all pages
    return firstPageHtml + continuationPages.join('');
  }


  generateHtml(
    formData: TranscriptBuilder,
    lines: TranscriptLineDto[],
    theme: ThemeConfig,
    type: '4UP' | 'FST' = 'FST', hostorigin: string = '',
    isAnnotation: boolean = false, query: any = null, annotres: any = null,
    summaryOfAnnots = [], summaryOfHihglights = [], isSubmit: boolean = true
  ): string {

    theme.cCAlign = formData.cCAlign || 'C';
    theme.cBehalfAlign = formData?.cBehalfAlign || 'C';
    theme.nCSpacing = formData?.nCSpacing || 2;
    // Generate CSS variables from theme
    let isPagination = true;
    if (!isSubmit) {
      isPagination = query.bPagination;
      theme.bTShow = query.bTimestamp;
    }

    const cssVariables = this.themeCssService.generateCssVariables(theme);
    const cssVariablesString = this.themeCssService.generateCssVariablesString(cssVariables);

    // Generate title page with correct pagination
    const HFDetails = this.detectPosition(formData, theme);
    let titlePageHtml = null;
    if (!query?.cTranscript || query?.cTranscript == 'Y') {
      titlePageHtml = this.generateTitlePages(formData, theme, hostorigin);
    } else {
      titlePageHtml = this.generateTitlePages_2(query, theme, hostorigin);
    }
    let summaryOfAnnotContent: string = '';
    let summaryOfHihglightsContent: string = '';
    const issueAnnots = (annotres && annotres.length) && query.bQfact ? annotres[0] : [];

    if (isAnnotation) {
      summaryOfAnnotContent = this.bindIssuesIndex(summaryOfAnnots);
      summaryOfHihglightsContent = this.bindHighlightsIndex(summaryOfHihglights, theme);
    }
    //console.log('issueAnnots',issueAnnots)
    const highlights = (annotres && annotres.length) && query.bQmark ? annotres[1] : [];

    const firstPageNo = lines[0].pageno;
    const maxLineno = lines
      .filter(entry => entry.pageno === firstPageNo)
      .reduce((max, curr) => Math.max(max, curr.lineno), 0);
    const pages = this.generatePages(lines, type);
    const contentPagesHtml = pages.map((page, pageIndex) => {
      try {
        if (!isSubmit && query.jPages && query.jPages.length) {
          if (!query.jPages.includes(pageIndex + 1)) {
            console.log('skiping page', pageIndex)
            return ``
          }
        }
      } catch (error) {
        console.log('skiping page failed', error);
      }
      const curPageData = isAnnotation ? issueAnnots.filter(i => i.pageIndex == (pageIndex + 1)) : [];
      this.coverPglength = isAnnotation ? 0 : this.coverPglength;
      this.indexpagecount = isAnnotation ? 0 : this.indexpagecount;
      const pageNumberDisplay = this.generatePageNumber(theme, (pageIndex + this.coverPglength + this.indexpagecount));
      const swapClass = theme?.bPNSwap ? `swape-page-${theme?.cPNAlignRL}` : '';
      const fourUpClass = type == '4UP' ? 'fourUp-page' : '';
      let quesContinue: boolean = false;
      let pageContent = '';

      try {
        pageContent = page.page.map((pageNum) => {

          const pageLines = this.getLines(lines, pageNum, maxLineno);


          const justifyBetween = theme?.nBLinespacing === 0 ? 'justify-between' : '';
          return `
            <div style="vertical-align: top;" class="lines-wrapper ${justifyBetween}">
            <a name="page-${pageIndex + 1}" class="page-anchor"></a>
              ${page.page.length > 1 ? `
                <div style="padding-right: 10px;">
                   <h6 class="text-end secondarypageno customfont"> ${pageNum ? 'Page ' + (pageNum + this.coverPglength + this.indexpagecount) : ''}</h6>
                </div>
              ` : ''}
              
              ${pageLines.map((line, index) => {
            let matchingLine = null;
            const hasLineBreak = this.detectLineBreak(line.linetext, theme);
            const lineHeight = this.calculatePreHeight(line.linetext, theme);
            const lineBreakClass = hasLineBreak ? 'brakline' : 'nobreak';
            let questionText = line.linetext;
            [questionText, quesContinue] = this.transformQuestionOrSpicker(line.linetext, theme.jBBold, quesContinue)
            //matchingLine
            let startIndex = 0, endIndex = 0;
            debugger;
            // if (matchingLine) {
            //   startIndex = matchingLine.startIndex;
            //   endIndex = matchingLine.endIndex;
            // }
            const currentLinedata = highlights.find(a => a.cLineno && (a && a.cPageno == (pageIndex + 1) && a.cLineno == (index + 1)));
            const color2 = currentLinedata && currentLinedata.cColor ? `#${currentLinedata.cColor};` : '';


            //         <pre class="customfont" style="height: ${lineHeight}px;">
            //         ${isAnnotation && matchingLine && color ?
            //         (questionText = questionText.slice(0, startIndex) + `<span style="background:${color}">` + questionText.slice(startIndex, endIndex) + '</span>' + questionText.slice(endIndex))
            // : questionText} </pre>


            let color = null;
            // if (isAnnotation && curPageData.length > 0) {

            //   matchingLine = this.utilityService.findFirstMatchingLine(curPageData, index + 1);
            //   // if(matchingLine !== null){
            //   //   color = matchingLine ? `${matchingLine.color}` : null;
            //   //   questionText = questionText.replace(
            //   //     matchingLine.text,
            //   //     `<span style="background:${color}">${matchingLine.text}</span>`
            //   //   );
            //   // }

            //   if (matchingLine && line.linetext && matchingLine.text) {
            //     startIndex = matchingLine.startIndex;
            //     endIndex = matchingLine.endIndex;
            //     const color = matchingLine.color;
            //     questionText = line.linetext.slice(0, startIndex) +
            //       `<span style="background:${color}">` +
            //       line.linetext.slice(startIndex, endIndex) +
            //       '</span>' +
            //       line.linetext.slice(endIndex);
            //   }
            // }

            if (isAnnotation && curPageData.length > 0) {
              // Get all matches for this line
              let matchingLines = this.utilityService.findAllMatchingLines(curPageData, index + 1);
              const fontFamily = theme?.nBFont
                ? this.themeCssService['fontOptions'].find(f => f.nValue == theme?.nBFont)?.jOther.font || 'courier'
                : 'courier';
              const fontSize = theme?.nBFontsize || 17;
              const highlightLayers = matchingLines.map(match => {
                try {
                  if (!match.startIndex && !match.endIndex) {
                    return '';
                  }
                  const textBefore = line.linetext.slice(0, match.startIndex);
                  const textHighlight = line.linetext.slice(match.startIndex, match.endIndex);

                  // const left = (match.startIndex + 3) + this.getTextWidth(textBefore, `${fontSize}pt ${fontFamily}`); // Adjust to your font
                  // const width = this.getTextWidth(textHighlight, `${fontSize}pt ${fontFamily}`) + (match.endIndex - (match.startIndex)); // Adjust to your font
                  const left = (query.cTranscript == 'Y' ? (match.startIndex + 3) : 3) + this.getTextWidth(textBefore, `${fontSize}pt ${fontFamily}`); // Adjust to your font
                  const width = this.getTextWidth(textHighlight, `${fontSize}pt ${fontFamily}`) + (query.cTranscript == 'Y' ? (match.endIndex - (match.startIndex)) : 5); // Adjust to your font


                  // console.log('start', (match.startIndex - leadingSpaces), 'left', left, 'width', width, 'match', match, 'textHighlight', textHighlight, 'textBefore', textBefore, 'fontSize', fontSize, 'fontFamily', fontFamily);
                  const highlight = `<div class="highlight-layer1"
                      style="
                          left:${left}px;
                          width:${width}px;
                          background:${match.color};
                          opacity:0.8;
                          position:absolute;                          
                          top:-2px;
                          height:22px;
                              z-index: 1;
                          mix-blend-mode: darken;
                      ">
                  </div>`;
                  // console.log('\n\n\n\n highlight \n\n\n\n ', highlight)
                  return highlight;
                } catch (error) {
                  console.error('\n\n\n\n highlight error \n\n\n\n ', error);
                  return ''

                }
              }).join('');

              questionText = `${highlightLayers} ${questionText}`
            }

            return `
              <a name="page-${pageIndex + 1}-${line.lineno}" class="page-anchor"></a>
                  <div class="line-table ${lineBreakClass}" style="height: ${lineHeight}px;position:relative" >
                  <div class="highlight-layer1"
                      style="
                          left:${0}px;
                          width:100%;
                          background:${color2};
                          opacity:0.8;
                          position:absolute;                          
                          top:-2px;
                          height:22px;
                              z-index: 0;
                          mix-blend-mode: darken;
                      ">
                  </div>
                    <div style="display: flex; align-items: baseline;">
                      <span class="line-no customfont"> <a class="line-no customfont" id="line-${pageIndex + 1}-${line.lineno}" href="#line-${pageIndex + 1}-${line.lineno}"> ${!line.lineno || line.lineno > 9 ? '' : '0'}${line.lineno ? line.lineno : ''}</a></span>
                      <span class="timestamp customfont">${line.timestamp ? line.timestamp : ''}</span>
                      <div class="line-text">
                      <pre class="customfont" style="height: ${lineHeight}px; position:relative;z-index: 10;">${questionText}</pre>
                      </div>
                    </div>
                  </div>
            `;
          }).join('')}
            </div>
          `;
        }).join('');

      } catch (error) {

      }

      const firstpageno: number = page.page[0] + this.coverPglength + this.indexpagecount;
      const lastpageno: number = Math.max(...page.page) + this.coverPglength + this.indexpagecount;

      return `
        <div class="page page-break bg-white ${swapClass} ${fourUpClass}"  style="display: flex;flex-direction: column;" >
          <div>
            <div class="new-header">
              <div class="left">
                <div style="display: flex; flex-direction: column;">
<pre class="data-postion1-TL customfont" [data-postion1]="TL">${HFDetails.TL.value1}</pre>
<p class="customfont block data-postion2-TL customfont" [data-postion2]="TL">${HFDetails.TL.value2}</p>
                  ${(type == '4UP') || !isPagination ? '' : ((theme?.cPNAlignRL === 'Left' || theme?.bPNSwap) && theme?.cPNAlignTB === 'Top') ? `
                    <span class="page-number-left" style="display: flex;align-items: center;gap: 3px;">
                      <span class="mainpageno customfont">
                        <span class="customfont">${pageNumberDisplay}</span>
                      </span>
                    </span>
                  ` : ''}
                </div>
              </div>
              <div class="right" style="height: calc((var(--header-footer-font-size) * 1.5) * ${((theme?.cPNAlignRL === 'Right' || theme?.bPNSwap) && theme?.cPNAlignTB === 'Top') ? `3` : `2`});position: relative;">
                <span class="data-postion1-TR customfont" style="position: absolute;right: 0;" [data-postion1]="TR">${HFDetails.TR.value1}</span>
                <span class="data-postion2-TR customfont" style="position: absolute;right: 0;    top: calc(var(--header-footer-font-size) * 1.5);" [data-postion2]="TR">${HFDetails.TR.value2}</span>
                <span style="position: absolute;right: 0;top: calc((var(--header-footer-font-size) * 1.5) * 2);">
                  ${(type == '4UP') || !isPagination ? '' : ((theme?.cPNAlignRL === 'Right' || theme?.bPNSwap) && theme?.cPNAlignTB === 'Top') ? `
                    <span style="text-align: end;display: flex;" class="text-end customfont whitespace-nowrap  customfont">
                      ${pageNumberDisplay}
                    </span>
                  ` : ''}
                </span>
              </div>
            </div>
          </div>

          <div class="${page.page.length > 1 ? 'grid-container' : 'page-wrapper'}" >
            ${pageContent}
          </div>

          <div>
            <div style="vertical-align: bottom;" >
            ${page.page.length > 1 ? `
                 <span  style="display:block" class="text-end customfont">${((pageIndex + this.coverPglength + this.indexpagecount) + 1) + '(Pages ' + (firstpageno) + ' to ' + lastpageno})</span>
            ` : ''} 
            <table class="page-header page-footer" >
                <tr>
                  <td class="head-left customfont">
                    <div class="flex items-start gap-2 customfont">
                  
<pre class="data-postion1-BL customfont" [data-postion1]="BL"> ${HFDetails.BL.value1}</pre>
                    </div>
                    <div>
                      <span class="customfont block data-postion2-BL customfont" [data-postion2]="BL">${HFDetails.BL.value2}</span>
                    </div>
                      <span style="${type == '4UP' || !isPagination ? 'display: none;' : 'display: flex;align-items: center;gap: 3px;'}"> 
                    ${(theme?.cPNAlignRL === 'Left' && theme?.cPNAlignTB === 'Bottom') ? `
                        <span class="flex items-center gap-2 mainpageno customfont">
                          <span class="customfont">${pageNumberDisplay}</span>
                        </span>
                      ` : ''}
                      </span>
                  </td>
                  <td class="head-right">
                 
                    <div class="gap-2 ">
<pre class="data-postion1-BR customfont" [data-postion1]="BR">${HFDetails.BR.value1}</pre>
<span  style="${type == '4UP' || !isPagination ? 'display: none;' : 'display: flex;align-items: center;gap: 3px;justify-content: end'}"> 
                      ${(theme?.cPNAlignRL === 'Right' && theme?.cPNAlignTB === 'Bottom') ? `
                        <span class="flex items-center justify-end gap-2 mainpageno customfontall">
                          <span class="customfont">${pageNumberDisplay}</span>
                        </span>
                      ` : ''}
                    </div>
                    </span>
                    <div>
                      <span class="customfont block data-postion2-BR customfont "  [data-postion2]="BR">${HFDetails.BR.value2}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transcript Preview</title>
          <style>
            :root {
              ${cssVariablesString}
            }
            ${this.themeCssService.getBaseCss()}
          </style>
        </head>
        <body>
          <div class="page-container transcript-preview-page overflow-auto">
            ${titlePageHtml}
            ${isAnnotation ? summaryOfAnnotContent : ''}
            ${isAnnotation ? summaryOfHihglightsContent : ''}            
            ${contentPagesHtml}
          </div>
        </body>
      </html>
    `;
  }


  transformQuestionOrSpicker(value: string, jBBold: any, continueFlag: boolean): [string, boolean] {
    if (!value) return ['', continueFlag];

    let formatted = value;

    // Bold speaker name (before colon)
    const speakerRegex = /^([^:]+):/;
    if (jBBold.includes('S') && speakerRegex.test(formatted)) {
      formatted = formatted.replace(speakerRegex, '<strong>$1:</strong>');
    }

    if (formatted.includes('A.')) {
      continueFlag = false;
    }
    // Bold question part
    const questionIndex = formatted.indexOf('Q.');


    if (jBBold.includes('Q') && (questionIndex !== -1 || continueFlag)) {
      continueFlag = true;
      formatted = `<strong>${formatted}</strong>`;
    }

    return [formatted, continueFlag];
  }


  indexpagecount = 0;

  bindIssuesIndex(summaryOfAnnots) {
    let mainContent = '';
    const maxItemsPerPage = 15;   // adjust as needed
    let itemCount = 0;
    let pageCount = 0;

    if (summaryOfAnnots?.length) {
      summaryOfAnnots.forEach((item) => {
        // OPEN first page for this section
        mainContent += `  <div class="page page-break indexpage p-0">
                              <div class="anothead mb-3">Index</div>
                              <div class="heading">${item?.title}</div>
                                  <div class="p-3">
                                  <div class="tabhead">
                                    <div class="pageno">Page</div>
                                    <div class="source">Source Text</div>
                                    <div class="note">Note</div>
                                    <div class="issue">Issues</div>
                                    </div>
                                    `;
        pageCount++;

        if (item.data?.length) {
          item.data.forEach((annot) => {
            // determine weight by number of issues (min 1)
            const weight = Array.isArray(annot.issues) ? annot.issues.length : 0;
            const itemWeight = Math.max(1, weight);

            // PAGINATION: start new page if this item would overflow
            if (itemCount + itemWeight > maxItemsPerPage) {
              // close old page
              mainContent += `</div></div>`;
              // open new page with same header
              mainContent += `  <div class="page page-break indexpage p-0">
                              <div class="anothead mb-3">Index</div>
                              <div class="heading">${item?.title}</div>
                                  <div class="p-3">
                                  <div class="tabhead">
                                    <div class="pageno">Page</div>
                                    <div class="source">Source Text</div>
                                    <div class="note">Note</div>
                                    <div class="issue">Issues</div>
                                    </div>
                                    `;
              pageCount++;
              itemCount = 0;
            }

            // CORE ROW RENDERING
            mainContent += `
     <div class="tabbody">
        <div class="pageno"><a href="#page-${annot.pageIndex}-${annot.cLineno}">${annot.pageIndex}</a></div>
        <div class="source">${annot.cONote || '-'}</div>
        <div class="note">${annot.cNote || '-'}</div>`;
            mainContent += this.bindAllIssues(annot);
            mainContent += `</div>`;

            // increment by weight
            itemCount += itemWeight;
          });
        }

        // CLOSE last page of this section
        mainContent += `</div></div>`;
        itemCount = 0;
      });

      this.indexpagecount = this.indexpagecount + pageCount;
    }

    return mainContent;
  }





  bindHighlightsIndex(summaryOfHihglights, theme) {
    debugger;
    let mainContent = '';
    const maxItemsPerPage = 15;    // ← adjust as needed
    let itemCount = 0;
    let pageCount = 0;             // ← track how many pages we open

    try {
      if (summaryOfHihglights?.length) {
        summaryOfHihglights.forEach((item) => {
          // ── OPEN first page of this section ──
          mainContent += `
            <div class="page page-break indexpage p-0">
              <div class="anothead mb-3">Index</div>
              <div class="heading">${item?.title}</div>
              <div class="p-3">
                <div class="tabhead">
                  <div class="pageno">Page</div>
                  <div class="source">Source Text</div>
                  <div class="note">Note</div>
                  <div class="issue">Issues</div>
                </div>`;
          pageCount++;

          item.data.forEach((group) => {
            // determine weight by number of issues (min 1)
            const baseIssues = (group.data[0]?.issues?.length) || 0;
            const weight = Math.max(1, baseIssues);
            const text = group.data.map(a => a.cNote || '').join('<br /> ');
            // ── PAGINATION CHECK ── start a new page if this item would overflow
            if (itemCount + weight > maxItemsPerPage) {
              // close old page
              mainContent += `</div></div>`;
              // open new page (same header)
              mainContent += `
                <div class="page page-break indexpage p-0">
                  <div class="anothead mb-3">Index</div>
                  <div class="heading">${item?.title}</div>
                  <div class="p-3">
                    <div class="tabhead">
                      <div class="pageno">Page</div>
                      <div class="source">Source Text</div>
                      <div class="note">Note</div>
                      <div class="issue">Issues</div>
                    </div>`;
              pageCount++;
              itemCount = 0;
            }

            // ── YOUR ROW RENDERING LOGIC ──
            mainContent += `<div class="tabbody">`;
            const sortedArray = group.data
              .sort((a, b) => parseInt(a.cLineno || "0") - parseInt(b.cLineno || "0"));
            const page = [...new Set(sortedArray.map(a => a.cPageno))][0];
            const line = [...new Set(sortedArray.map(a => a.cLineno))][0];
            const issues = sortedArray[0] || {};

            mainContent += `
              <div class="pageno">
                <a href="#page-${page}-${line}">${page || ''}</a>
              </div>`;
            //text
            mainContent +=
              `<div class="source">
${text || ''}
                               </div>`;
            mainContent += `<div class="note"></div>`;
            mainContent += this.bindAllIssues(issues);
            mainContent += `</div>`;

            // count up by the number of slots this item uses
            itemCount += weight;
          });

          // ── CLOSE last page of this section ──
          mainContent += `</div></div>`;
          itemCount = 0;
        });
        this.indexpagecount = this.indexpagecount + pageCount;
      }
    } catch (error) {
      console.error('Error in bindHighlightsIndex:', error);
    }

    return mainContent;
  }

  bindAllIssues(annot) {
    let mainContent = '';
    mainContent += `<div class="issue">`;

    try {
      if (annot?.issues?.length) {
        annot.issues.forEach((issue) => {
          mainContent +=
            ` <div class="issuewrap">
                  <div class="name"> <span class="issuebar" style="background:#${issue.cColor} !important"></span> <span class="text">${issue.cIName}</span> </div>`;

          if (issue?.cRel) {
            mainContent += `<div class="rel"> <span class="relspn">${issue.cRel} </span> </div>`;
          }

          if (issue?.cImp) {
            mainContent += `
                      <div class="impact"><img width="20px" src="https://etabella.tech/docs/impacts/${issue.nImpactid}.png">  </div>
                     `;
          }

          mainContent += `</div>`;
          // issue.nImpactid  issue.nRelid   issue.cImp  issue.cRel
        });
      }
    } catch (error) {

    }

    mainContent += `</div>`;
    return mainContent;
  }

  /**
   * Uses an offscreen canvas to measure the number of lines and total height for a given text, theme, and width.
   * This is more accurate than character-based estimation, as it uses actual font metrics.
   */
  private calculatePreHeightCanvas(text: string, theme: ThemeConfig, width?: number): number {
    debugger;
    // Set up canvas context
    const canvas = (typeof window !== 'undefined' && window.document)
      ? document.createElement('canvas')
      : {
        getContext: () => ({
          font: '',
          measureText: (t: string) => ({ width: t.length * 10 })
        })
      } as any; // fallback for SSR
    const ctx = canvas.getContext('2d');

    // Fixed font settings (ignore theme)
    const fontFamily = theme?.nBFont
      ? this.themeCssService['fontOptions'].find(f => f.nValue == theme?.nBFont)?.jOther.font || 'courier'
      : 'courier';
    const fontSize = 12; // px
    const fontWeight = 500;
    const letterSpacing = 0.2; // px
    const lineHeight = 1.5; // multiplier
    const containerWidth = width || 554;
    const padding = 0;
    const availableWidth = containerWidth - padding;

    ctx.font = `${fontSize}px ${fontFamily}`;

    // Treat <br> and <br/> as line breaks
    let normalizedText = text || '';
    normalizedText = normalizedText.replace(/<br\s*\/?>/gi, '\n');

    // Split by newlines first (pre elements preserve newlines)
    const lines = normalizedText.split('\n');
    let totalLines = 0;

    lines.forEach(line => {
      // Remove leading spaces for each line
      line = line.replace(/^\s+/, '');
      if (line.length === 0) {
        totalLines += 1;
        return;
      }
      let currentLine = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const testLine = currentLine + char;
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > availableWidth) {
          totalLines += 1;
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine.length > 0) {
        totalLines += 1;
      }
    });

    const lineHeightPx = fontSize * lineHeight;
    return totalLines * lineHeightPx;
  }


  getTextWidth(text: string, font: string = '14px Arial'): number {
    const canvas = createCanvas(488, 50);
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    // console.log('text', text, 'font', font);
    // const leadingSpaces = text.match(/^\s+/)?.[0].length ?? 0;
    // const extraLeadingWidth = leadingSpaces; // Approximate width of leading spaces
    return ctx.measureText(text).width;
  }



  getTextWidth_new(text: string, font: string = '14px Arial', letterSpacing: string = '0px'): number {
    const canvas = createCanvas(1000, 50);
    const ctx = canvas.getContext('2d');
    ctx.font = font;

    // Try to set letter spacing on canvas context (modern browsers)
    if ('letterSpacing' in ctx) {
      (ctx as any).letterSpacing = letterSpacing;
      return ctx.measureText(text).width;
    }

    // Fallback to manual calculation
    const baseWidth = ctx.measureText(text).width;
    const letterSpacingValue = parseFloat(letterSpacing.replace('px', ''));
    const characterGaps = Math.max(0, text.length - 1);
    const totalLetterSpacing = characterGaps * letterSpacingValue;

    return baseWidth + totalLetterSpacing;
  }
}