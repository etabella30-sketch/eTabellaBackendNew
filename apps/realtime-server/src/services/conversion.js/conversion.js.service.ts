import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConversionJsService {



  // Function to convert character codes to string
  private charCodesToString(charCodes: number[]): string {
    return String.fromCharCode(...charCodes).trim();
  }

  // Function to process a single file
  private processFile(filePath: string, pageIndex: number): any[] {
    debugger;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Page dumps routinely contain literal null entries (holes serialized by
    // JSON.stringify when a line lands mid-page) — never index into item bare.
    return data.map((item, index) => ({
      time: (item?.length ?  item[0] : null),
      lineIndex: index + 1,
      lines: [this.charCodesToString(item?.length ? item[1] : [])],
      formate: item?.[3],
      unicid: item?.[6]
    }));
  }

  // Convert an in-memory session map ({ page: rawTupleLines[] }) into the same
  // page-object shape processDirectory produces (published s_*.json contract).
  pagesFromSessionMap(sessionData: { [page: number]: any[] }): any[] {
    const pages = Object.keys(sessionData || {}).map(Number).filter(p => !isNaN(p)).sort((a, b) => a - b);
    return pages.map((page, idx) => ({
      msg: idx + 1,
      page,
      data: (sessionData[page] || []).map((item, index) => ({
        time: (item?.length ? item[0] : null),
        lineIndex: index + 1,
        lines: [this.charCodesToString(item?.length ? item[1] : [])],
        formate: item?.[3],
        unicid: item?.[6]
      }))
    }));
  }

  // Function to process all files in the directory
  // preserveRealPageNumbers: keep the page number from the filename instead of
  // renumbering sequentially — required when annotations fetched with live page
  // numbering ('N') are overlaid on the result and the folder has gaps.
  processDirectory(dirPath: string, preserveRealPageNumbers = false): any[] {
    const output = [];
    const files = fs.readdirSync(dirPath)
      .filter(file => /^page_(\d+)\.json$/.test(file))
      .sort((a, b) => {
        const aPageNum = parseInt(a.match(/page_(\d+)\.json/)[1], 10);
        const bPageNum = parseInt(b.match(/page_(\d+)\.json/)[1], 10);
        return aPageNum - bPageNum;
      });

    files.forEach((file, pageIndex) => {
      const filePath = path.join(dirPath, file);
      // One unreadable/torn page must not blank the whole session.
      let processedData = [];
      try {
        processedData = this.processFile(filePath, pageIndex + 1);
      } catch (error) {
        console.error(`Skipping unreadable page file ${filePath}:`, error?.message);
      }
      const realPage = parseInt(file.match(/page_(\d+)\.json/)[1], 10);
      output.push({
        msg: pageIndex + 1,
        page: preserveRealPageNumbers ? realPage : pageIndex + 1,
        data: processedData
      });
    });

    return output;
  }

}
