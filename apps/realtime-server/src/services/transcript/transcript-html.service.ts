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
              // Get all matches for this line and wrap the highlighted text
              // in inline <span> elements. Inline spans flow with the text, so
              // when a long line wraps to a second visual row, the highlight
              // naturally extends onto the wrapped row — which the previous
              // absolute-positioned <div> approach (fixed height, fixed geometry)
              // could not do. `questionText` at this point may already contain
              // <strong> tags inserted by transformQuestionOrSpicker, so we use
              // a tag-aware wrapper that splits the span across any intervening
              // tags to keep the HTML valid.
              const matchingLines = this.utilityService.findAllMatchingLines(curPageData, index + 1);
              // Sort descending by startIndex so earlier splices don't shift
              // later ones. Use endIndex as tie-breaker (longer range first).
              const sortedMatches = [...matchingLines]
                .filter(m => m && (m.startIndex < m.endIndex))
                .sort((a, b) => b.startIndex - a.startIndex || b.endIndex - a.endIndex);

              for (const match of sortedMatches) {
                try {
                  const openTag = `<span class="inline-highlight" style="background:${match.color};opacity:0.8;mix-blend-mode:darken;">`;
                  const closeTag = `</span>`;
                  questionText = this.wrapPlainRangeWithTagSkipping(
                    questionText, match.startIndex, match.endIndex, openTag, closeTag,
                  );
                } catch (error) {
                  console.error('highlight inline-wrap error', error);
                }
              }
            }

            // Base (quick-mark / color2) background highlight geometry.
            // The .line-table container height includes the inter-line spacing
            // gap BELOW the text, so `top:0; bottom:0` would stretch the
            // highlight across that gap too — visible as a tall-looking box on
            // single-row lines (e.g. "MR FRANCESCO COLOMBO"). For non-wrapped
            // lines keep the original thin band (top:-2px; height:22px). For
            // wrapped lines (hasLineBreak=true), fill the container so both
            // visual rows get covered.
            const bgHighlightStyle = hasLineBreak
              ? `top:0; bottom:0;`
              : `top:-2px; height:22px;`;
            return `
                  <div id="page-${pageIndex + 1}-${line.lineno}" class="line-table ${lineBreakClass}" style="height: ${lineHeight}px;position:relative" >
                  <div class="highlight-layer1"
                      style="
                          left:${0}px;
                          width:100%;
                          background:${color2};
                          opacity:0.8;
                          position:absolute;
                          ${bgHighlightStyle}
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

    // Primary issue drives the title line; only the vertical bar is colored.
    const primary = issues[0];
    const primaryColor = primary?.cColor ? `#${primary.cColor}` : '#cccccc';

    let html = `<div class="ac-card">`;

    // Single title row — issue bar + name on left, relevance pill + impact on right.
    if (primary) {
      const impactSrc = primary.cImp && primary.nImpactid
        ? (primary.impactImgSrc || `https://etabella.tech/docs/impacts/${primary.nImpactid}.png`)
        : '';
      html += `<div class="ac-title-row">
        <div class="ac-title-left">
          <span class="ac-issue-bar" style="background:${primaryColor}"></span>
          <span class="ac-issue-name">${primary.cIName || ''}</span>
        </div>
        <div class="ac-title-right">
          ${primary.cRel ? `<span class="ac-rel-pill">${primary.cRel}</span>` : ''}
          ${impactSrc ? `<img class="ac-impact-img" src="${impactSrc}">` : ''}
        </div>
      </div>`;
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

    // Icons mirror the in-app text-selection popup (AnnotBoxComponent) for QFact / Fact / DocLink.
    const iconQFact = '<span class="ac-icon ac-icon-qfact"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.6296 2C13.2542 2 12.8929 2.13458 12.6167 2.41083L8.50125 6.53333L12.5033 10.5354L16.6258 6.42C17.1712 5.8675 17.1712 4.975 16.6258 4.41542L14.6142 2.41083C14.3379 2.13458 13.9837 2 13.6296 2ZM7.82125 7.20625L3.59958 11.4279C3.04708 11.9804 3.04708 12.8729 3.61375 13.4467C2.74958 14.3179 1.87125 15.1892 1 16.0604H5.00917L5.61833 15.4513C6.17083 15.9896 7.05625 15.9825 7.60875 15.4371L11.8233 11.2154" fill="currentColor"/><circle cx="13.0234" cy="11.6875" r="4" fill="#002F64" stroke="currentColor"/><rect x="12.5234" y="9.1875" width="1" height="3.5" rx="0.5" fill="currentColor"/><circle cx="13.0234" cy="13.6875" r="0.5" fill="currentColor" stroke="currentColor" stroke-width="0.2"/></svg></span>';
    const iconFact = '<span class="ac-icon ac-icon-fact"><svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.99531 12C3.78314 12 3.57966 12.0843 3.42963 12.2343C3.2796 12.3843 3.19531 12.5878 3.19531 12.8C3.19531 13.0122 3.2796 13.2157 3.42963 13.3657C3.57966 13.5157 3.78314 13.6 3.99531 13.6H15.1953C15.4075 13.6 15.611 13.5157 15.761 13.3657C15.911 13.2157 15.9953 13.0122 15.9953 12.8C15.9953 12.5878 15.911 12.3843 15.761 12.2343C15.611 12.0843 15.4075 12 15.1953 12H3.99531Z" fill="currentColor"/><path d="M8.79688 4.8C8.79688 4.58783 8.88116 4.38434 9.03119 4.23431C9.18122 4.08429 9.3847 4 9.59687 4H15.1969C15.409 4 15.6125 4.08429 15.7626 4.23431C15.9126 4.38434 15.9969 4.58783 15.9969 4.8C15.9969 5.01217 15.9126 5.21566 15.7626 5.36569C15.6125 5.51571 15.409 5.6 15.1969 5.6H9.59687C9.3847 5.6 9.18122 5.51571 9.03119 5.36569C8.88116 5.21566 8.79688 5.01217 8.79688 4.8Z" fill="currentColor"/><path d="M3.19531 0.8C3.19531 0.587827 3.2796 0.384344 3.42963 0.234315C3.57966 0.0842854 3.78314 0 3.99531 0H15.1953C15.4075 0 15.611 0.0842854 15.761 0.234315C15.911 0.384344 15.9953 0.587827 15.9953 0.8C15.9953 1.01217 15.911 1.21566 15.761 1.36569C15.611 1.51571 15.4075 1.6 15.1953 1.6H3.99531C3.78314 1.6 3.57966 1.51571 3.42963 1.36569C3.2796 1.21566 3.19531 1.01217 3.19531 0.8Z" fill="currentColor"/><path d="M8.79688 8.8C8.79688 8.58783 8.88116 8.38434 9.03119 8.23431C9.18122 8.08429 9.3847 8 9.59687 8H15.1969C15.409 8 15.6125 8.08429 15.7626 8.23431C15.9126 8.38434 15.9969 8.58783 15.9969 8.8C15.9969 9.01217 15.9126 9.21566 15.7626 9.36569C15.6125 9.51571 15.409 9.6 15.1969 9.6H9.59687C9.3847 9.6 9.18122 9.51571 9.03119 9.36569C8.88116 9.21566 8.79688 9.01217 8.79688 8.8Z" fill="currentColor"/><path d="M7.2 6.79531C7.2 7.26807 7.10688 7.7362 6.92597 8.17297C6.74505 8.60974 6.47987 9.00661 6.14558 9.3409C5.81129 9.67519 5.41443 9.94036 4.97766 10.1213C4.54089 10.3022 4.07276 10.3953 3.6 10.3953C3.12724 10.3953 2.65911 10.3022 2.22234 10.1213C1.78557 9.94036 1.38871 9.67519 1.05442 9.3409C0.720125 9.00661 0.454951 8.60974 0.274034 8.17297C0.0931168 7.7362 0 7.26807 0 6.79531C0 5.84053 0.379285 4.92486 1.05442 4.24973C1.72955 3.5746 2.64522 3.19531 3.6 3.19531C4.55478 3.19531 5.47045 3.5746 6.14558 4.24973C6.82071 4.92486 7.2 5.84053 7.2 6.79531ZM4 5.19531C4 5.08923 3.95786 4.98748 3.88284 4.91247C3.80783 4.83745 3.70609 4.79531 3.6 4.79531C3.49391 4.79531 3.39217 4.83745 3.31716 4.91247C3.24214 4.98748 3.2 5.08923 3.2 5.19531V6.39531H2C1.89391 6.39531 1.79217 6.43745 1.71716 6.51247C1.64214 6.58748 1.6 6.68923 1.6 6.79531C1.6 6.9014 1.64214 7.00314 1.71716 7.07816C1.79217 7.15317 1.89391 7.19531 2 7.19531H3.2V8.39531C3.2 8.5014 3.24214 8.60314 3.31716 8.67816C3.39217 8.75317 3.49391 8.79531 3.6 8.79531C3.70609 8.79531 3.80783 8.75317 3.88284 8.67816C3.95786 8.60314 4 8.5014 4 8.39531V7.19531H5.2C5.30609 7.19531 5.40783 7.15317 5.48284 7.07816C5.55786 7.00314 5.6 6.9014 5.6 6.79531C5.6 6.68923 5.55786 6.58748 5.48284 6.51247C5.40783 6.43745 5.30609 6.39531 5.2 6.39531H4V5.19531Z" fill="currentColor"/></svg></span>';
    const iconDoc = '<span class="ac-icon ac-icon-doc"><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 7.5C0 7.35082 0.0623823 7.20774 0.173424 7.10225C0.284465 6.99676 0.435069 6.9375 0.592105 6.9375H1.77632C1.93335 6.9375 2.08396 6.99676 2.195 7.10225C2.30604 7.20774 2.36842 7.35082 2.36842 7.5C2.36842 7.64918 2.30604 7.79226 2.195 7.89775C2.08396 8.00324 1.93335 8.0625 1.77632 8.0625H0.592105C0.435069 8.0625 0.284465 8.00324 0.173424 7.89775C0.0623823 7.79226 0 7.64918 0 7.5Z" fill="currentColor"/><path d="M3.15625 7.5C3.15625 7.35082 3.21863 7.20774 3.32967 7.10225C3.44071 6.99676 3.59132 6.9375 3.74836 6.9375H4.93257C5.0896 6.9375 5.24021 6.99676 5.35125 7.10225C5.46229 7.20774 5.52467 7.35082 5.52467 7.5C5.52467 7.64918 5.46229 7.79226 5.35125 7.89775C5.24021 8.00324 5.0896 8.0625 4.93257 8.0625H3.74836C3.59132 8.0625 3.44071 8.00324 3.32967 7.89775C3.21863 7.79226 3.15625 7.64918 3.15625 7.5Z" fill="currentColor"/><path d="M6.3125 7.5C6.3125 7.35082 6.37488 7.20774 6.48592 7.10225C6.59697 6.99676 6.74757 6.9375 6.90461 6.9375H8.08882C8.24585 6.9375 8.39646 6.99676 8.5075 7.10225C8.61854 7.20774 8.68092 7.35082 8.68092 7.5C8.68092 7.64918 8.61854 7.79226 8.5075 7.89775C8.39646 8.00324 8.24585 8.0625 8.08882 8.0625H6.90461C6.74757 8.0625 6.59697 8.00324 6.48592 7.89775C6.37488 7.79226 6.3125 7.64918 6.3125 7.5Z" fill="currentColor"/><path d="M9.46875 7.5C9.46875 7.35082 9.53113 7.20774 9.64217 7.10225C9.75322 6.99676 9.90382 6.9375 10.0609 6.9375H11.2451C11.4021 6.9375 11.5527 6.99676 11.6637 7.10225C11.7748 7.20774 11.8372 7.35082 11.8372 7.5C11.8372 7.64918 11.7748 7.79226 11.6637 7.89775C11.5527 8.00324 11.4021 8.0625 11.2451 8.0625H10.0609C9.90382 8.0625 9.75322 8.00324 9.64217 7.89775C9.53113 7.79226 9.46875 7.64918 9.46875 7.5Z" fill="currentColor"/><path d="M12.6328 7.5C12.6328 7.35082 12.6952 7.20774 12.8062 7.10225C12.9173 6.99676 13.0679 6.9375 13.2249 6.9375H14.4091C14.5662 6.9375 14.7168 6.99676 14.8278 7.10225C14.9389 7.20774 15.0012 7.35082 15.0012 7.5C15.0012 7.64918 14.9389 7.79226 14.8278 7.89775C14.7168 8.00324 14.5662 8.0625 14.4091 8.0625H13.2249C13.0679 8.0625 12.9173 8.00324 12.8062 7.89775C12.6952 7.79226 12.6328 7.64918 12.6328 7.5Z" fill="currentColor"/><path d="M1.96916 0C1.75978 0 1.55897 0.0790176 1.41092 0.21967C1.26286 0.360322 1.17969 0.551088 1.17969 0.75V3.75C1.17969 4.14782 1.34604 4.52936 1.64215 4.81066C1.93826 5.09196 2.33987 5.25 2.75863 5.25H12.2323C12.6511 5.25 13.0527 5.09196 13.3488 4.81066C13.6449 4.52936 13.8113 4.14782 13.8113 3.75V0.75C13.8113 0.551088 13.7281 0.360322 13.58 0.21967C13.432 0.0790176 13.2312 0 13.0218 0H1.96916Z" fill="currentColor"/><path d="M13.0218 15C13.2312 15 13.432 14.921 13.58 14.7803C13.7281 14.6397 13.8113 14.4489 13.8113 14.25V11.25C13.8113 10.8522 13.6449 10.4706 13.3488 10.1893C13.0527 9.90804 12.6511 9.75 12.2323 9.75H2.75863C2.33987 9.75 1.93826 9.90804 1.64215 10.1893C1.34604 10.4706 1.17969 10.8522 1.17969 11.25V14.25C1.17969 14.4489 1.26286 14.6397 1.41092 14.7803C1.55897 14.921 1.75978 15 1.96916 15H13.0218Z" fill="currentColor"/></svg></span>';
    const iconQM = '<span class="ac-icon ac-icon-qm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 5h2v2H3zm0 4h2v2H3zm0 4h2v2H3zm0 4h2v2H3zM7 5h14v2H7zm0 4h14v2H7zm0 4h14v2H7zm0 4h14v2H7z"/></svg></span>';

    const sectionMeta: Record<string, { icon: string; showFactLink: boolean }> = {
      'QFact':      { icon: iconQFact, showFactLink: false },
      'Full Fact':  { icon: iconFact,  showFactLink: true  },
      'Quick Mark': { icon: iconQM,    showFactLink: false },
      'DocLink':    { icon: iconDoc,   showFactLink: true  },
    };

    // All annotation-summary sections (QFact, Full Fact, Quick Mark, DocLink) flow inside
    // a single page wrapper. The banner sits at the top of the wrapper, appearing only on
    // the first physical page. The `indexpage-banner` named-page rule gives continuation
    // pages a 30px top margin while keeping the first physical page flush via :first.
    // Using one wrapper avoids the empty bottom whitespace that per-section page-breaks
    // would produce when a section's content is shorter than a full page.
    const renderAnnotSection = (item: any): string => {
      const meta = sectionMeta[item.title] || { icon: '<span class="ac-icon">&#9776;</span>', showFactLink: false };
      let html = `<div class="ac-section">
        <div class="ac-section-head">
          ${meta.icon}
          <span class="ac-type-name">${item.title}</span>
        </div>`;
      (item.data || []).forEach((annot: any) => {
        html += this.buildAnnotCard(annot, meta.showFactLink);
      });
      html += `</div>`;
      return html;
    };

    const renderQMSection = (item: any): string => {
      const meta = sectionMeta[item.title] || { icon: '<span class="ac-icon">&#9776;</span>', showFactLink: false };

      // Filter out orphan groups (no page, no coords, no source text) — they would render
      // as empty cards with only a "Created by" line.
      const visibleGroups = (item.data || []).filter((group: any) => {
        const first = group.data?.[0] || {};
        const sortedCoords = (first.jCordinates || []);
        const cPageno = first.cPageno ?? first.pageIndex;
        return cPageno || sortedCoords.length > 0 || (first.cONote || '').trim();
      });
      if (!visibleGroups.length) return '';

      let html = `<div class="ac-section">
        <div class="ac-section-head">
          ${meta.icon}
          <span class="ac-type-name">${item?.title}</span>
        </div>`;

      visibleGroups.forEach((group: any) => {
        const first = group.data?.[0] || {};
        const sortedCoords = (first.jCordinates || []).slice().sort((a: any, b: any) => a.p - b.p || a.l - b.l);
        const cPageno = first.cPageno ?? first.pageIndex;
        const cLineno = first.cLineno;
        const pgHref = cLineno ? `#page-${cPageno}-${cLineno}` : `#page-${cPageno}`;
        const bgColor = first.cColor ? `#${first.cColor.replace('#', '')}` : '#EBCAFF';

        let pgRange = cPageno ? `P ${cPageno}${cLineno ? '.' + cLineno : ''}` : '';
        if (sortedCoords.length > 0) {
          const f = sortedCoords[0];
          const l = sortedCoords[sortedCoords.length - 1];
          pgRange = `P ${f.p}.${f.l}${f.t ? '/' + f.t : ''} &ndash; ${l.p}.${l.l}${l.t ? '/' + l.t : ''}`;
        }
        const metaStr = [first.cCreateby, first.dCreateDt].filter(Boolean).join(' &nbsp;|&nbsp; ');

        html += `<div class="ac-card" style="border-left: 4px solid ${bgColor}">`;
        if (metaStr) html += `<div class="ac-meta">Created by ${metaStr}</div>`;
        if (pgRange) html += `<div class="ac-pgbar"><a href="${pgHref}" style="color:#fff;text-decoration:none;">${pgRange}</a></div>`;

        if (sortedCoords.length > 0) {
          html += `<div class="ac-lines">`;
          sortedCoords.forEach((coord: any) => {
            html += `<div class="ac-line">
              <span class="ac-ln">${coord.l}</span>
              <span class="ac-ts">${coord.t || ''}</span>
              <span class="ac-lt">${coord.text || ''}</span>
            </div>`;
          });
          html += `</div>`;
        } else if (first.cONote) {
          html += `<div class="ac-lines"><div class="ac-line"><span class="ac-lt">${first.cONote}</span></div></div>`;
        }
        html += `</div>`;
      });
      html += `</div>`;
      return html;
    };

    // Compose all sections in display order: QFact + Full Fact, then Quick Mark, then DocLink.
    const annotsHtml = (summaryOfAnnots || [])
      .filter(item => item.title !== 'DocLink')
      .map(renderAnnotSection)
      .join('');
    const qmHtml = (summaryOfHihglights || [])
      .map(renderQMSection)
      .join('');
    const docHtml = (summaryOfAnnots || [])
      .filter(item => item.title === 'DocLink')
      .map(renderAnnotSection)
      .join('');

    const innerHtml = annotsHtml + qmHtml + docHtml;
    if (!innerHtml) return '';

    this.indexpagecount += 1;
    return `<div class="page page-break indexpage-banner p-0">
      <div class="annot-summary-banner">Transcript &#8212; Annotations Summary</div>
      <div class="ac-body">${innerHtml}</div>
    </div>`;
  }

  bindIssuesIndex(summaryOfAnnots) {
    if (!summaryOfAnnots?.length) return '';

    const sectionIcons: Record<string, string> = {
      'QFact':      '&#10003;',
      'Full Fact':  '&#8801;',
      'Quick Mark': '&#8801;',
      'DocLink':    '&#8599;',
    };

    let mainContent = `<div class="page page-break indexpage p-0">
      <div class="annot-summary-banner">Transcript &#8212; Annotations Summary</div>
      <div class="ac-body">`;

    summaryOfAnnots.forEach((item) => {
      const icon = sectionIcons[item.title] || '&#8801;';
      const showFactLink = item.title === 'Full Fact' || item.title === 'DocLink';

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

  /**
   * Wrap a plain-text range [plainStart, plainEnd) of `formatted` with the
   * given open/close tags, while respecting any HTML tags that may already
   * be present in `formatted` (e.g. <strong>...</strong> inserted by
   * transformQuestionOrSpicker).
   *
   * Plain-text positions advance only on non-tag characters; when the range
   * crosses an existing tag boundary we close and reopen the wrapping tag
   * around the intervening tag(s), which keeps the resulting HTML well-nested
   * even when highlight ranges straddle <strong> boundaries.
   */
  wrapPlainRangeWithTagSkipping(
    formatted: string,
    plainStart: number,
    plainEnd: number,
    openTag: string,
    closeTag: string,
  ): string {
    if (plainStart >= plainEnd || !formatted) return formatted;
    let output = '';
    let plainPos = 0;
    let inTag = false;
    let inRange = false;
    for (let i = 0; i < formatted.length; i++) {
      const c = formatted[i];
      if (inTag) {
        output += c;
        if (c === '>') {
          inTag = false;
          // Reopen range span if we're still inside the target range
          if (inRange && plainPos < plainEnd) output += openTag;
        }
        continue;
      }
      if (c === '<') {
        // Entering a tag — close the range span if currently open
        if (inRange) output += closeTag;
        output += c;
        inTag = true;
        continue;
      }
      // Plain text character
      if (plainPos === plainStart && !inRange) {
        output += openTag;
        inRange = true;
      }
      if (plainPos === plainEnd && inRange) {
        output += closeTag;
        inRange = false;
      }
      output += c;
      plainPos++;
    }
    if (inRange) output += closeTag;
    return output;
  }
}