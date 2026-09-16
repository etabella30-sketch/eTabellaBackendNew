import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as moment from 'moment-timezone';
import { ATTENTION_ACCESS, ATTENTION_LIST, ATTENTION_SUMMARY } from './attention-documents.query';
import { CaseLSReq, ConnectionsReq, dwdpathReq, ScanPaginationReq, UserLlogReq, UserLSReq } from '../../interfaces/caseactivity.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { DownloadexcelService } from './downloadexcel/downloadexcel.service';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Agent } from 'https';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class CaseactivityService {
    private async attentionAccess(query: Record<string, string>): Promise<void> {
        const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuid.test(query.nCaseid || '') || !uuid.test(query.nMasterid || '')) throw new BadRequestException('Invalid case');
        const result = await this.db.rowQuery(ATTENTION_ACCESS, [query.nCaseid, query.nMasterid]);
        if (!result.success) throw new InternalServerErrorException('Unable to load updates');
        if (!result.data?.[0]?.allowed) throw new ForbiddenException('Case access required');
    }

    async attentionSummary(query: Record<string, string>): Promise<any> {
        await this.attentionAccess(query);
        if (!moment.tz.zone(query.timeZone || '') || !/^\d{4}-\d{2}-\d{2}$/.test(query.day || '')) throw new BadRequestException('Invalid date or timezone');
        const today = moment.tz(query.day, 'YYYY-MM-DD', true, query.timeZone);
        if (!today.isValid()) throw new BadRequestException('Invalid date');
        const addedFrom = today.toISOString();
        const addedTo = today.clone().add(1, 'day').toISOString();
        const updatedFrom = today.clone().subtract(1, 'day').toISOString();
        const asOf = new Date().toISOString();
        const result = await this.db.rowQuery(ATTENTION_SUMMARY,
            [query.nCaseid, query.nMasterid, updatedFrom, addedFrom, asOf, addedTo]);
        if (!result.success || !result.data?.[0]) throw new InternalServerErrorException('Unable to load document updates');
        return { ...result.data[0], addedFrom, addedTo, updatedFrom, updatedTo: addedFrom, asOf };
    }

    async attentionDocuments(query: Record<string, string>): Promise<any> {
        await this.attentionAccess(query);
        const from = Date.parse(query.from), to = Date.parse(query.to), asOf = Date.parse(query.asOf);
        const page = Number(query.page || 1);
        const qualified = (s: string) => /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(s || '');
        if (!['added', 'updated'].includes(query.kind) || ![query.from, query.to, query.asOf].every(qualified)
            || ![from, to, asOf].every(Number.isFinite) || to <= from || to - from > 32 * 86400000
            || asOf > Date.now() + 60000 || !Number.isInteger(page) || page < 1 || page > 100000) {
            throw new BadRequestException('Invalid activity filter');
        }
        const result = await this.db.rowQuery(ATTENTION_LIST,
            [query.nCaseid, query.nMasterid, query.from, query.to, query.asOf, query.kind, (page - 1) * 50]);
        if (!result.success || !result.data?.[0]) throw new InternalServerErrorException('Unable to load documents');
        return { ...result.data[0], page, pageSize: 50 };
    }

    private readonly s3Client: S3Client;
    bucketName: string = this.config.get('DO_SPACES_BUCKET_NAME');

    filepath: string = this.config.get<string>('ASSETS');
    constructor(private db: DbService, private dwexcel: DownloadexcelService, private config: ConfigService) {
        const agent = new Agent({ keepAlive: true, maxSockets: 50, keepAliveMsecs: 60000 });
        this.s3Client = new S3Client({
            region: 'sgp1', // Set your DigitalOcean region
            endpoint: this.config.get('DO_SPACES_ENDPOINT'),   // e.g., 'https://nyc3.digitaloceanspaces.com'
            credentials: {
                accessKeyId: this.config.get('DO_SPACES_KEY'),
                secretAccessKey: this.config.get('DO_SPACES_SECRET'),
            },
            maxAttempts: 5, // Retry up to 3 times
            retryMode: 'standard', // Use the standard retry mode
            forcePathStyle: this.config.get('DO_S3') == 'MINIO', // Required for MinIO
            requestHandler: new NodeHttpHandler({
                httpsAgent: agent,
                connectionTimeout: 60000, // 30 seconds for connection
                socketTimeout: 60000,     // 30 seconds for socket
            }),
        });
    }



    async getCasels(body: CaseLSReq): Promise<any> {
        let res = await this.db.executeRef('activity_casels', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getUserls(body: UserLSReq): Promise<any> {
        let res = await this.db.executeRef('activity_userls', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getUserLog(body: UserLlogReq): Promise<any> {
        let res = await this.db.executeRef('activity_userLog', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getSessionls(body: UserLSReq): Promise<any> {
        let res = await this.db.executeRef('activity_session', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getConnections(body: ConnectionsReq): Promise<any> {
        body['ref'] = 2;
        let res = await this.db.executeRef('activity_connections', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getBundledata(body: UserLSReq): Promise<any> {
        body['ref'] = 2;
        let res = await this.db.executeRef('activity_bundledata', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getScandata(body: UserLSReq): Promise<any> {
        let res = await this.db.executeRef('activity_scandata', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getScan_paginate(body: ScanPaginationReq): Promise<any> {
        let res = await this.db.executeRef('activity_paginate_scan', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async downlaodscan_paginate(body: ScanPaginationReq): Promise<any> {
        let res = await this.db.executeRef('activity_paginate_scandata', body);
        if (res.success) {
            const cPath = await this.generateExcel(body.nCaseid, res.data[0]);
            return { msg: 1, value: 'Success', cPath: cPath }
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    generateExcel(nCaseid, data) {
        return this.dwexcel.generateExcel(nCaseid, data)
    }

    /**
     * `et_case_bundle_sizes` — one row per top-level Master Bundle folder
     * (`nBundleid`, `cBundletag`, `cBundlename`, `nDocs`, `nBytes`, counted
     * through every sub-folder) plus a trailing `nBundleid = null` row for
     * documents filed outside any bundle. Same population as getBundledata.
     */
    async getBundleSizes(body: UserLSReq): Promise<any> {
        let res = await this.db.executeRef('case_bundle_sizes', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getStorageSize(body): Promise<any> {
        const folderpath = `doc/case${body.nCaseid}/`;
        console.log('folderpath', folderpath)
        const res = await this.getFolderSize(folderpath);
        return res
    }



    async getFolderSize(folderPath: string): Promise<any> {
        try {
            let continuationToken: string | undefined = undefined;
            let totalSize = 0;

            do {
                // List objects in the bucket (with prefix for folder)
                const response = await this.s3Client.send(
                    new ListObjectsV2Command({
                        Bucket: this.bucketName,
                        Prefix: folderPath,
                        ContinuationToken: continuationToken,
                        Delimiter: "/",
                    }),
                );

                // Add up the size of each object in the folder
                console.log(response.Contents.length)
                response.Contents?.forEach((object) => {
                    totalSize += object.Size || 0;
                });

                // Check if there are more objects to fetch
                continuationToken = response.NextContinuationToken;
            } while (continuationToken);
            console.log('totalSize', totalSize)
            return { msg: 1, totalSize: totalSize };
        } catch (error) {
            console.error('Error fetching folder size from S3:', error);
            //   throw new InternalServerErrorException('Failed to get folder size');
            return { msg: -1 };
        }
    }

    downloadFile(query: dwdpathReq, res: any) {
        console.log('Download batch file req', query)
        const fileuri: string = query.cPath;
        const filePath = path.join(this.filepath, fileuri);
        res.download(filePath, fileuri, (err) => {
            if (err) {
                res.status(500).send({
                    message: 'Could not download the file. ' + err,
                });
            }
        });
    }
}
