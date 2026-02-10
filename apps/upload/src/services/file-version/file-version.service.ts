import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { LogService } from '@app/global/utility/log/log.service';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const execPromise = promisify(exec);

@Injectable()
export class FileVersionService {
    private readonly logApp: string = 'upload/versioncheck';
    private s3_SPACES_ENDPOINT = this.config.get('DO_SPACES_ENDPOINT');
    private DO_SPACES_BUCKET_NAME = this.config.get('DO_SPACES_BUCKET_NAME');



    private readonly s3Client: S3Client;
    constructor(private readonly logService: LogService, private readonly config: ConfigService) {
        this.s3Client = new S3Client({
            region: 'sgp1', // Set your DigitalOcean region
            endpoint: this.config.get('DO_SPACES_ENDPOINT'), // e.g., 'https://nyc3.digitaloceanspaces.com'
            credentials: {
                accessKeyId: this.config.get('DO_SPACES_KEY'),
                secretAccessKey: this.config.get('DO_SPACES_SECRET'),
            },
            forcePathStyle: this.config.get('DO_S3') == 'MINIO' // Required for MinIO
        });
    }

    async getFirstVersion(fileKey: string): Promise<string | null> {
        try {
            const bucketName = this.DO_SPACES_BUCKET_NAME;
            const s3Endpoint = this.s3_SPACES_ENDPOINT;

            // Run the AWS CLI command to list all versions of the file
            const getVersionCommand = `aws s3api list-object-versions --bucket ${bucketName} --prefix ${fileKey} --endpoint-url=${s3Endpoint}`;
            console.log(`Fetching versions for: ${fileKey} ${getVersionCommand}`);

            const { stdout } = await execPromise(getVersionCommand);
            const response = JSON.parse(stdout);

            if (response.Versions && response.Versions.length > 0) {
                // Sort versions by `LastModified` (oldest first)
                const sortedVersions = response.Versions.sort((a, b) =>
                    new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime()
                );

                const firstVersion = sortedVersions[0]; // First uploaded version
                console.log(`🆔 First File Version ID: ${firstVersion.VersionId}`);
                this.logService.info(`First File Version ID: ${firstVersion.VersionId}`, this.logApp);
                return firstVersion.VersionId;
            } else {
                console.log("❌ No versions found.");
                this.logService.info(`No versions found for file: ${fileKey}`, this.logApp);
                return null
            }
        } catch (error) {
            console.error("❌ Error fetching file versions:", error);
            this.logService.error(`Error fetching file versions: ${JSON.stringify(error)}`, this.logApp);
        }
        return null
    }





    async removeOldVersion(s3Path: string, persistFirstVersion?: boolean): Promise<void> {
        try {
            console.log('Fetching veriosn', s3Path)
            if (!s3Path) {
                this.logService.error(`${s3Path} not found for update version`, this.logApp)
                return;
            }
            const versions = await this.getAllVersion(s3Path, persistFirstVersion);
            if (!versions || !versions.length) {
                this.logService.error(`${s3Path} version not found`, this.logApp)
                return;
            }
            // let res = await this.db.executeRef('upload_update_fver', { cFVer: version, nBundledetailid });
            return await new Promise(async (resolve, reject) => {
                versions.forEach((element, index) => {
                    // if (versions.length != (index + 1)) {
                    this.deleteSpecificVersion(element, s3Path)
                    // }
                    if (versions.length == (index + 1)) {
                        resolve()
                    }
                });
            })
        } catch (error) {

        }
    }

    async deleteSpecificVersion(versionId, s3Path) {
        try {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: this.DO_SPACES_BUCKET_NAME,
                Key: s3Path,
                VersionId: versionId
            });

