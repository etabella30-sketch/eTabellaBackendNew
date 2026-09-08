import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { feedPage, FeedPageReq, feedResponse, feedTotalPage } from '../interfaces/feed.interface';
import * as fs from 'fs';
import * as path from 'path';
import { FeedDataService } from '../services/feed-data/feed-data.service';
import { promises as fsPromises } from 'fs';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';
import * as fsp from 'fs/promises';

@Injectable()
export class FeedService {

    logger = new Logger('feed');

    // private readFileAsync = promisify(fs.readFile);

    constructor(private feedData: FeedDataService, private readonly config: ConfigService) {

    }

    async getFeedData(query: FeedPageReq): Promise<feedResponse> {
        const { nSesid, pages, bTranscript } = query;
        try {
            if (bTranscript) {
                this.logger.warn(`Transcript fetching ${nSesid}`)
                const transfeed = await this.readTranscript(nSesid)
                return { total: (await transfeed)?.length, feed: transfeed };
            }
            const folderPath = path.join('data', `dt_${nSesid}`);
            this.logger.debug(`folderPath: ${folderPath}`);
            // const folderExists = fs.existsSync(folderPath);
            const folderExists = await this.pathExists(folderPath);
            if (folderExists) {
                this.logger.warn(`Dir. found for session ${nSesid}`);
                const finalData = this.readLocalData(nSesid, pages);
                return finalData;
            } else {
                if (this.feedData.checkSessionExists(nSesid)) {
                    return this.feedData.getSessionPagesData(nSesid, pages);
                } else {
                    this.logger.error(`No Session data Found`)
                    throw new NotFoundException('No session data found');
                }
            }
        } catch (error) {
            this.logger.error('Unexpected error in getFeedData', error?.stack || error?.message || String(error));
            throw new InternalServerErrorException('Failed to fetch feed data');
        }
    }

    private async readLocalData(nSesid: string, reqPages: number[]): Promise<{ total: number, feed: feedPage[] }> {
        const folderPath = path.join('data', `dt_${nSesid}`);

        const total = this.getJsonFileCount(folderPath)
        const results = await Promise.all(
            reqPages.map(async (page) => {
                const filePath = path.join(folderPath, `page_${page}.json`);
                const data = await this.processFile(filePath);
                return { nSesid, page, data } as feedPage;
            }),
        );

        const allEmpty = results.every(r => !r.data || (Array.isArray(r.data) && r.data.length === 0));
        if (allEmpty) {
            throw new NotFoundException('No local data found for requested pages');
        }
        return { total, feed: results };
    }

    private async processFile(filePath: string): Promise<any[]> {
        try {
            const raw = await fsPromises.readFile(filePath, { encoding: 'utf8' });
            return JSON.parse(raw);
        } catch (error: any) {
            // Log and return empty, so missing pages don’t crash the whole request
            this.logger.warn(`Failed to read JSON: ${filePath} — ${error?.message}`);
            return [];
        }
    }

    private async readTranscript(nSesid: string): Promise<feedPage[]> {
        const basePath = this.config.get<string>('REALTIME_PATH') || '';
        const transcriptPath = path.join(basePath, `s_${nSesid}.json`);
        try {
            const raw = await fsPromises.readFile(transcriptPath, 'utf8');
            return this.parseTranscriptData(JSON.parse(raw), nSesid);
        } catch (jsonError: any) {
            // Published .json not generated yet (e.g. the annot-transfer publish
            // step never ran / failed). Fall back to the raw line-numbered .TXT
            // draft and build the same paged structure in-process, mirroring the
            // python converter (assets/pythons/annot-transfer/file.py:
            // parse_text + convert_to_codefeed_data). Cache the result as the
            // .json so subsequent fetches hit the fast path.
            const txtPath = path.join(basePath, `s_${nSesid}.TXT`);
            try {
                const rawTxt = await fsPromises.readFile(txtPath, 'utf8');
                const feeds = this.buildFeedFromTxt(rawTxt);
                if (!feeds.length) {
                    this.logger.warn(`Transcript .TXT for ${nSesid} produced no pages`);
                    throw new NotFoundException('Transcript file not found');
                }
                try {
                    await fsPromises.writeFile(transcriptPath, JSON.stringify(feeds, null, 4), 'utf8');
                } catch (writeErr: any) {
                    this.logger.warn(`Could not cache transcript json for ${nSesid}: ${writeErr?.message}`);
                }
                return this.parseTranscriptData(feeds as any, nSesid);
            } catch (txtError: any) {
                if (txtError instanceof NotFoundException) throw txtError;
                this.logger.warn(`Transcript not found for ${nSesid}: no .json or .TXT at ${basePath}`);
                throw new NotFoundException('Transcript file not found');
            }
        }
    }

