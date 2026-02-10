import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { ConfigService } from '@nestjs/config';
import { hyperlinkFiles, hyperlinkProcess, searchedResult } from '../../interfaces/hyperlink.interface';
import { promises as fs } from 'fs';
import * as fs_original from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class HyperlinksearchService {
  constructor(private readonly config: ConfigService) { }

  async createHyperlinkFile(fileinfo: hyperlinkFiles, jobData: hyperlinkProcess, searchTermsPath: string): Promise<boolean> {



    const outputPath = this.config.get('HYPERLINK_OUTPUT_PATH')

    try {
      await fs.access(outputPath);
    } catch (error) {
      await fs.mkdir(outputPath, { recursive: true });
    }



    const csvFilepath = path.join(outputPath, `search_results${fileinfo.nBundledetailid}.csv`);
    // const pdfPath = path.join(this.config.get('ASSETS'), fileinfo.cPath);
    const pdfPath = (fileinfo.cPath);

    /*try {
      await fs.access(pdfPath);
    } catch (error) {
      console.error('ERROR:', `File not found: ${pdfPath}`);
      return false;
    }*/

    try {

      try {
        await fs.access(this.config.get('TEMP_PATH'));
      } catch (error) {
        await fs.mkdir(this.config.get('TEMP_PATH'), { recursive: true });
      }

      const tempPath = path.join(this.config.get('TEMP_PATH'), `temp_${(fileinfo.nBundledetailid || new Date().getTime().toString())}.pdf`);
      const params = [
        this.config.get((jobData.isDeepscan ? 'PY_HYPERLINK_DEEP' : 'PY_HYPERLINK')),
        pdfPath,
        (jobData.isDeepscan ? searchTermsPath : fileinfo.nBundledetailid),
        csvFilepath,
        fileinfo.nBundledetailid,
        this.config.get('DO_SPACES_BUCKET_NAME'),
        this.config.get('DO_SPACES_KEY'),
        this.config.get('DO_SPACES_SECRET'),
        this.config.get('DO_SPACES_ENDPOINT'),
        tempPath
      ];
      console.log('INFO:', 'Python command:', this.config.get('pythonV'), params.join(' '));
      const pythonProcess = spawn(this.config.get('pythonV'), params,
        {
          env: {
            ...process.env,
            PYTHONIOENCODING: "UTF-8",
            DB_DATABASE: this.config.get('DB_DATABASE'),
            DB_USERNAME: this.config.get('DB_USERNAME'),
            DB_PASSWORD: this.config.get('DB_PASSWORD'),
            DB_HOST: this.config.get('DB_HOST'),
            DB_PORT: this.config.get('DB_PORT')
          },
        });

      pythonProcess.stdout.on('data', (data: Buffer) => {
        console.log('\n\r\n\r\n\r\n\rINFO:', data.toString());


        const log_msg = data.toString();

        fs_original.appendFile('hyperlink_test.txt', log_msg + '\n', (err) => {
          if (err) {
            console.error('Error appending to file:', err);
            throw err;
          }
          console.log('File updated successfully!');
        });

      });
      pythonProcess.stderr.on('data', (data: Buffer) => {
        console.log('\n\r\n\r\n\r\n\rERROR:', data.toString());
      });
      return new Promise((resolve, reject) => {
        pythonProcess.on('error', (err) => {
          console.error('ERROR:', err);
          reject(err);
        });
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(`Python process exited with code ${code}`);
            resolve(false);
            return;
          }
          resolve(true);
        });
      });
    } catch (error) {
      console.error('ERROR:', error);
      return false;
    }
  }


  async createIndexHyperlinkFile(fileinfo: hyperlinkFiles, jobData: hyperlinkProcess, tempFilePath: string, searchResults: any[], search_termsWithbundle: any[]): Promise<boolean> {
    console.log('CREATING INDEX')
    const filterdata: any[] = [];



    // const pdfPath = path.join(this.config.get('ASSETS'), fileinfo.cPath);
    const pdfPath = fileinfo.cPath;

    // try {
    //   await fs.access(pdfPath);
    // } catch (error) {
    //   console.log('ERROR:', `File not found: ${pdfPath}`);
    //   return false;
    // }

    try {

      const tempPath = path.join(this.config.get('TEMP_PATH'), `temp_${(fileinfo.nBundledetailid || new Date().getTime().toString())}.pdf`);
      const params = [
        this.config.get('PY_HYPERLINK_INDEX'),
        pdfPath,
        tempFilePath,
        'A',
        'B',
        this.config.get('DO_SPACES_BUCKET_NAME'),
        this.config.get('DO_SPACES_KEY'),
        this.config.get('DO_SPACES_SECRET'),
        this.config.get('DO_SPACES_ENDPOINT'),
        tempPath
      ];
      // [
      //   this.config.get('PY_HYPERLINK_INDEX'),
      //   pdfPath,
      //   tempFilePath
      // ]
      console.log(params)
      console.log('INFO:', 'Python command:', this.config.get('pythonV'), params.join(' '));
      const pythonProcess = spawn(this.config.get('pythonV'), params,
        {
          env: {
            ...process.env,
            PYTHONIOENCODING: "UTF-8",
            DB_DATABASE: this.config.get('DB_DATABASE'),
            DB_USERNAME: this.config.get('DB_USERNAME'),
            DB_PASSWORD: this.config.get('DB_PASSWORD'),
            DB_HOST: this.config.get('DB_HOST'),
            DB_PORT: this.config.get('DB_PORT')
          },
        });

      pythonProcess.stdout.on('data', (data: Buffer) => {
        try {

          let rows = data.toString("utf8").split("TOEND");
          l1: for (let x of rows) {
            let obj: searchedResult = {} as searchedResult;

            if (x.includes("PAGENO")) {
              let array = x.split(",");
              l2: for (let y of array) {
                if (y.includes("PAGENO")) {
                  obj.page = parseInt(y.split(":")[1]);
                } else if (y.includes("Term:")) {
                  obj.cTerm = y.split(":")[1].trim();
                } else if (y.includes("x:")) {
                  obj.x = parseFloat(y.split(":")[1]);
                } else if (y.includes("y:")) {
                  obj.y = parseFloat(y.split(":")[1]);
                } else if (y.includes("x1:")) {
                  obj.width = parseFloat(y.split(":")[1]) - obj.x;
                } else if (y.includes("y1:")) {
                  obj.height = parseFloat(y.split(":")[1]) - obj.y;
                  obj.y = obj.y + obj.height;
                } else if (y.includes("pref:")) {
                  obj.prefix = y.split(":")[1].trim();
                } else if (y.includes("Hword:")) {
                  try {
                    if (y.includes("-")) {
                      obj.redirectpage = parseInt(
                        y
                          .split(":")[1]
                          .split("-")
                        [y.split(":")[1].split("-").length - 1].trim()
                      );
                    }
                  } catch (error) { }
                } else if (y.includes("TOEND")) {
                  break l2;
                }
              }
            }

            if (Object.keys(obj).length) {
              if (
                filterdata.findIndex(
                  (a) => a.x == obj.x && a.y == obj.y && a.page == obj.page
                ) == -1
              ) {
                filterdata.push(obj);
              }
            }
          }
        } catch (error) {
          console.log('ERROR:', error);
        }




      });

      return new Promise((resolve, reject) => {

        pythonProcess.stderr.on('data', (data: Buffer) => {
          console.log(`stderr: ${data}`);
          searchResults = [];
          resolve(false);

        });

        pythonProcess.on('error', (err) => {
          console.log('ERROR:', err);
          reject(err);
        });
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.log(`Python process exited with code ${code}`);
            resolve(false);
            return;
          }


          if (filterdata && filterdata.length) {
            for (let rowobject of filterdata) {
              try {
                if (rowobject) {
                  if (!rowobject.cTerm) {
                    rowobject.cTerm = ''
                  }
                  if (!rowobject.cTerm.includes("ALPHA$-")) {
                    let bd_id = null;
                    try {
                      let ls_obj = search_termsWithbundle.find(
                        (a) => a.cTerm == rowobject.cTerm
                      );
                      if (ls_obj) {
                        bd_id = ls_obj.nBundledetailid;
                      }
                      if (rowobject.prefix && rowobject.prefix != 'None') {
                        let neid = rowobject.prefix.replace(`ALPHA$-${rowobject.cTerm}-`, '')
                        if (neid) {
                          bd_id = neid;
                        }
                      }
                    } catch (error) { }
                    let ojs = {
                      page: rowobject.page,
                      type: "strikeout",
                      uuid: uuidv4(),
                      tab: rowobject.cTerm,
                      rects: [
                        {
                          x: rowobject.x,
                          y: rowobject.y,
                          width: rowobject.width,
                          height: rowobject.height,
                          bundledetailid: bd_id,
                          redirectpage: rowobject.redirectpage || 1,
                        },
                      ]
                    };
                    searchResults.push(ojs);
                  } else {
                    if (searchResults.length) {
                      try {
                        let neid = rowobject.cTerm.split("-")[rowobject.cTerm.split("-").length - 1];
                        if (neid) {
                          searchResults[searchResults.length - 1]["bundledetailid"] = neid;
                        }
                      } catch (error) { }
                    }
                  }
                }
              } catch (error) {
              }
            }
          }

          resolve(true);
        });
      });
    } catch (error) {
      console.log('ERROR:', error);
      return false;
    }
  }
}
