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
    // A line the live feed never saved is stored as null. Keep its slot as a
    // blank line so the lines after it keep their page:line numbers; it takes
    // the nearest saved line's time so the timestamp stays parseable.
    let lastTime = data.find(item => item?.length)?.[0] ?? null;
    return data.map((item, index) => {
      if (!item?.length) {
        return { time: lastTime, lineIndex: index + 1, lines: [''], formate: 'FL', unicid: null };
      }
      lastTime = item[0];
      return {
        time: item[0],
        lineIndex: index + 1,
        lines: [this.charCodesToString(item[1])],
        formate:item[3],
        unicid: item[6]
      };
    });
  }

  // Function to process all files in the directory
  processDirectory(dirPath: string): any[] {
    const output = [];
    const files = fs.readdirSync(dirPath)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        const aPageNum = parseInt(a.match(/page_(\d+)\.json/)[1], 10);
        const bPageNum = parseInt(b.match(/page_(\d+)\.json/)[1], 10);
        return aPageNum - bPageNum;
      });

    files.forEach((file, pageIndex) => {
      const filePath = path.join(dirPath, file);
      const processedData = this.processFile(filePath, pageIndex + 1);
      output.push({
        msg: pageIndex + 1,
        page: pageIndex + 1,
        data: processedData
      });
    });

    return output;
  }

}
