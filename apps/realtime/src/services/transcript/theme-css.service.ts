import { Injectable } from '@nestjs/common';
import { FontOption, ThemeConfig } from '../../interfaces/Transcript.interface';

@Injectable()
export class ThemeCssService {
  private fontOptions: FontOption[] = [
    {
      nValue: 1,
      cKey: 'Calibri',
      jOther: { font: 'calibri' }
    },
    {
      nValue: 2,
      cKey: 'Georgia',
      jOther: { font: 'georgia' }
    },
    {
      nValue: 3,
      cKey: 'courier',
      jOther: { font: 'courier' }
    },
    {
      nValue: 4,
      cKey: 'Times New Roman',
      jOther: { font: 'times' }
    },
    {
      nValue: 5,
      cKey: 'Open Sans',
      jOther: { font: 'Open Sans' }
    },
    {
      nValue: 6,
      cKey: 'Arial',
      jOther: { font: 'arial' }
    },
  ];

  generateCssVariables(theme: ThemeConfig): Record<string, string> {
    const variables: Record<string, string> = {};

    // Helper function to set CSS variable
    const setCssVariable = (name: string, value: string) => {
      variables[name] = value;
    };

    // Set gap variables with direct values from theme
    // For "auto" (0 value), use fixed default of 5px
    setCssVariable('--cover-line-spacing', theme?.nCSpacing == 1 ? '1.2' : '1.8');
    setCssVariable('--before-gap', theme?.nBFHeight === 0 ? '5px' : `${theme?.nBFHeight || 5}px`);
    setCssVariable('--between-gap', theme?.nBTHeight === 0 ? '5px' : `${theme?.nBTHeight || 5}px`);
    setCssVariable('--appear-gap', theme?.nAHeight === 0 ? '5px' : `${theme?.nAHeight || 5}px`);
    setCssVariable('--titlepage-header-gap', theme?.nTHeight === 0 ? '5px' : `${theme?.nTHeight || 5}px`);

    setCssVariable('--casetype-align', theme?.cCAlign == 'C' ? 'center' : 'left');
    setCssVariable('--appearances-align', theme?.cBehalfAlign == 'C' ? 'center' : 'left');
    setCssVariable('--casetype-transform', theme?.bCIsCaps ? 'uppercase' : 'none');

    // Cover Page Variables
    const coverFont = theme?.nCFontid ?
      this.fontOptions.find(f => f.nValue == theme?.nCFontid)?.jOther.font || 'courier' :
      'courier';
    setCssVariable('--cover-font-family', coverFont);
    setCssVariable('--cover-font-size', theme?.nCFontsize ? `${theme?.nCFontsize}pt` : '12pt');
    // Body Text Variables
    const bodyFont = theme?.nBFont ?
      this.fontOptions.find(f => f.nValue == theme?.nBFont)?.jOther.font || 'courier' :
      'courier';
    setCssVariable('--body-font-family', bodyFont);
    setCssVariable('--body-font-size', `${theme?.nBFontsize || 10}pt`);
    setCssVariable('--body-letter-spacing', theme?.nBLetterspacing == null ? '0.5px' : `${theme?.nBLetterspacing}px`);

    setCssVariable('--body-line-spacing', theme?.nBLinespacing == 0 ? '2px' : `${theme?.nBLinespacing}px`);

    // Page Number Variables
    const pageNumberFont = theme?.nPNFont ?
      this.fontOptions.find(f => f.nValue == theme?.nPNFont)?.jOther.font || 'courier' :
      'courier';
    setCssVariable('--page-number-font-family', pageNumberFont);
    const pageNumberFontSize = theme?.nPNFontsize == null ? '10pt' : `${theme?.nPNFontsize}pt`;
    setCssVariable('--page-number-font-size', pageNumberFontSize);
    setCssVariable('--page-number-vertical-align', theme?.cPNAlignTB ? theme?.cPNAlignTB.toLowerCase() : 'bottom');
    setCssVariable('--page-number-horizontal-align', theme?.cPNAlignRL ? theme?.cPNAlignRL?.toLowerCase() : 'right');

    // Line Number Variables
    const lineNumberFont = theme?.nLFont ?
      this.fontOptions.find(f => f.nValue == theme?.nLFont)?.jOther.font || 'courier' :
      'courier';
    setCssVariable('--line-number-font-family', lineNumberFont);
    const lineNumberFontSize = theme?.nLFontsize == null ? '10pt' : `${theme?.nLFontsize}pt`;
    setCssVariable('--line-number-font-size', lineNumberFontSize);
    setCssVariable('--line-number-display', theme?.bLNShow == null ? 'inline' : (theme?.bLNShow ? 'inline' : 'none'));

    // Time Stamp Variables
    const timestampFont = theme?.nTFont ?
      this.fontOptions.find(f => f.nValue == theme?.nTFont)?.jOther.font || 'courier' :
      'courier';
    setCssVariable('--timestamp-font-family', timestampFont);
    const timestampFontSize = theme?.nTFontsize == null ? '10pt' : `${theme?.nTFontsize}pt`;
    setCssVariable('--timestamp-font-size', timestampFontSize);
    setCssVariable('--timestamp-display', theme?.bTShow == null ? 'inline' : (theme?.bTShow ? 'inline' : 'none'));

    // Header Footer Variables
    const headerFooterFont = theme?.nHFont ?
      this.fontOptions.find(f => f.nValue == theme?.nHFont)?.jOther.font || 'courier' :
      'courier';
    setCssVariable('--header-footer-font-family', headerFooterFont);
    const headerFooterFontSize = theme?.nHFontsize == null ? '10pt' : `${theme?.nHFontsize}pt`;
    setCssVariable('--header-footer-font-size', headerFooterFontSize);
    setCssVariable('--header-footer-display', theme?.bHShow == null ? 'table' : (theme?.bHShow ? 'table' : 'none'));
    setCssVariable('--header-footer-cover-display', theme?.bHCover == null ? 'block' : (theme?.bHCover ? 'block' : 'none'));

    // Header Footer Position Variables
    setCssVariable('--caseName-vertical', (theme?.cPCaseName || '').includes('B') ? 'bottom' : 'top');
    setCssVariable('--caseName-horizontal', (theme?.cPCaseName || '').includes('R') ? 'right' : 'left');
    setCssVariable('--volumeDate-vertical', (theme?.cPVolumeDate || '').includes('B') ? 'bottom' : 'top');
    setCssVariable('--volumeDate-horizontal', (theme?.cPVolumeDate || '').includes('R') ? 'right' : 'left');
    setCssVariable('--company-vertical', (theme?.cPCompany || '').includes('B') ? 'bottom' : 'top');
    setCssVariable('--company-horizontal', (theme?.cPCompany || '').includes('R') ? 'right' : 'left');
    setCssVariable('--companyInfo-vertical', (theme?.cPCompanyInfo || '').includes('B') ? 'bottom' : 'top');
    setCssVariable('--companyInfo-horizontal', (theme?.cPCompanyInfo || '').includes('R') ? 'right' : 'left');

    // Style Variables with specific weights
    setCssVariable('--case-type-bold', (theme?.jCBold || '').includes('C') ? '700' : '400');
    setCssVariable('--parties-bold', (theme?.jCBold || '').includes('P') ? '700' : '400');
    setCssVariable('--before-bold', (theme?.jCBold || '').includes('B') ? '700' : '400');
    setCssVariable('--appearances-bold', (theme?.jCBold || '').includes('A') ? '700' : '400');
    setCssVariable('--question-bold', (theme?.jCBold || '').includes('Q') ? '700' : '400');
    setCssVariable('--speaker-bold', (theme?.jCBold || '').includes('S') ? '700' : '400');

    return variables;
  }

