import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { pagesFromSessionMap, shapeTranscriptLines } from '@app/rt-features/transcript-shape';

/**
 * The transcript page shaping of realtime-server, over the shared transcript-shape feature since Phase 6 of the
 * shared-libraries plan (the venue box executes the same functions on its own pages): the published `s_*.json`
 * contract `{msg, page, data:[{time, lineIndex, lines, formate, unicid}]}`. Only the file system walking stays here.
 */
@Injectable()
export class ConversionJsService {

  // Function to process a single file
  private processFile(filePath: string, pageIndex: number): any[] {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Page dumps routinely contain literal null entries (holes serialized by
    // JSON.stringify when a line lands mid-page) — the shared shaper keeps the hole as an empty numbered line.
    return shapeTranscriptLines(data);
  }

  // Convert an in-memory session map ({ page: rawTupleLines[] }) into the same
  // page-object shape processDirectory produces (published s_*.json contract).
  pagesFromSessionMap(sessionData: { [page: number]: any[] }): any[] {
    return pagesFromSessionMap(sessionData);
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
