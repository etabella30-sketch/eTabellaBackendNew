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

}