  generateCssVariablesString(variables: Record<string, string>): string {
    return Object.entries(variables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n              ');
  }

  getBaseCss(): string {
    return `

      @font-face {
        font-family: 'calibri';
        src: url('./assets/fonts/styles/calibri-regular.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'calibri';
        src: url('./assets/fonts/styles/calibri-bold.ttf') format('truetype');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: 'courier';
        src: url('./assets/fonts/styles/CourierPrime-Bold.ttf') format('truetype');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: 'times';
        font-style: normal;
        font-weight: normal;
        src: local('Times New Roman'), url(./assets/fonts/styles/times.woff) format('woff')
      }


      @font-face {
        font-family: 'times';
        font-style: normal;
        font-weight: normal;
        src: local('Times New Roman'), url(./assets/fonts/styles/times.woff) format('woff')
      }

      @font-face {
        font-family: 'georgia';
        font-style: normal;
        font-weight: normal;
        src: local('Georgia Regular'), url(./assets/fonts/styles/georgia.woff) format('woff');
      }

      @font-face {
        font-family: 'arial';
        font-style: normal;
        font-weight: normal;
        src: local('Arial Regular'), url(./assets/fonts/styles/ARIAL.woff) format('woff');
      }

      @font-face {
        font-family: 'verdana';
        font-style: normal;
        font-weight: normal;
        src: local('Verdana'), url(./assets/fonts/styles/Verdana.ttf) format('ttf');
      }

      @font-face {
        font-family: 'Opensans';
        font-style: normal;
        font-weight: 700;
        font-stretch: 100%;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4jaVIGxA.woff2) format('woff2');
        unicode-range: U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF;
      }


      * {
    -webkit-print-color-adjust: exact !important;   /* Chrome, Safari 6 – 15.3, Edge */
    color-adjust: exact !important;                 /* Firefox 48 – 96 */
    print-color-adjust: exact !important;           /* Firefox 97+, Safari 15.4+ */
}


      * {
        padding: 0;
        margin: 0;
        box-sizing: border-box;
      }


      p, span, pre {
          line-height: 1.5;
          }

      body {
        height: 100%;
        overflow: auto;
      }

      .page-break {
        page-break-before: always;
      }


@media print {
  @page {
    size: A4;
    margin: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  .page {
    box-sizing: border-box;   /* include border in 210 × 297 mm */
    width: 210mm;
    height: 297mm;

    /* kill the 30-px padding that exists in screen CSS */
    margin: 0;

    /* optional: draw the border that hugs the paper */
    /* border: 1px solid #000;                              */
  }

   .pagebreak { page-break-before: always; }
}


      .page {
        padding: 30px;
        position: relative;
        min-height: 297mm;
        height: 297mm;
        font-family: var(--cover-font-family, 'courier');
        font-size: var(--cover-font-size, '12px');
        background-color: #fff;
        width: 210mm;
        margin: 0 auto 0px;
              box-sizing: border-box;

              
      }

      .titlepage {
        position: relative;
      }


      
      .titlepage.showBrand .cover-inner{
      border:none !important;
      padding: 40px 20px 40px 40px;
      }

      .titlepage.showBrand {
        padding: 0px 20px 20px 0px !important;
        display: flex;
        gap: 24px;
        overflow: hidden !important;
      }


      .page:not(.page.titlepage):not(.page.indexpage) {
        padding: 30px 80px !important;
      }


.titlepage *{
color:black;
}


      .titlepage .text-1 {
        max-width: 100%;
        height: 64px;
        text-align: center;
        white-space: pre-line;
        margin-bottom: 0px;
        min-height: fit-content;
        max-height: fit-content;
        font-family: var(--cover-font-family);
        font-size: var(--cover-font-size);
        font-weight: var(--case-type-bold);
        text-align: var(--casetype-align);
        text-transform: var(--casetype-transform);
      }

      .titlepage .text-center {
        text-align: center;
      }

      .titlepage .parties pre,
      .titlepage .appear pre,
      .titlepage .before pre{
        line-height: var(--cover-line-spacing, '1.2');
        min-height: calc(var(--cover-font-size, '14px') * var(--cover-line-spacing, '1.2'));
        }
      
      .titlepage .parties p,
      .titlepage .parties pre,
      .titlepage .parties span {
        font-weight: var(--parties-bold);
        white-space: pre-line;
      }

      .titlepage .before p,
      .titlepage .before pre,
      .titlepage .before span {
        font-weight: var(--before-bold);
      }

      .titlepage .appear p,
      .titlepage .appear pre,
      .titlepage .appear span {
        font-weight: var(--appearances-bold);
        text-align: var(--appearances-align , center);
      }

      .titlepage p,
      .titlepage span,
      .titlepage pre {
        font-size: var(--cover-font-size, '14px');
        letter-spacing: var(--body-letter-spacing, '1.2px');
        font-family: var(--cover-font-family) !important;
        text-align: center;
        white-space: pre-line;
        line-height: var(--cover-line-spacing, '1.2');
      }

      .titlepage .text-end {
        text-align: end;
      }

      .titlepage .text-start {
        text-align: start;
      }

      .titlepage .divider {
        min-height: 1px;
        height: 1px;
        width: 100%;
        border-top:1px solid #c2c2c298;
        margin: 20px auto !important;
      }

      .titlepage .transriptby {
        text-align: center;
        font-family: var(--cover-font-family);
        font-size: var(--cover-font-size);
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .titlepage .maindivider {
        margin: 10px auto;
      }

      .titlepage-header {
        min-height: fit-content;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .parties {
        min-height: fit-content;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .before {
        min-height: fit-content;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .appear {
        min-height: fit-content;
        display: flex;
        flex-direction: column;
      }


      .maindivider {
        height: 1px;
        background-color: #c2c2c2;
        width: 100%;
        margin: 20px 0;
      }

      .no-margin {
        margin: 0px !important;
      }

      .line-table.brakline {
        height: calc((calc(calc(var(--timestamp-font-size) * 20 / 16) + var(--body-line-spacing))) + (calc(calc(var(--timestamp-font-size) * 20 / 16))));
      }

      .line-table {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--body-font-family);
        font-size: var(--body-font-size);
        min-height: fit-content;
        height: calc(calc(var(--timestamp-font-size) * 20 / 16) + var(--body-line-spacing) * 1) !important;
      }

      .timestamp {
        background: transparent !important;
        color: #000000;
        padding: 0 5px;
        font-size: var(--timestamp-font-size, '16px');
        text-align: right;
        white-space: nowrap;
        width: min-content;
        font-family: var(--timestamp-font-family);
        display: var(--timestamp-display);
        line-height: 1;
      }

      .line-no {
        background: transparent !important;
        color: #000000;
        padding: 0 5px;
        font-size: var(--line-number-font-size, '16px');
        text-align: right;
        white-space: nowrap;
        width: min-content;
        font-family: var(--line-number-font-family);
        display: var(--line-number-display);
        line-height: 1;
      }

      .line-text {
        color: #000000;
        padding: 0px 10px 0px 20px;
        font-size: var(--body-font-size, '17px');
        letter-spacing: var(--body-letter-spacing, '0.8px');
        height: fit-content;
        font-weight: var(--body-font-weight, 400);
        width: 100%;
        line-height: 1;
      }

      .line-text pre {
        font-size: var(--body-font-size, '17px');
        letter-spacing: var(--body-letter-spacing, '0.8px');
        font-weight: var(--body-font-weight, 400);
        font-family: var(--body-font-family);
        width: 100%;
        white-space: pre-wrap;
         line-height: 1.2;
      }

      .page-header *,.new-header *, .page-footer *{
      color:black;
      }
      .page-header,.new-header {
        font-size: var(--header-footer-font-size, '16px');
        font-family: var(--header-footer-font-family);
        display: var(--header-footer-display);
        width: 100%;
      }

      .page-header td,.new-header td {
        vertical-align: top;
        padding-bottom: 10px;
        width: 50%;
      }

      .page-footer {
        font-size: var(--header-footer-font-size, '16px');
        font-family: var(--header-footer-font-family);
        display: var(--header-footer-display);
        width: 100%;
      }

      .page-footer p,.page-footer span{
          font-size: var(--header-footer-font-size, '16px');
          font-family: var(--header-footer-font-family);
       
        }

.page-footer pre{
    white-space: pre-line;
}


      .page-header pre,.page-header p,.page-header span{
        font-size: var(--header-footer-font-size, '16px');
        font-family: var(--header-footer-font-family);
      }

      .page-header pre{
      white-space: pre-line;
      }


      .new-header pre,.new-header p,.new-header span{
        font-size: var(--header-footer-font-size, '16px');
        font-family: var(--header-footer-font-family);
      }

      .new-header pre{
      white-space: pre-line;
      }

      .page-footer td {
        vertical-align: top;
        padding-top: 10px;
        width: 50%;
      }

      .mainpageno {
        font-size: var(--page-number-font-size, '16px');
        font-family: var(--page-number-font-family);
      }

      .secondarypageno {
        font-size: var(--page-number-font-size, '16px');
        font-family: var(--page-number-font-family);
      }

      .head-right p,
      .head-left p {
        font-size: var(--header-footer-font-size, '16px');
        font-family: var(--header-footer-font-family);
      }

      .head-right {
        text-align: right;
        width: 50%;
      }

      .lines-wrapper {
        --item-count: 25;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .page-wrapper {
        gap: 10px;
        padding: 30px 0px;
        margin-top: 10px;
        margin-bottom: 20px;
        height: 100%;
        border-top: 1px solid rgba(194, 194, 194, 0.59);
        border-bottom: 1px solid rgba(194, 194, 194, 0.59);
      }

      .grid-container {
      padding: 10px 0px ;
        margin-top: 10px;
        margin-bottom: 5px;
        height: calc(100% - 80px);
        border-top: 1px solid rgba(194, 194, 194, 0.59);
        border-bottom: 1px solid rgba(194, 194, 194, 0.59);
       display: flex;
    flex-wrap: wrap;
      }

      .grid-container .lines-wrapper {
        gap: 0px !important;
        padding: 10px 0px 10px 10px;
        height: 50%;
        width: 50%;
      }

      .grid-container .lines-wrapper:nth-child(2) {
       border-bottom: 1px solid #c2c2c2;
       }

      .grid-container .lines-wrapper:nth-child(1) {
        border-right: 1px solid #c2c2c2;
        border-bottom: 1px solid #c2c2c2;
      }

      .grid-container .lines-wrapper:nth-child(3) {
        border-right: 1px solid #c2c2c2;
      }

      .grid-container .lines-wrapper:nth-child(4) {
      
      }

      .grid-container .line-text  pre, 
      .grid-container .line-text  { 
        font-size: 8px !important;
        line-height: 1;
        letter-spacing: 0px !important;
      }


      .grid-container .line-text  pre{
     height:fit-content !important;
      }

      .grid-container .line-text  {
    padding: 0px 0px 0px 15px !important;
      }
      .grid-container .line-text pre {
        font-size: 8px !important;
        line-height: 2;
          font-family: calibri, sans-serif !important;
      }

      .grid-container .line-no {
        font-size: 8px !important;
        line-height: 2;
         letter-spacing: 0px !important;
         font-family: calibri, sans-serif !important;
      }

      .grid-container .secondarypageno {
        font-size: 10px !important;
      }

      .grid-container .timestamp {
        font-size: 8px !important;
        line-height: 2;
        padding: 0 0px;
         letter-spacing: 0px !important;
           font-family: calibri, sans-serif !important;
      }

      .betweeen {
        letter-spacing: 1px !important;
        text-transform: uppercase;
      }

      p, span {
        letter-spacing: 0.5px;
        word-spacing: 2px;
      }

      .text-end {
        text-align: end;
      }

      .case-type {
        font-weight: var(--case-type-bold);
      }

      .parties {
        font-weight: var(--parties-bold);
      }

      .before-section {
        font-weight: var(--before-bold);
      }

      .appearances {
        font-weight: var(--appearances-bold);
      }

      .question {
        font-weight: var(--question-bold);
      }

      .speaker {
        font-weight: var(--speaker-bold);
      }


      .flex {
        display: flex;
      }

      .flex-col {
        flex-direction: column;
      }

      .gap-3 {
        gap: 12px;
      }

      .items-center {
        align-items: center;
      }

      .gap-2 {
        gap: 8px;
      }

      .justify-end {
        justify-content: flex-end;
      }

      .justify-start {
        justify-content: flex-start;
      }

      .justify-center {
        justify-content: center;
      }

      .justify-between {
        justify-content: space-between;
      }

      .whitespace-nowrap {
        white-space: nowrap;
      }

      .block {
        display: block;
      }

      .swape-page-Left:nth-child(even) .page-number-right {
        display: none;
      }

      .swape-page-Left:nth-child(odd) .page-number-left {
        display: none;
      }

      .swape-page-Right:nth-child(even) .page-number-left {
        display: none;
      }

      .swape-page-Right:nth-child(odd) .page-number-right {
        display: none;
      }

      .mb-3 {
        margin-bottom: 12px;
      }

      .bg-white {
        background-color: white;
      }


      .grid-container .line-table{
     height: fit-content !important;
     min-height: fit-content !important;
      }


      .appear-title{
        font-size: 18px;
        font-weight: 600;
        text-transform: uppercase;
        text-align: var(--appearances-align);
        letter-spacing: 2px;
        margin: 20px 0px;
        }
        .p-5{
        padding: 20px;
        }


.cover-inner{
  padding: 40px;
   border: 1px solid rgb(209, 209, 209); 
   height: 100%;
   width: 100%;
   z-index: 3;
}


#cBClaimentH{
margin-bottom: 10px;
}

.bg-layer{
position: absolute;
    right: calc(-339px / 2.4);
    bottom: calc(-440px / 3);
    width: 339px;
    height: 440px;
    z-index: 1;
    rotate: -32deg;
  }


.brand .brand-logo span{
}
.brand .brand-logo{
    height: 40px;
    width: 40px;
    background-color: #white;

}



.brand .bar{
  width: 100%;
  height: 100%;
  background-color: #F26522;  
}

.brand{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 2;
}

.new-header .right {
      width: 50%;
    }

    .new-header .left {
      width: 50%;
    }

    .new-header {
      display: flex;
    }



.container {
  width: 100%;
  padding: 0 49px 36px 0;
  /* min-height: 29.7cm;
  height: 29.7cm; */
}

.content-table {
  width: 100%;
}

.sidebar {
  background-color: #ff3d00;
  width: 109px;
  height: 447px;
}

.main-content {
  padding-top: 300px;
  padding-left: 20px;
  vertical-align: top;
  font: 600 10px Open Sans, sans-serif;
  color: #4f4f4f;
}

.case-name {
  color: #ff3d00;
  letter-spacing: -0.6px;
  font: 30px Open Sans, sans-serif;
  margin: 0;
}

.document-type {
  margin-top: 4px;
  font: 12px/133% Open Sans, sans-serif;
}

.document-info {
  font: 400 10px/12.5px Open Sans, sans-serif;
  margin-top: 4px;
}

.spacer {
  background-color: #fff;
  margin-top: 4px;
  height: 13px;
}

.export-info {
  font: 700 10px/14px Open Sans, sans-serif;
  margin-top: 4px;
}

.footer {
  padding-top: 520px;
  width: 141px;
  font: 400 12px/133% Open Sans, sans-serif;
  color: #ff3d00;
  float: right;
}

.logo {
  display: block;
  margin: 0 auto;
  width: 105px;
  max-width: 100%;
}

.powered-by {
  font-family: Open Sans, sans-serif;
  margin-top: 24px;
  text-align: center;
}


.container-inline-block {
  font-size: 0;
  /* Remove space between inline-block elements */
}

.container-inline-block .box {
  display: inline-block;
  width: 25%;
  font-size: 16px;
  /* Reset font size for content */
  vertical-align: top;
}

.anothead {
  padding: 10px 24px;
  background-color: #4f4f4f;
  color: #fff;
  font-size: 24px;
  font-weight: 500;
}

.data-header {
  padding: 10px 24px;
  background-color: #6b6b6b;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 20px;
}

.heading {
  padding: 10px 24px;
  color: #4f4f4f;
  font-size: 24px;
  font-weight: 600;
}


.p-0 {
  padding: 0 !important;
}

.p-3 {
  padding: 20px !important;
}

.mb-1 {
  margin-bottom: 5px;
}

.mb-2 {
  margin-bottom: 10px;
}

.mb-3 {
  margin-bottom: 20px;
}

.tabbody .pageno {
  text-decoration: underline;
  color: #ff3c00;
  cursor: pointer;
}

.tabhead .pageno,
.tabbody .pageno {
  width: 8%;
}



.tabbody .note{
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

.tabhead .note,
.tabbody .note {
  padding-left: 10px;
  padding-right: 5px;
  width: 33.5%;
}

.tabhea .issue,
.tabbody .issue {
  width: 25%;
}

.tabbody div {
  vertical-align: top;
}


a{
    font-family: cursive;
}

.tabhead div,
.tabbody div {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  color: #4f4f4f;
  line-height: 1.5;
  letter-spacing: 0;
}

.tabbody {
  background-color: #f1f1f1;
  border-radius: 10px;
  margin-top: 10px;
  display: flex;
  align-items: center;
   min-height: 50px;
}

.tabhead {
  background-color: #c4c4c4;
  border-radius: 20px;
  display: flex;
}

.tabhead,
.tabbody {
  padding: 5px 10px 7px;
     
}

.issuewrap {
  width: 100%;
  margin-bottom: 3px;
}

.issuewrap .impact {
  width: 10%;
}

.issuewrap .rel {
  width: 25%;
}


.issuewrap .name .text {
  padding-left: 5px;
}

.issuewrap .name {
  width: 60%;
}
.tabbody .source {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
  font-size: 11px;
  line-height: 1.1;
}

.tabhead .source,
.tabbody .source {
  width: 33.5%;
 
}

.issuebar {
  padding: 2px 2px;
  border-radius: 10px;
  background: red;
}

.relspn {
  padding: 2px 5px;
  background: white;
  border-radius: 10px;
}







.highlight {
  background-color: yellow;
}

.page-header {
  font-size: 10px;
  width: 100%;
}

.page-header td {
  vertical-align: top;
  padding-bottom: 20px;
}


.maindivider {
  height: 2px;
  width: 100%;
  background-color: #000;
  margin: 10px auto;
}

.text-end {
  text-align: end;
}

.data-footer {
  position: absolute;
  bottom: -60px;
  left: 60px;
  width: 100%;
}

.pagination {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 0 65px;
}


.document-type {
  font-size: 21px !important;
}

.export-info {
  font-size: 16px !important;
  line-height: 1.5 !important;
}






.line-SPKR .line-text {
  padding-left: 20px;
}

.line-SPKR+.line-SPKR .line-text {
  padding-left: 80px;
}

.line-SPKR-CONTINUE .line-text {
  padding-left: 120px;
}

.line-ANS-CONTINUE .line-text {
  text-align: center;
}

.line-RHT-FLS .line-text {
  text-align: end;
}

.line-SPKR-CONTINUE+.line-SPKR-CONTINUE .line-text {
  padding-left: 80px;
}

.line-PRNTH .line-text {
  width: calc(100% - 68px);
}




  .line-no {
    text-decoration: none;
    color: inherit;
  }
  @media print {
    a.line-no::after {
      content: none !important;
    }
  }


.highlight-layer1 {
  position: absolute;
  top: 0;
  bottom: 0;
  opacity: 0.8;
  z-index: 0; /* behind text */
}



    `;
  }
}