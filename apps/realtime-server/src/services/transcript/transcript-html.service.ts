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
    const showCoverPage = query?.bCoverpg !== false;
    let titlePageHtml = '';
    if (showCoverPage) {
      if (!query?.cTranscript || query?.cTranscript == 'Y') {
        titlePageHtml = this.generateTitlePages(formData, theme, hostorigin);
      } else {
        titlePageHtml = this.generateTitlePages_2(query, theme, hostorigin);
      }
    } else {
      this.coverPglength = 0;
    }
    const pageTitle = query?.cExportName || 'Transcript Preview';
    let summaryOfAnnotContent: string = '';
    let summaryOfHihglightsContent: string = '';
    const issueAnnots = (annotres && annotres.length) && query.bQfact ? annotres[0] : [];

    if (isAnnotation) {
      summaryOfAnnotContent = this.bindAnnotationSummary(summaryOfAnnots, summaryOfHihglights);
      summaryOfHihglightsContent = '';
    }
    const highlights = (annotres && annotres.length) && query.bQmark ? annotres[1] : [];
    (highlights || []).forEach((h: any, i: number) => {
    });

    const firstPageNo = lines[0].pageno;
    const maxLineno = lines
      .filter(entry => entry.pageno === firstPageNo)
      .reduce((max, curr) => Math.max(max, curr.lineno), 0);
    const pages = this.generatePages(lines, type);
    const contentPagesHtml = pages.map((page, pageIndex) => {
      try {
        if (!isSubmit && query.jPages && query.jPages.length) {
          if (!query.jPages.includes(pageIndex + 1)) {
            return ``
          }
        }
      } catch (error) {
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
            <div id="page-${pageIndex + 1}" style="vertical-align: top;" class="lines-wrapper ${justifyBetween}">
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

                  // Highlight overlay geometry.
                  //
                  // node-canvas' ctx.measureText() (used by getTextWidth) does NOT
                  // account for CSS `letter-spacing`, but the rendered <pre> has
                  // theme?.nBLetterspacing applied (default 0.5px per char, see
                  // calculatePreHeight at line 174). Without compensation the
                  // overlay is narrower than the actual text by ~letter_spacing *
                  // char_count pixels, which shows up as the "highlight leaves
                  // some words at the end" bug on exported drafts.
                  //
                  // Previously the compensation `+ (endIndex - startIndex)` was
                  // only applied for cTranscript === 'Y' (published path); draft
                  // exports got a fixed `+5` which under-estimates by N pixels
                  // per N chars and truncates trailing words. Apply the same
                  // per-character compensation for both modes so the overlay
                  // keeps pace with the rendered text width in draft exports too.
                  const charCount = match.endIndex - match.startIndex;
                  const left = (match.startIndex + 3) + this.getTextWidth(textBefore, `${fontSize}pt ${fontFamily}`);
                  const width = this.getTextWidth(textHighlight, `${fontSize}pt ${fontFamily}`) + charCount;


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
                  return highlight;
                } catch (error) {
                  console.error('highlight wrap error:', error);
                  return ''

                }
              }).join('');

              questionText = `${highlightLayers} ${questionText}`
            }

            return `
                  <div id="page-${pageIndex + 1}-${line.lineno}" class="line-table ${lineBreakClass}" style="height: ${lineHeight}px;position:relative" >
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
          <title>${(query?.cExportName || query?.cCasename || 'Transcript').replace(/[&<>]/g, (c: string) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</title>
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

  private buildAnnotCard(annot: any, showFactLink = false): string {
    const issues: any[] = annot.issues || [];
    const coords: any[] = annot.jCordinates || [];

    // Page range: "P startPage.startLine - endPage.endLine"
    let pgRange = '';
    let pgHref = annot.pageIndex ? `#page-${annot.pageIndex}${annot.cLineno ? '-' + annot.cLineno : ''}` : '#';
    if (coords.length > 0) {
      const first = coords[0];
      const last = coords[coords.length - 1];
      pgRange = `P ${first.p}.${first.l} &ndash; ${last.p}.${last.l}`;
      pgHref = `#page-${first.p}-${first.l}`;
    } else if (annot.pageIndex) {
      pgRange = `P ${annot.pageIndex}${annot.cLineno ? '.' + annot.cLineno : ''}`;
    }

    const metaStr = [annot.cCreateby, annot.dCreateDt].filter(Boolean).join(' &nbsp;|&nbsp; ');

    let html = `<div class="ac-card">`;

    // Issue rows — colored left border + dot matching the issue color
    if (issues.length > 0) {
      issues.forEach(issue => {
        const color = issue.cColor ? `#${issue.cColor}` : '#cccccc';
        html += `<div class="ac-issue-row" style="border-left-color:${color}">
          <div class="ac-issue-left">
            <span class="ac-issue-dot" style="background:${color}"></span>
            <span class="ac-issue-name">${issue.cIName || ''}</span>
          </div>
          <div class="ac-badges">
            ${issue.cRel ? `<span class="ac-rel-badge">${issue.cRel}</span>` : ''}
            ${issue.cImp && issue.nImpactid ? `<img class="ac-impact-img" src="${issue.impactImgSrc || `https://etabella.tech/docs/impacts/${issue.nImpactid}.png`}">` : ''}
          </div>
        </div>`;
      });
    }

    // ── Meta (Created by / date) ──
    if (metaStr) html += `<div class="ac-meta">Created by ${metaStr}</div>`;

    // ── Page range bar ──
    if (pgRange) {
      html += `<div class="ac-pgbar"><a href="${pgHref}" style="color:#fff;text-decoration:none;">${pgRange}</a></div>`;
    }

    // ── Lines ──
    if (coords.length > 0) {
      html += `<div class="ac-lines">`;
      coords.forEach(c => {
        html += `<div class="ac-line">
          <span class="ac-ln">${c.l}</span>
          <span class="ac-ts">${c.t || ''}</span>
          <span class="ac-lt">${c.text || ''}</span>
        </div>`;
      });
      html += `</div>`;
    } else if (annot.cONote) {
      html += `<div class="ac-lines"><div class="ac-line"><span class="ac-lt">${annot.cONote}</span></div></div>`;
    }

    // Note — only show if different from the source text (jTexts and jOT are often identical)
    const noteText = (annot.cNote || '').trim();
    const srcText = (annot.cONote || '').trim();
    if (noteText && noteText !== srcText) html += `<div class="ac-note">Note: ${noteText}</div>`;

    // ── FactLink / DocLink ──
    const links: any[] = annot.list || [];
    if (showFactLink && links.length > 0) {
      links.forEach(link => {
        const isOutgoing = link.jLinktype?.type === 'C';
        const btnLabel = isOutgoing ? 'Outgoing DocLink' : 'FactLink';
        html += `<div class="ac-factlink-row">
          <span class="ac-fl-btn">${btnLabel}</span>
          <span class="ac-fl-icon">&#128196;</span>
          <span class="ac-fl-filename">${link.cFilename || ''}</span>
          ${link.cExhibitno ? `<span class="ac-fl-exhibit">Exhibit No. ${link.cExhibitno}</span>` : ''}
        </div>`;
        const metaParts = [];
        if (link.cRefpage) metaParts.push(`Ref: ${link.cRefpage}`);
        if (link.cBundletag) metaParts.push(`Bundle: ${link.cBundletag}`);
        if (metaParts.length) html += `<div class="ac-fl-meta">${metaParts.join(' &nbsp;|&nbsp; ')}</div>`;

        // Between / Type / Status row (Figma "text box" below DocLink button)
        const linkMeta2: string[] = [];
        const between = link.cBetween || link.jLinktype?.cBetween || '';
        const fromDate = link.dFrom || link.dStart || link.jLinktype?.dFrom || link.jLinktype?.dStart || '';
        const toDate = link.dTo || link.dEnd || link.jLinktype?.dTo || link.jLinktype?.dEnd || '';
        const docType = link.cType || link.cDoctype || link.jLinktype?.cType || link.jLinktype?.cDoctype || '';
        const statusVal = link.cStatus || link.jLinktype?.cStatus || '';
        if (between) {
          linkMeta2.push(`Between: ${between}`);
        } else if (fromDate || toDate) {
          linkMeta2.push(`Between: Start ${fromDate || '?'} – End ${toDate || '?'}`);
        }
        if (docType) linkMeta2.push(`Type: ${docType}`);
        if (statusVal) linkMeta2.push(`Status: ${statusVal}`);
        if (linkMeta2.length) html += `<div class="ac-fl-meta">${linkMeta2.join(' &nbsp;|&nbsp; ')}</div>`;

        const linkNote = link.cNote || link.cDesc || link.cBody || '';
        if (linkNote) html += `<div class="ac-fl-note">${linkNote}</div>`;
      });
    }

    html += `</div>`;
    return html;
  }

  bindAnnotationSummary(summaryOfAnnots: any[], summaryOfHihglights: any[]): string {
    const hasAnnots = summaryOfAnnots?.length > 0;
    const hasHighlights = summaryOfHihglights?.length > 0;
    if (!hasAnnots && !hasHighlights) return '';

    const sectionMeta: Record<string, { icon: string; showFactLink: boolean }> = {
      'Q fact':     { icon: '<span class="ac-icon ac-icon-qfact"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></span>', showFactLink: false },
      'Fact':       { icon: '<span class="ac-icon ac-icon-fact"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg></span>',  showFactLink: true  },
      'DocLink':    { icon: '<span class="ac-icon ac-icon-doc"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></span>',   showFactLink: true  },
      'Quick Mark': { icon: '<span class="ac-icon ac-icon-qm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg></span>', showFactLink: false },
    };

    let mainContent = `<div class="page page-break indexpage p-0">
      <div class="annot-summary-banner">Transcript &#8212; Annotations Summary</div>
      <div class="ac-body">`;

    // Q fact + Fact sections
    (summaryOfAnnots || []).forEach((item) => {
      const meta = sectionMeta[item.title] || { icon: '<span class="ac-icon">&#9776;</span>', showFactLink: false };
      mainContent += `<div class="ac-section">
        <div class="ac-section-head">
          ${meta.icon}
          <span class="ac-type-name">${item.title}</span>
        </div>`;
      (item.data || []).forEach((annot: any) => {
        mainContent += this.buildAnnotCard(annot, meta.showFactLink);
      });
      mainContent += `</div>`;
    });

    // Quick Mark sections
    (summaryOfHihglights || []).forEach((item) => {
      const meta = sectionMeta[item.title] || { icon: '<span class="ac-icon ac-icon-qm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg></span>', showFactLink: false };
      mainContent += `<div class="ac-section">
        <div class="ac-section-head">
          ${meta.icon}
          <span class="ac-type-name">${item?.title}</span>
        </div>`;

      (item.data || []).forEach((group) => {
        const first = group.data?.[0] || {};
        const sortedCoords = (first.jCordinates || []).slice().sort((a, b) => a.p - b.p || a.l - b.l);
        const cPageno = first.cPageno ?? first.pageIndex;
        const cLineno = first.cLineno;
        const pgHref = cLineno ? `#page-${cPageno}-${cLineno}` : `#page-${cPageno}`;
        const bgColor = first.cColor ? `#${first.cColor.replace('#','')}` : '#EBCAFF';

        let pgRange = cPageno ? `P ${cPageno}${cLineno ? '.' + cLineno : ''}` : '';
        if (sortedCoords.length > 0) {
          const f = sortedCoords[0];
          const l = sortedCoords[sortedCoords.length - 1];
          pgRange = `P ${f.p}.${f.l}${f.t ? '/' + f.t : ''} &ndash; ${l.p}.${l.l}${l.t ? '/' + l.t : ''}`;
        }
        const metaStr = [first.cCreateby, first.dCreateDt].filter(Boolean).join(' &nbsp;|&nbsp; ');

        mainContent += `<div class="ac-card" style="border-left: 4px solid ${bgColor}">`;
        if (metaStr) mainContent += `<div class="ac-meta">Created by ${metaStr}</div>`;
        if (pgRange) mainContent += `<div class="ac-pgbar"><a href="${pgHref}" style="color:#fff;text-decoration:none;">${pgRange}</a></div>`;

        if (sortedCoords.length > 0) {
          mainContent += `<div class="ac-lines">`;
          sortedCoords.forEach(coord => {
            mainContent += `<div class="ac-line">
              <span class="ac-ln">${coord.l}</span>
              <span class="ac-ts">${coord.t || ''}</span>
              <span class="ac-lt">${coord.text || ''}</span>
            </div>`;
          });
          mainContent += `</div>`;
        } else if (first.cONote) {
          mainContent += `<div class="ac-lines"><div class="ac-line"><span class="ac-lt">${first.cONote}</span></div></div>`;
        }
        mainContent += `</div>`;
      });
      mainContent += `</div>`;
    });

    mainContent += `</div></div>`;
    this.indexpagecount += 1;
    return mainContent;
  }

  bindIssuesIndex(summaryOfAnnots) {
    if (!summaryOfAnnots?.length) return '';

    const sectionIcons: Record<string, string> = {
      'Q fact':     '&#10003;',
      'Fact':       '&#8801;',
      'Quick Mark': '&#8801;',
      'DocLink':    '&#8599;',
    };

    let mainContent = `<div class="page page-break indexpage p-0">
      <div class="annot-summary-banner">Transcript &#8212; Annotations Summary</div>
      <div class="ac-body">`;

    summaryOfAnnots.forEach((item) => {
      const icon = sectionIcons[item.title] || '&#8801;';
      const showFactLink = item.title === 'Fact' || item.title === 'DocLink';

      mainContent += `<div class="ac-section">
        <div class="ac-section-head">
          <span class="ac-type-icon">${icon}</span>
          <span class="ac-type-name">${item.title}</span>
        </div>`;

      (item.data || []).forEach((annot: any) => {
        mainContent += this.buildAnnotCard(annot, showFactLink);
      });

      mainContent += `</div>`;
    });

    mainContent += `</div></div>`;
    this.indexpagecount += 1;
    return mainContent;
  }





  bindHighlightsIndex(summaryOfHihglights, theme) {
    if (!summaryOfHihglights?.length) return '';
    let mainContent = '';

    try {
      summaryOfHihglights.forEach((item) => {
        mainContent += `<div class="page page-break indexpage p-0">
          <div class="annot-summary-banner">Transcript &#8212; Annotations Summary</div>
          <div class="ac-body">
            <div class="ac-section">
              <div class="ac-section-head">
                <span class="ac-type-icon">&#8801;</span>
                <span class="ac-type-name">${item?.title}</span>
              </div>`;

        item.data.forEach((group) => {
          const first = group.data?.[0] || {};
          const sortedCoords = (first.jCordinates || []).sort((a, b) => a.l - b.l);
          const cPageno = first.cPageno ?? first.pageIndex;
          const cLineno = first.cLineno;
          const pgHref = cLineno ? `#page-${cPageno}-${cLineno}` : `#page-${cPageno}`;

          let pgRange = cPageno ? `P ${cPageno}${cLineno ? '.' + cLineno : ''}` : '';
          if (sortedCoords.length > 0) {
            const f = sortedCoords[0];
            const l = sortedCoords[sortedCoords.length - 1];
            pgRange = `P ${f.p}.${f.l}${f.t ? '/' + f.t : ''} &ndash; ${l.p}.${l.l}${l.t ? '/' + l.t : ''}`;
          }
          const metaStr = [first.cCreateby, first.dCreateDt].filter(Boolean).join(' &nbsp;|&nbsp; ');

          mainContent += `<div class="ac-card">`;
          if (metaStr) mainContent += `<div class="ac-meta">Created by ${metaStr}</div>`;
          if (pgRange) mainContent += `<div class="ac-pgbar"><a href="${pgHref}" style="color:#fff;text-decoration:none;">${pgRange}</a></div>`;

          if (sortedCoords.length > 0) {
            mainContent += `<div class="ac-lines">`;
            sortedCoords.forEach(coord => {
              mainContent += `<div class="ac-line">
                <span class="ac-ln">${coord.l}</span>
                <span class="ac-ts">${coord.t || ''}</span>
                <span class="ac-lt">${coord.text || ''}</span>
              </div>`;
            });
            mainContent += `</div>`;
          } else if (first.cONote) {
            mainContent += `<div class="ac-lines"><div class="ac-line"><span class="ac-lt">${first.cONote}</span></div></div>`;
          }

          if (first.cNote) mainContent += `<div class="ac-note">Note: ${first.cNote}</div>`;
          mainContent += `</div>`;
        });

        mainContent += `</div></div></div>`;
        this.indexpagecount += 1;
      });
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
                      <div class="impact"><img width="20px" src="${issue.impactImgSrc || `https://etabella.tech/docs/impacts/${issue.nImpactid}.png`}"> </div>
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