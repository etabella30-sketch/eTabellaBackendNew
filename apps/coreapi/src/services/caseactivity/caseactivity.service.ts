import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