    // TS port of assets/pythons/annot-transfer/file.py (parse_text +
    // convert_to_codefeed_data) with db_tabreferences=None. Kept byte-for-byte
    // compatible with the published .json so both paths render identically.
    private buildFeedFromTxt(text: string): { msg: number; page: number; data: { time: string; lineIndex: number; lines: string[] }[] }[] {
        const lines = text.replace(/\r\n/g, '\n').trim().split('\n');
        const lineRe = /^\s*(\d+)\s+(\d{2}:\d{2}:\d{2})([A-Z]*:)?\s*(.*)$/;
        let pageNo = 1;
        const parsed: { timestamp: string; linetext: string; pageno: number }[] = [];
        for (const line of lines) {
            const m = lineRe.exec(line);
            if (!m) continue; // page-number-only / blank lines have no timestamp — skipped
            const lineText = ((m[3] || '') + m[4]).trim();
            parsed.push({ timestamp: m[2], linetext: lineText, pageno: pageNo });
            if (parseInt(m[1], 10) % 25 === 0) pageNo += 1;
        }
        const grouped = new Map<number, { time: string; lineIndex: number; lines: string[] }[]>();
        let lineIndex = 0;
        for (const l of parsed) {
            lineIndex += 1; // global running index, matches the python converter
            if (!grouped.has(l.pageno)) grouped.set(l.pageno, []);
            grouped.get(l.pageno).push({ time: l.timestamp, lineIndex, lines: [l.linetext] });
        }
        const out: { msg: number; page: number; data: any[] }[] = [];
        for (const [page, data] of grouped) out.push({ msg: page, page, data });
        return out;
    }

    private parseTranscriptData(feeds: feedPage[], nSesid: string): feedPage[] {
        try {
            if (feeds?.length) {
                const notExists = feeds.find(a => a.data.findIndex(m => m.unicid) > -1);
                if (!notExists) {
                    this.logger.warn(`identity not found creating dynamic for nSesid ${nSesid}`);
                    let id = 0;
                    for (let x of feeds) {
                        const data = x.data
                        for (let y of data) {
                            id += 1;
                            y["unicid"] = String(id);
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error(error?.message);
        }
        return feeds;
    }

    private async pathExists(targetPath: string): Promise<boolean> {
        try {
            await fsPromises.access(targetPath);
            return true;
        } catch {
            return false;
        }
    }

    getJsonFileCount(dirPath: string): number {
        try {
            const files = fs.readdirSync(dirPath); // read directory
            const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
            return jsonFiles.length;
        } catch (err) {
            this.logger.error('Error reading directory:', err);
            return 0;
        }
    }

    async getTotalPages(query: feedTotalPage): Promise<{ msg: 1 | -1, total: number, error?: any }> {
        try {
            const { nSesid } = query;
            const folderPath = path.join('data', `dt_${nSesid}`);
            const folderExists = await this.pathExists(folderPath);
            if (folderExists) {
                const files = await fsp.readdir(folderPath);
                const jsonFiles = files.filter(file => file.endsWith('.json'));
                return { msg: 1, total: jsonFiles.length };
            } else {
                if (this.feedData.checkSessionExists(nSesid)) {
                    const totalPages = this.feedData.sessionTotalPages(nSesid);
                    return { msg: 1, total: totalPages };
                } else {
                    this.logger.error(`No Session data Found`)
                    return { msg: -1, total: 0 };
                }
            }
        } catch (error) {
            this.logger.error(error);
            return { msg: -1, total: 0, error: error?.message }
        }
    }

}