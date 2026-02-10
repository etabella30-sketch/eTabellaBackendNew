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
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data.map((item, index) => ({
        time: (item?.length ?  item[0] : null),
        lineIndex: index + 1,
        lines: [this.charCodesToString(item?.length ? item[1] : [])],
        unicid: item[6]
      }));
    } catch (error) {
      return []
    }

  }

  // Function to process all files in the directory
  processDirectory(dirPath: string): any[] {
    const output = [];
    try {
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
    } catch (error) {
    }


    return output;
  }

}
