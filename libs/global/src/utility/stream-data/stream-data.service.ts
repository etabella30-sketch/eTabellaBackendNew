import { Injectable, Logger } from '@nestjs/common';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { Server } from 'socket.io';
import { Inject } from '@nestjs/common';
import { delay } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Console } from 'console';

@Injectable()
export class StreamDataService {
    stringToAscii = (str) => {
        let asciiArray = [];
        for (let i = 0; i < str.length; i++) {
            asciiArray.push(str.charCodeAt(i));
        }
        return asciiArray;
    }

    streamDataUsers: string[] = [];
    logger = new Logger(StreamDataService.name);
    constructor(@Inject('WEB_SOCKET_SERVER') private io: Server, private config: ConfigService) { }

    async streamData(folder: string, userId: string, data: any, callback: Function, annotations?: any, highlights?: any) {
        debugger;
        const folderPath = `${folder}/dt_${data.nSesid}`; //this.getDate()
        // console.log('\n\n\nFolder path:', folderPath);
        try {
            const files = await fsPromises.readdir(folderPath);

            // console.log(`There are ${files.length} files in the directory.`);
            this.logger.verbose(`There are ${files.length} files in the directory.`)
            try {
                files.sort((a, b) => parseInt(a.replace(/\D+/g, '')) - parseInt(b.replace(/\D+/g, '')));
            } catch (error) {

            }
            for (const file of files.reverse()) {
                const pgNo = parseInt(file.replace(/\D+/g, ''));
                const filePath = path.join(folderPath, file);
                // await this.delayFN(2000)
                try {
                    let recData = await this.processFile(filePath);
                    // console.log('Received data for page', pgNo, JSON.stringify(recData));
                    if (recData) {
                        const aDATA = [], hDATA = [];

                        if (annotations) {
                            aDATA.push(...annotations.filter(a => Number(a.pageIndex) == pgNo));
                        }
                        if (highlights) {
                            hDATA.push(...highlights.filter(a => Number(a.cPageno) == pgNo));
                        }
                        // console.log({ msg: 1, page: pgNo, totalPages: files.length, nSesid: data.nSesid, a: aDATA, h: hDATA, tab: data.tab });

                        this.io["server"].to(userId).emit('previous-data', { msg: 1, page: pgNo, data: recData, totalPages: files.length, nSesid: data.nSesid, a: aDATA, h: hDATA, tab: data.tab });
                    }
                } catch (error) {
                    this.logger.error(`Error in fetch`, error?.message);
                    // console.log('Error fetching from file', error);
                }
            }

            callback({ msg: 1 });
        } catch (err) {
            // console.error('Failed to list directory contents: STREAMING FAILED',err);
            callback({ msg: -1 });
        }
    }

    async streamDataByPage(folder: string, userId: string, data: any, callback: Function, annotations?: any, highlights?: any, pages?: any) {
        pages = pages || 0;
        pages = Number(pages);
        const folderPath = `${folder}/dt_${data.nSesid}`; //this.getDate()
        // console.log('\n\n\nFolder path:', folderPath);
        try {
            const files = await fsPromises.readdir(folderPath);
            // console.log(`There are ${files.length} files in the directory.`);
            try {
                files.sort((a, b) => parseInt(a.replace(/\D+/g, '')) - parseInt(b.replace(/\D+/g, '')));
            } catch (error) {

            }
            for (const file of files) {

                const pgNo = parseInt(file.replace(/\D+/g, ''));
                if (pgNo >= pages) {
                    const filePath = path.join(folderPath, file);
                    // await this.delayFN(2000)
                    try {
                        let recData = await this.processFile(filePath);
                        // console.log('Received data for page', pgNo, JSON.stringify(recData));
                        if (recData) {
                            const aDATA = [], hDATA = [];
                            if (annotations) {
                                aDATA.push(...annotations.filter(a => Number(a.pageIndex) == pgNo));
                            }
                            if (highlights) {
                                hDATA.push(...highlights.filter(a => Number(a.cPageno) == pgNo));
                            }
                            // console.log("\n\n\n\n\ emitting to ....",'missing-data', { msg: 1, page: pgNo, data: recData, totalPages: files.length, nSesid: data.nSesid, a: aDATA, h: hDATA, tab: data.tab,last : pgNo==pages },'\n\n\n');

                            this.io["server"].to(userId).emit('missing-data', { msg: 1, page: pgNo, data: recData, totalPages: files.length, nSesid: data.nSesid, a: aDATA, h: hDATA, tab: data.tab, last: pgNo == pages });
                        }
                    } catch (error) {
                        // console.log('Error fetching from file', error);
                    }

                    await this.delayFN(100)
                }
            }

            callback({ msg: 1 });
        } catch (err) {
            // console.error('Failed to list directory contents: STREAMING FAILED');
            callback({ msg: -1 });
        }
    }

    stopDemoStream(userId: string) {
        const ind = this.streamDataUsers.findIndex(a => a == userId)
        if (ind > -1) {
            this.streamDataUsers.splice(ind, 1);
        }
    }

