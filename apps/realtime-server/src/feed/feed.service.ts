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
        const transcriptPath = path.join(this.config.get<string>('REALTIME_PATH') || '', `s_${nSesid}.json`);
        try {
            const raw = await fsPromises.readFile(transcriptPath, 'utf8');
            return this.parseTranscriptData(JSON.parse(raw), nSesid);
        } catch (error: any) {
            this.logger.warn(`Transcript not found for ${nSesid} at ${transcriptPath}`);
            throw new NotFoundException('Transcript file not found');
        }
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