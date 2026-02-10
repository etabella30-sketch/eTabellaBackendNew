import { DbService } from '@app/global/db/pg/db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { Body, Inject, Injectable } from '@nestjs/common';
import { CaseComboRequest, DeleteTranscript, fileJSONRequest, SessionComboRequest, ThemeBuilder, ThemeCreationResonce, ThemeDetailRequest, ThemeRequest, ThemeResonce, TranscriptBuilder, TranscriptCreationResonce, TranscriptDetailRequest, TranscriptFieldRequest, TranscriptPublishReq, TranscriptRequest } from '../../interfaces/Transcript.interface';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { TranscriptHtmlService } from './transcript-html.service';


@Injectable()
export class TranscriptService {

    private readonly logApplication: string = 'realtime/transcript';
    constructor(
        private readonly config: ConfigService, private readonly db: DbService, private logService: LogService,
        private readonly transcriptHtmlService: TranscriptHtmlService
    ) { }

    async transcriptbuilder(body: TranscriptBuilder): Promise<TranscriptCreationResonce> {
        try {
            this.logService.info(`Creating transcript: ${body.cTransid || 'new'}`, this.logApplication);
            let res = await this.db.executeRef('transcripts_builder', body, 'transcript');
            if (res.success) {
                this.logService.info(`Transcript creation successful: ${res.data[0][0]?.nTransid || ''}`, this.logApplication);
                return res.data[0][0];
            } else {
                this.logService.error(`Transcript creation failed: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Creation failed', error: res.error }
            }
        } catch (error) {
            this.logService.error(`Exception in transcriptbuilder: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error creating transcript', error: error.message };
        }
    }

    async themebuilder(body: ThemeBuilder): Promise<ThemeCreationResonce> {
        try {
            this.logService.info(`Creating theme: ${body.cName}`, this.logApplication);
            let res = await this.db.executeRef('theme_builder', body, 'transcript');
            if (res.success) {
                this.logService.info(`Theme creation successful: ${body.cName}`, this.logApplication);
                return res.data[0][0];
            } else {
                this.logService.error(`Theme creation failed: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Creation failed', error: res.error }
            }
        } catch (error) {
            this.logService.error(`Exception in themebuilder: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error creating theme', error: error.message };
        }
    }


    async getTranscripts(body: TranscriptRequest): Promise<ThemeResonce> {
        try {
            this.logService.info(`Fetching transcript list for master: ${body.nMasterid}`, this.logApplication);
            let res = await this.db.executeRef('list_transcripts', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved transcript list`, this.logApplication);
                return res.data[0];
            } else {
                this.logService.error(`Failed to fetch transcript list: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } catch (error) {
            this.logService.error(`Exception in getTranscripts: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching transcripts', error: error.message };
        }
    }

    async gettranscriptDetail(body: TranscriptDetailRequest): Promise<ThemeResonce> {
        try {
            this.logService.info(`Fetching transcript details for ID: ${body.cTransid}`, this.logApplication);
            let res = await this.db.executeRef('get_transcript_detail', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved transcript details`, this.logApplication);
                return res.data[0][0];
            } else {
                this.logService.error(`Failed to fetch transcript details: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } catch (error) {
            this.logService.error(`Exception in gettranscriptDetail: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching transcript details', error: error.message };
        }
    }

    async getTheme(body: ThemeRequest): Promise<ThemeResonce> {
        try {
            this.logService.info(`Fetching theme list for master: ${body.nMasterid}`, this.logApplication);
            let res = await this.db.executeRef('get_theme_list', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved theme list`, this.logApplication);
                return res.data[0];
            } else {
                this.logService.error(`Failed to fetch theme list: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } catch (error) {
            this.logService.error(`Exception in getTheme: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching themes', error: error.message };
        }
    }



    async getThemeDetail(body: ThemeDetailRequest): Promise<ThemeResonce> {
        try {
            this.logService.info(`Fetching theme details for ID: ${body.cThemeid}`, this.logApplication);
            let res = await this.db.executeRef('get_theme_detail', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved theme details`, this.logApplication);
                return res.data[0][0];
            } else {
                this.logService.error(`Failed to fetch theme details: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } catch (error) {
            this.logService.error(`Exception in getThemeDetail: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching theme details', error: error.message };
        }
    }


    async case_combo(body: CaseComboRequest): Promise<any> {
        try {
            this.logService.info(`Fetching case combination data for master: ${body.nMasterid}`, this.logApplication);
            let res = await this.db.executeRef('get_case_combo', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved case combination data`, this.logApplication);
                return res.data[0];
            } else {
                this.logService.error(`Failed to fetch case combination: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } catch (error) {
            this.logService.error(`Exception in case_combo: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching case combinations', error: error.message };
        }
    }


    async sessionCombo(body: SessionComboRequest): Promise<any> {
        try {
            this.logService.info(`Fetching session data for case: ${body.nCaseid}`, this.logApplication);
            let res = await this.db.executeRef('get_session', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved session data`, this.logApplication);
                return res.data[0];
            } else {
                this.logService.error(`Failed to fetch session data: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } catch (error) {
            this.logService.error(`Exception in sessionCombo: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching session data', error: error.message };
        }
    }


    async ConvertTextToJosn(body: fileJSONRequest): Promise<any> {

        const JSONfilePath = body.cPath.replace(/\.[^/.]+$/, '.json');

        const res = await this.exportJsonFile((this.config.get('REALTIME_PATH') + body.cPath), (this.config.get('REALTIME_PATH') + JSONfilePath));
        if (res.msg === 1) {
            this.logService.info(`Transfer completed successfully for file: ${body.cPath}`, this.logApplication);
            // fs.promises.unlink((this.config.get('REALTIME_PATH') + body.cPath))
            return { msg: 1, status: 'success', path: JSONfilePath };

        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }




    async exportJsonFile(filePath: string, JSONfilePath: string): Promise<any> {

        this.logService.info(`exportJsonFile transcript process started: ${this.config.get('PY_TRANSCRIPT_TRANSFER')} ${filePath}`, this.logApplication);
        try {
            const body = [
                this.config.get('PY_TRANSCRIPT_TRANSFER'),
                filePath,
                JSONfilePath
            ]
            console.log(`${this.config.get('PY_TRANSCRIPT_TRANSFER')} ${body.join(' ')}`);
            const pythonProcess = spawn(this.config.get('pythonV'), body);

            let dataBuffer = '';

            pythonProcess.stdout.on('data', (data: Buffer) => {
                dataBuffer += data.toString();
                this.logService.debug(`Python process output: ${data.toString()}`, this.logApplication);
            });

            pythonProcess.stderr.on('data', (data: Buffer) => {
                this.logService.error(`Python process error: ${data.toString()}`, this.logApplication);
            });

            return new Promise((resolve, reject) => {
                pythonProcess.on('error', (err) => {
                    this.logService.error(`Python process execution error: ${err}`, this.logApplication);
                    resolve({ msg: -1, value: 'Failed to fetch', error: err });
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        this.logService.error(`Python process exited with code ${code}`, this.logApplication);
                        resolve({ msg: -1, value: 'Invalid File format', error: `Error: The transcript does not match the expected format. Please check the draft file format.` });
                        return;
                    }
                    this.logService.info('Python process completed successfully', this.logApplication);
                    resolve({ msg: 1 });
                });
            });
        } catch (error) {
            this.logService.error(`Exception in exportJsonFile: ${error}`, this.logApplication);
            return { msg: -1, value: 'Failed to fetch', error: error }
        }

    }

    getTranscriptSummary(query: any) {
        try {
            this.logService.info(`Getting transcript summary for: ${query.cPath}`, this.logApplication);
            const filePath = this.config.get('REALTIME_PATH') + query.cPath;
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (!Array.isArray(data) || data.length === 0) {
                this.logService.error(`Invalid file format for transcript: ${query.cPath}`, this.logApplication);
                return { msg: -1, value: 'Invalid File format', error: `Error: The transcript does not match the expected format. Please check the draft file format.` };
            }

            const firstPageNo = data[0].pageno;

            const maxLineno = data
                .filter(entry => entry.pageno === firstPageNo)
                .reduce((max, curr) => Math.max(max, curr.lineno), 0);


            if (!maxLineno || maxLineno.length === 0) {
                this.logService.error(`Invalid line number data for transcript: ${query.cPath}`, this.logApplication);
                return { msg: -1, value: 'Invalid File format', error: `Error: The transcript does not match the expected format. Please check the draft file format.` };
            }

            const totalPages = [...new Set(data.map(entry => entry.pageno))].length;
            this.logService.debug(`Transcript summary calculated: pages=${totalPages}, start page=${firstPageNo}, max lines=${maxLineno}`, this.logApplication);
            return {
                msg: 1,
                firstPageNo,
                maxLineno,
                totalPages,
            };
        } catch (error) {
            this.logService.error(`Exception in getTranscriptSummary: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error processing transcript file', error: error.message };
        }
    }

    getTranscriptFiledata(query: any) {
        try {
            this.logService.debug(`Reading transcript file data: ${query.cPath}`, this.logApplication);
            const filePath = this.config.get('REALTIME_PATH') + query.cPath;
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (!Array.isArray(data) || data.length === 0) {
                this.logService.error(`Invalid or empty data in transcript: ${query.cPath}`, this.logApplication);
                return { msg: -1, message: 'Invalid or empty transcript data' };
            }
            this.logService.debug(`Successfully read transcript data with ${data.length} entries`, this.logApplication);
            return data;
        } catch (error) {
            this.logService.error(`Exception in getTranscriptFiledata: ${error}`, this.logApplication);
            return { msg: -1, message: `Error reading transcript file: ${error.message}` };
        }
    }


    async getHTMLfile(query: any, origin: string) {
        try {
            this.logService.info(`Generating HTML file for transcript: ${query.cTransid || 'unknown'}`, this.logApplication);
            // const filePath = this.config.get('REALTIME_PATH') + 'exports/' + query.cPath;
            // // check file fs.exists
            // if (!fs.existsSync(filePath)) {
            //     return { msg: -1, value: 'File not found', error: 'File does not exist at path: ' + filePath };
            // }
            // const html = fs.readFileSync(filePath, 'utf8');
            let res = await this.db.executeRef('get_transcript_detail', query, 'transcript');
            let formData = res.data[0][0];
            const filePath = this.config.get('REALTIME_PATH') + formData.cPath;
            // check file fs.exists
            if (!fs.existsSync(filePath)) {
                console.log('File does not exist at path', filePath)
                throw new Error('File does not exist at server');
            }
            const defaultTheme: any = {};
            const TranscriptLineDto: any = await this.getTranscriptFiledata({
                cPath: formData.cPath,
            });

            let theme: any;
            if (formData.cThemeid) {
                theme = await this.getThemeDetail({ cThemeid: formData.cThemeid, nMasterid: query?.nMasterid });
                if (theme) Object.assign(defaultTheme, theme);
            }

            const html: string = this.transcriptHtmlService.generateHtml(formData, TranscriptLineDto, defaultTheme, query.type || 'FST', origin);
            await this.savehtmlToFile(html, `transcript_${formData.cTransid}_${query.type || 'FST'}.html`);
            const buffer = Buffer.from(html, 'utf-8');
            const base64 = buffer.toString('base64');
            this.logService.info(`HTML generated successfully for transcript: ${formData.cTransid || 'unknown'}`, this.logApplication);
            return { msg: 1, base64, html };
        } catch (error) {
            this.logService.error(`Exception in getHTMLfile: ${error}`, this.logApplication);
            return { msg: -1, value: 'Failed to generate HTML', error: error.message };
        }
    }

    async savehtmlToFile(html: string, outputpath: string): Promise<any> {
        try {
            let cPath = this.config.get('REALTIME_PATH') + 'exports/' + outputpath
            const outputDir = path.dirname(cPath);
            await fs.promises.mkdir(outputDir, { recursive: true });

            // Write the file
            const filePath = outputDir;
            this.logService.info(`Saving HTML to file: ${filePath}`, this.logApplication);
            await fs.promises.writeFile(cPath, html, 'utf8');
            this.logService.info(`HTML file saved successfully: ${cPath}`, this.logApplication);
            return { msg: 1, status: 'success', path: cPath };
        }
        catch (err) {
            this.logService.error(`Error saving HTML to file: ${err}`, this.logApplication);
            return { msg: -1, value: 'Failed to save HTML file', error: err };
        }
    }


    async UpdateFilepath(cTransid: string, cPath: string, cPath4pg: string): Promise<any> {
        this.logService.info(`Updating file path for transcript: ${cTransid}, Path: ${cPath}, 4UP Path: ${cPath4pg}`, this.logApplication);
        // Ensure the paths are valid
        let res = await this.db.executeRef('update_htmlpath', { cTransid, cPath, cPath4pg }, 'transcript');
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async generateTranscript(
        @Body() generateDto
    ) {
        try {
            // You would typically fetch the theme from your database using generateDto.formData.cThemeid
            const defaultTheme: any = {};
            if (generateDto.formData.cThemeid) {
                const theme = await this.getThemeDetail({ cThemeid: generateDto.formData.cThemeid, nMasterid: generateDto.formData.nMasterid });
                if (theme && theme) {
                    Object.assign(defaultTheme, theme);
                }
            }

            const html = this.transcriptHtmlService.generateHtml(
                generateDto.formData,
                generateDto.lines,
                defaultTheme,
                'FST'
            );

            const cPath = `s_${generateDto.formData.cTransid}_${'FST'}.html`;
            const cPath2 = `s_${generateDto.formData.cTransid}_${'4UP'}.html`;

            const r1 = await this.savehtmlToFile(html, cPath);
            if (r1.msg === -1) {
                this.logService.error(`Error saving HTML file: ${r1.value}`, this.logApplication);
                return;
            }
            const html2 = this.transcriptHtmlService.generateHtml(
                generateDto.formData,
                generateDto.lines,
                defaultTheme,
                '4UP'
            );
            const r2 = await this.savehtmlToFile(html2, cPath2);
            if (r2.msg === -1) {
                this.logService.error(`Error saving HTML file: ${r2.value}`, this.logApplication);
                return;
            }
            // Update the file paths in the database
            await this.UpdateFilepath(generateDto.formData.cTransid, cPath, cPath2)
        } catch (error) {
            this.logService.error(`Exception in generateTranscript: ${error}`, this.logApplication);
        }
    }

    async getHtmlToData(formData): Promise<{ base64: string }> {
        try {
            this.logService.info(`Converting HTML to base64 data for transcript path: ${formData.cPath}`, this.logApplication);
            const defaultTheme: any = {};
            // if file exists check
            const filePath = this.config.get('REALTIME_PATH') + formData.cPath;
            // check file fs.exists
            if (!fs.existsSync(filePath)) {
                console.log('File does not exist at path', filePath)
                throw new Error('File does not exist at server');
            }

            const TranscriptLineDto: any = await this.getTranscriptFiledata({
                cPath: formData.cPath,
            });

            let theme: any;
            if (formData.cThemeid) {
                this.logService.debug(`Applying theme ${formData.cThemeid} to transcript`, this.logApplication);
                theme = await this.getThemeDetail({ cThemeid: formData.cThemeid, nMasterid: formData.nMasterid });
                if (theme) Object.assign(defaultTheme, theme);
            }

            const html: string = this.transcriptHtmlService.generateHtml(formData, TranscriptLineDto, defaultTheme, 'FST');

            const buffer = Buffer.from(html, 'utf-8');
            const base64 = buffer.toString('base64');
            this.logService.info(`Successfully converted HTML to base64 for transcript`, this.logApplication);
            return { base64 };
        } catch (error) {
            this.logService.error(`Exception in getHtmlToData: ${error}`, this.logApplication);
            throw error; // Rethrow to maintain Promise<{ base64: string }> contract
        }
    }


    async get_field_data(body: TranscriptFieldRequest): Promise<ThemeResonce> {
        try {
            this.logService.info(`Fetching field data with search: ${body.searchstr} in column: ${body.column_nm}`, this.logApplication);
            let res = await this.db.executeRef('get_field_data', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved field data`, this.logApplication);
                return res.data[0];
            } else {
                this.logService.error(`Failed to fetch field data: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } catch (error) {
            this.logService.error(`Exception in get_field_data: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error processing request', error: error.message };
        }
    }



    async deleteTranscript(body: DeleteTranscript): Promise<any> {
        try {
            this.logService.info(`Deleting transcript: ${body.cTransid}`, `${this.logApplication}/${body.cTransid}`);
            const res = await this.db.executeRef('delete_transcript', body, 'transcript');

            if (!res.success) {
                const errorMsg = res.error || 'Error deleting transcript';
                this.logService.error(`Database error: ${errorMsg}`, `${this.logApplication}/${body.cTransid}`);
                return { msg: -1, value: errorMsg };
            }
            const resData = res.data[0][0];

            if (resData['msg'] != 1) {
                const errorMsg = resData['message'] || 'Error deleting transcript';
                this.logService.error(`Operation failed: ${errorMsg}`, `${this.logApplication}/${body.cTransid}`);
                return { msg: -1, value: errorMsg };
            }

            this.logService.info(`Transcript ${body.cTransid} deleted successfully`, this.logApplication);
            return resData;
        } catch (error) {
            this.logService.error(`Exception in deleteTranscript: ${error.message}`, this.logApplication);
            return { msg: -1, error: error.message };
        }
    }







}