    getUserStatus(userId: string) {
        try {
            return this.streamDataUsers.includes(userId);
        } catch (error) {
            return false;
        }
    }
    async streamDemoData(userId: string, data: any) {

        try {
            this.stopDemoStream(userId);
        } catch (error) {
            // handle error if needed
        }
        this.streamDataUsers.push(userId);

        const FilePath = `${this.config.get('REALTIME_PATH')}/demo-stream.json`;
        // console.log('\n\n\nFolder path:', FilePath);
        try {
            let recData = await this.processFile(FilePath);
            if (recData) {
                const allData = JSON.parse(recData);
                if (!allData.length) return;

                let globalLineNo = 0;

                const processPage = async (ind) => {
                    try {
                        if (!this.getUserStatus(userId)) return;

                        const page = allData[ind];
                        if (page && page.data && page.data.length) {
                            for (let x of page.data) {
                                if (!this.getUserStatus(userId)) break;

                                const lineAchii = this.stringToAscii(x.lines[0]);
                                if (lineAchii.length) {
                                    for (let index = 0; index < lineAchii.length; index++) {
                                        if (!this.getUserStatus(userId)) break;

                                        const newText = lineAchii.slice(0, index + 1);
                                        const SendArray = [x.time, newText, globalLineNo];
                                        let datas = {
                                            i: globalLineNo,
                                            d: [SendArray],
                                            date: data.nSesid,
                                            l: 25,
                                            p: page.page
                                        };

                                        await this.delayFN(40);
                                        // console.log('Sending...', datas);
                                        this.io["server"].to(userId).emit('demo-message', datas);
                                    }
                                }
                                globalLineNo++;
                            }
                        }
                    } catch (error) {
                        // console.log('Error processing page', error);
                    }

                    if ((ind + 1) < allData.length) {
                        processPage(ind + 1);
                    }
                };

                processPage(0);
            }
        } catch (error) {
            // console.log('Error fetching from file', error);
        }
    }


    async streamDemoData1(userId: string, data: any) {

        try {
            // console.log('\n\n\n\n\n Stopping previous stream for user: \n\n\n\n\n', userId);
            this.stopDemoStream(userId);
        } catch (error) {
        }
        this.streamDataUsers.push(userId);

        const FilePath = `${this.config.get('REALTIME_PATH')}demo-stream.json`; //this.getDate()
        // console.log('\n\n\nFolder path:', FilePath);
        try {
            let recData = await this.processFile(FilePath);
            if (recData) {
                const allData = JSON.parse(recData)
                if (!allData.length) return;

                var process = async (ind) => {
                    try {

                        if (!this.getUserStatus(userId)) return;

                        const page = allData[ind];
                        if (page && page.data && page.data.length) {

                            for (let x of page.data) {

                                if (!this.getUserStatus(userId)) break;

                                if (x) {

                                    const lineAchii = this.stringToAscii(x.lines[0]);
                                    if (lineAchii.length) {
                                        for (let [index, y] of lineAchii.entries()) {


                                            if (!this.getUserStatus(userId)) break;

                                            const newText = [...lineAchii];
                                            const SendArray = [x.time, newText.splice(0, index), x.lineIndex];
                                            // let SendArray = [x.time, lineAchii, x.lineIndex];
                                            let datas = {// message
                                                i: x.lineIndex,
                                                d: [SendArray],
                                                date: data.nSesid,
                                                l: 25,
                                                p: page.page,

                                            }

                                            await this.delayFN(20);
                                            // console.log('Sending...', datas);
                                            this.io["server"].to(userId).emit('demo-message', datas);
                                        }

                                    }

                                }
                            }
                        }
                    } catch (error) {

                    }

                    if ((ind + 1) < allData.length) {
                        process(ind + 1);
                    }

                }

                // for (let i = 0; i < allData.length; i++) {
                process(0);
                // }

                // this.io["server"].to(userId).emit('demo-data', { msg: 1, data: recData, totalPages: 1, nSesid: 0, a: [], h: [] });
            }
        } catch (error) {
            // console.log('Error fetching from file', error);
        }
    }


    async sendFailedSessions(socket: any, pages: any, nSesid): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const folderPath = `localdata/dt_${nSesid}`; //this.getDate()
            try {
                if (pages.length) {
                    try {
                        // if (pages[0] > 2) {
                        pages.unshift(pages[0] - 2, pages[0] - 1);
                        // } else if (pages[0] > 1) {
                        //     pages.unshift(1);
                        // }
                    } catch (error) {

                    }

                    for (const pageNo of pages) {
                        try {
                            if (pageNo > 0) {
                                const filePath = path.join(folderPath, `page_${pageNo}.json`);

                                let recData = await this.processFile(filePath);
                                if (recData) {
                                    recData = JSON.parse(recData);
                                    if (recData && recData.length) {
                                        // console.log('Sending lost data for page', pageNo, 'to client');
                                        socket.emit('lost-data', { msg: 1, page: pageNo, data: recData, totalPages: pages.length, nSesid: nSesid, a: [], h: [] });
                                    }
                                }

                            }
                        } catch (error) {
                            // console.log('Error fetching from file', error);
                        }
                    }
                }
            } catch (error) {

            }
            resolve(true);
        })

    }

    private async processFile(filePath: string): Promise<string> {
        const data = await fsPromises.readFile(filePath, { encoding: 'utf8' });
        return data;
    }

    delayFN(val) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, val)
        })
    }

    private getDate(): string {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }

}
