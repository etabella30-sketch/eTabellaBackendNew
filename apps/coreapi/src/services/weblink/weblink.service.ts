import { HttpService } from '@nestjs/axios';
import { DbService } from '@app/global/db/pg/db.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { map, firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { query } from 'express';
import { webListbyids } from '../../interfaces/web.interface';
import { UtilityService } from '../utility/utility.service';

@Injectable()
export class WeblinkService {

    constructor(private db: DbService, private readonly httpService: HttpService, private config: ConfigService, private utility: UtilityService) {

    }

    async insertWeb(body: any): Promise<any> {
        let res = await this.db.executeRef('web_insert', body);
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]["jNotify"] || []
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            } catch (error) {
            }

            try {
                return { msg: 1, value: 'Web inserted successfully', nWebid: res.data[0][0].nWebid };
            } catch (error) {

            }
            // return res.data[0][0];
        } else {
            return { msg: -1, value: 'Web insert failed', error: res.error }
        }
    }


    async deleteWeb(body: any): Promise<any> {
        let res = await this.db.executeRef('web_delete', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Web delete failed', error: res.error }
        }
    }

    async getURLData(url: string, nCaseid: number): Promise<any> {
        console.log('GENERATING META DATA OF URL', url)
        let matadata, favicon, screenshot;
        try {
            matadata = await this.getMetadata(url);
        } catch (error) {
            matadata = null
        }
        try {
            favicon = await this.getFavicon(url);
        } catch (error) {
            favicon = null;

        }

        try {
            screenshot = await this.getScreenshot(url, nCaseid);
        } catch (error) {
            screenshot = null;
            console.log(error);
        }
        return { matadata, favicon, screenshot, testres: 1 };

    }


    async getMetadata(url: string) {
        try {
            const response$ = this.httpService.get(url, {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            }).pipe(
                map(response => response.data)
            );
            const data = await firstValueFrom(response$);
            const $ = cheerio.load(data);
            const metadata = {
                title: $('title').text(),
                description: $('meta[name="description"]').attr('content'),
                keywords: $('meta[name="keywords"]').attr('content'),
            };
            return metadata;
        } catch (error) {
            return null;
        }
    }


    async getFavicon(url: string): Promise<string> {
        try {
            debugger;
            const response$ = this.httpService.get(url, {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            }).pipe(
                map(response => response.data)
            );
            const data = await firstValueFrom(response$);
            const $ = cheerio.load(data);
            let favicon = $('link[rel="icon"]').attr('href') ||
                $('link[rel="shortcut icon"]').attr('href') ||
                $('link[rel="apple-touch-icon"]').attr('href') ||
                $('link[rel="mask-icon"]').attr('href');

            if (!favicon) {
                // Try default favicon location
                const defaultFavicon = new URL('/favicon.ico', url).href;
                const faviconExists = await this.checkUrlExists(defaultFavicon);
                if (faviconExists) {
                    return defaultFavicon;
                }
                return null;
            }

            if (!favicon.startsWith('http')) {
                favicon = new URL(favicon, url).href;
            }
            return favicon;
        } catch (error) {
            return null;
        }
    }
    // Helper method to check if a URL exists
    private async checkUrlExists(url: string): Promise<boolean> {
        try {
            const response = await this.httpService.head(url).toPromise();
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async getScreenshot(url: string, nCaseid: number) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });

            const shpath = `screenshot/case${nCaseid}`;
            const screenshotDir = path.resolve(this.config.get('ASSETS'), shpath);
            if (!fs.existsSync(screenshotDir)) {
                await fs.mkdirSync(screenshotDir, { recursive: true });
            }

            const fileName = `web_${new Date().getTime()}.png`;
            const screenshotPath = path.resolve(screenshotDir, fileName);
            await page.screenshot({ path: screenshotPath });

            return `${shpath}/${fileName}`;
        } catch (error) {
            console.log(error);
            return null;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }


    async getWebLinkList(query: webListbyids): Promise<any> {
        let res = await this.db.executeRef('web_link_list', query);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Fetch failed', error: res.error }
        }
    }
}
