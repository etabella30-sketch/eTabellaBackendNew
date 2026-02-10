import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { EmailAttachment, EmailparseReq } from 'apps/coreapi/src/interfaces/common';

import * as fs from 'fs';
// import MsgReader from '../../../msglib/MsgReader';
import MsgReader from '../../../../../../assets/libs/msglib/MsgReader';
import { decompressRTF } from '@kenjiuno/decompressrtf';
import * as iconvLite from 'iconv-lite';
import { deEncapsulateSync } from 'rtf-stream-parser';
// import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class EmailService {
    // spacesEndpoint = new AWS.Endpoint(this.config.get('DO_SPACES_ENDPOINT'));  // e.g. 'nyc3.digitaloceanspaces.com'
    // s3 = new AWS.S3({
    //     endpoint: this.spacesEndpoint,
    //     accessKeyId: this.config.get('DO_SPACES_KEY'),  // Your DigitalOcean Spaces Access Key
    //     secretAccessKey: this.config.get('DO_SPACES_SECRET'),  // Your DigitalOcean Spaces Secret Key
    // });
    saveDir = this.config.get('ATTACHMENT');
    domainPath = this.config.get('ATTACHMENT_URL');
    private readonly s3Client: S3Client;
    constructor(private db: DbService, private config: ConfigService) {

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

    // Function to download a file from DigitalOcean Space
    async downloadFileFromS3(spacePath: string): Promise<Buffer> {


        try {
            // const data = await this.s3.getObject(params).promise();
            // return data.Body as Buffer;

            const params = {
                Bucket: this.config.get('DO_SPACES_BUCKET_NAME'), // Your DigitalOcean Space (Bucket) name
                Key: spacePath,                                  // The file path in the bucket
            };

            // Send the GetObjectCommand
            const command = new GetObjectCommand(params);
            const response = await this.s3Client.send(command);

            if (!response.Body) {
                throw new Error('Empty file body received from S3.');
            }

            // Convert the readable stream to a buffer
            const streamToBuffer = (stream: Readable): Promise<Buffer> => {
                return new Promise((resolve, reject) => {
                    const chunks: any[] = [];
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', reject);
                });
            };

            return await streamToBuffer(response.Body as Readable);
        } catch (error) {
            console.error('Error downloading file from S3:', error.message);
            throw new Error(`Error downloading file from S3: ${error.message}`);
        }
    }

    async getemailparse(body: EmailparseReq): Promise<any> {
        let filePath = body.cPath;
        let nBid = body?.nId;
        try {
            // if (!fs.existsSync(filePath)) {
            //   return { msg: -1, error: `File not found` };
            // }
            // fs.accessSync(filePath, fs.constants.R_OK);

            // const fileData = fs.readFileSync(filePath);

            const fileData = await this.downloadFileFromS3(filePath);
            const reader = new MsgReader(fileData);
            const msgData: any = reader.getFileData();

            let rtfBody = '';
            if (msgData.compressedRtf) {
                rtfBody = Buffer.from(decompressRTF(msgData.compressedRtf)).toString();
            }

            let resultText: any = '';
            if (rtfBody) {
                const result = deEncapsulateSync(rtfBody, { decode: iconvLite.decode });
                resultText = result?.text || '';
            }


            const dirpath = `${this.saveDir}id_${nBid}`;
            let attechments: any[] = [];
            try {
                attechments = await this.saveAttachment(msgData, reader, dirpath)
                // // Create directory for saving attachments
                // if (!fs.existsSync(dirpath)) {
                //     fs.mkdirSync(dirpath, { recursive: true });
                // }

                // // Save each attachment
                // msgData.attachments.forEach((attachment, index) => {
                //     const attachment_file = reader.getAttachment(attachment);
                //     if (attachment_file.content) { // Check if content is valid
                //         let filepath = `${dirpath}/${attachment.fileName}`;

                //         // Ensure unique filename if the file already exists
                //         if (!fs.existsSync(filepath)) {
                //             fs.writeFileSync(filepath, attachment_file.content);
                //             console.log(`Attachment saved: ${filepath}`);
                //         } else {
                //             console.log(`File already exists, skipping save: ${filepath}`);
                //         }
                //         console.log(`Attachment saved: ${filepath}`);
                //     } else {
                //         console.log(`Attachment content is missing for: ${attachment.fileName}`);
                //     }
                // });
            } catch (error) {
                console.log(`Error saving attachments: ${error}`);
            }

            resultText = this.replaceHtmlImg(resultText, attechments, `${this.domainPath}${dirpath}`);

            const email = {
                from: { name: msgData.senderName, email: msgData.sentRepresentinmtpAddress || msgData.lastModifierName || msgData.inetAcctName },
                to: msgData.recipients ? msgData.recipients.filter(r => r.recipType == 'to').map((r) => { return { name: r.name, email: r.smtpAddress || r.email } }) : [],
                cc: msgData.recipients ? msgData.recipients.filter(r => r.recipType == 'cc').map((r) => { return { name: r.name, email: r.smtpAddress || r.email } }) : [],
                subject: msgData.subject || 'No Subject',
                body: resultText || 'No Body Available', // Fallback to default if no body is available
                attachments: msgData.attachments ? msgData.attachments.filter(e => e.dataType == 'attachment' && !e.attachmentHidden).map((attachment) => ({
                    filename: attachment.fileName || 'Unnamed Attachment',
                    cPath: `${dirpath}/${attachment.fileName}`,
                    data: attachment || null,
                })) : [],
                date: msgData.creationTime || 'Unknown Date',
            };


            return { msg: 1, email: email };
        } catch (error) {
            console.error('Error reading .msg file:', error.message);
            return { msg: -1, error: `Error reading .msg file: ${error.message}` };
        }
    }

    async saveAttachment(msgData: any, reader: any, dirpath: string): Promise<any[]> {
        const attachments: any[] = [];

        try {
            console.log(msgData.attachments);

            // Iterate over attachments and upload to S3
            for (const attachment of msgData.attachments) {
                const attachment_file = reader.getAttachment(attachment);

                attachments.push({
                    cFilename: attachment.fileName,
                    cPath: attachment.fileName,
                    dataType: attachment.dataType,
                    data: attachment || null,
                });

                if (attachment_file.content) {
                    const s3Key = `${dirpath}/${attachment.fileName}`;
                    try {
                        // Upload attachment to S3
                        const putCommand = new PutObjectCommand({
                            Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                            Key: s3Key,
                            Body: attachment_file.content,
                            ContentType: attachment.mimeType || 'application/octet-stream',
                            ACL: 'public-read',
                        });

                        await this.s3Client.send(putCommand);
                        console.log(`Attachment uploaded to S3: ${s3Key}`);
                    } catch (uploadError) {
                        console.error(`Failed to upload attachment to S3: ${s3Key}`, uploadError);
                    }
                } else {
                    console.log(`Attachment content is missing for: ${attachment.fileName}`);
                }
            }
        } catch (error) {
            console.error('Error processing attachments:', error.message);
        }

        return attachments;
    }


    // Function to download an attachment from the .msg file
    async downloadAttachment(body: EmailAttachment, res: any) {

        let filePath: string = body.cPath;
        let attachmentId: number = body.nId;
        try {
            // fs.accessSync(filePath, fs.constants.R_OK);
            // const fileBuffer = fs.readFileSync(filePath);

            const fileBuffer = await this.downloadFileFromS3(filePath);
            const msgReader = new MsgReader(fileBuffer);
            const msgData: any = msgReader.getFileData();

            if (msgData.attachments && msgData.attachments.length > attachmentId) {
                const attachment = msgReader.getAttachment(attachmentId);
                const attachmentFileName =
                    msgData.attachments[attachmentId].fileName || `attachment_${attachmentId}`;

                // Send the attachment as a response
                res.setHeader('Content-Disposition', `attachment; filename="${attachmentFileName}"`);
                res.setHeader(
                    'Content-Type',
                    msgData.attachments[attachmentId].mimeType || 'application/octet-stream',
                );
                res.send(Buffer.from(attachment.content));
            } else {
                res.status(404).send('Attachment not found');
            }
        } catch (error) {
            console.error('Error downloading attachment:', error);
            res.status(500).send('Failed to download attachment');
        }
    }

    replaceHtmlImg(htmlContent, attechments, attachmentsDir) {
        try {
            console.log(attachmentsDir);
            // Load the HTML content using Cheerio
            const $ = cheerio.load(htmlContent);

            // Replace the `src` attribute of all `img` tags
            $('img').each(function () {
                const originalSrc = $(this).attr('src');

                // Check if the `src` attribute has a `cid:` format
                if (originalSrc && originalSrc.startsWith('cid:')) {
                    // Extract the filename from `cid:`
                    const imageName = originalSrc.split('cid:')[1].split('@')[0];
                    const path = attechments.find(e => e.data.pidContentId == imageName || e.cFilename == imageName)
                    console.log('originalSrc', originalSrc, path.cPath)

                    // Define the new file path (assuming the saved files have the same name as `imageName`)
                    const newSrc = `${attachmentsDir}/${path.cPath}`;

                    // Set the new `src` attribute
                    $(this).attr('src', newSrc);
                    console.log(`Replaced ${originalSrc} with ${newSrc}`);
                }
            });

            return $.html();
        } catch (error) {
            console.error('error', error)
            return '';
        }
    }
}