            const response = await this.s3Client.send(deleteCommand);
            console.log(`Version ${versionId} deleted successfully!`);
            return response;
        } catch (error) {
            console.error('Error deleting version:', error);
            throw new Error(error.message)
        }
    }

    async getAllVersion(fileKey: string, persistFirstVersion? : boolean): Promise<string[] | null> {
        try {
            const bucketName = this.DO_SPACES_BUCKET_NAME;
            const s3Endpoint = this.s3_SPACES_ENDPOINT;

            // Run the AWS CLI command to list all versions of the file
            const getVersionCommand = `aws s3api list-object-versions --bucket ${bucketName} --prefix ${fileKey} --endpoint-url=${s3Endpoint}`;
            console.log(`Fetching versions for: ${fileKey}`);

            const { stdout } = await execPromise(getVersionCommand);
            const response = JSON.parse(stdout);

            if (response.Versions && response.Versions.length > 0) {
                // Sort versions by `LastModified` (oldest first)
                const sortedVersions = response.Versions.sort((a, b) =>
                    new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime()
                );

                if(persistFirstVersion){
                    this.removeOldestEntry(sortedVersions);
                }
                // const versions = sortedVersions.map(e => e.VersionId); // First uploaded version
                const versions = sortedVersions.filter(e => !e.IsLatest).map(e => e.VersionId); // First uploaded version
                console.log(`🆔 File Version ID: ${versions}`);
                this.logService.info(`File Version ID: ${versions}`, this.logApp);
                return versions;
            } else {
                console.log("❌ No versions found.");
                this.logService.info(`No versions found for file: ${fileKey}`, this.logApp);
                return null
            }
        } catch (error) {
            console.error("❌ Error fetching file versions:", error);
            this.logService.error(`Error fetching file versions: ${JSON.stringify(error)}`, this.logApp);
        }
        return null
    }

    removeOldestEntry(entries) {
        if (!Array.isArray(entries) || entries.length === 0) return entries;

        // Find the index of the oldest entry based on LastModified date
        const oldestIndex = entries.reduce((oldestIdx, entry, idx, arr) =>
            new Date(entry.LastModified) < new Date(arr[oldestIdx].LastModified) ? idx : oldestIdx
            , 0);

        // Remove the oldest entry
        entries.splice(oldestIndex, 1);

        return entries;
    }
      
    
    async getAllVersions(fileKey: string) {
        try {
            const bucketName = this.DO_SPACES_BUCKET_NAME;
            const s3Endpoint = this.s3_SPACES_ENDPOINT;

            // Run the AWS CLI command to list all versions of the file
            const getVersionCommand = `aws s3api list-object-versions --bucket ${bucketName} --prefix ${fileKey} --endpoint-url=${s3Endpoint}`;
            console.log(`Fetching versions for: ${fileKey}`);

            const { stdout } = await execPromise(getVersionCommand);
            const response = JSON.parse(stdout);

            if (response.Versions && response.Versions.length > 0) {
                // Sort versions by `LastModified` (oldest first)
                const sortedVersions = response.Versions.sort((a, b) =>
                    new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime()
                );

                // const versions = sortedVersions.map(e => e.VersionId); // First uploaded version
                // const versions = sortedVersions.filter(e => !e.IsLatest).map(e => e.VersionId); // First uploaded version
                // console.log(`🆔 File Version ID: ${versions}`);
                // this.logService.info(`File Version ID: ${versions}`, this.logApp);
                return sortedVersions;
            } else {
                console.log("❌ No versions found.");
                this.logService.info(`No versions found for file: ${fileKey}`, this.logApp);
                
                // if(appName){
                //     this.logService.queueReport(`No versions found for file: ${fileKey}`, appName, 'E')
                //  }
                return []
            }
        } catch (error) {
            console.error("❌ Error fetching file versions:", error);
            this.logService.error(`Error fetching file versions: ${JSON.stringify(error)}`, this.logApp);
            // if(appName){
            //     this.logService.queueReport(`Error fetching file versions: ${JSON.stringify(error)}`, appName, 'E')
            // }
            throw new Error(error.message || error);
        }
    }
}
