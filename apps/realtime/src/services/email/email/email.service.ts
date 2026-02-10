import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';

import * as fs from 'fs';
// import MsgReader from '../../../msglib/MsgReader';
// import MsgReader from '@assets/libs/msglib/MsgReader';
import MsgReader from '@assets/libs/msglib/MsgReader.js';

import { decompressRTF } from '@kenjiuno/decompressrtf';
import * as iconvLite from 'iconv-lite';
import { deEncapsulateSync } from 'rtf-stream-parser';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { EmailAttachment, EmailparseReq } from 'apps/realtime/src/interfaces/common';
import * as path from 'path';

@Injectable()
export class EmailService {
    spacesEndpoint = new AWS.Endpoint(this.config.get('DO_SPACES_ENDPOINT'));  // e.g. 'nyc3.digitaloceanspaces.com'
    s3 = new AWS.S3({
        endpoint: this.spacesEndpoint,
        accessKeyId: this.config.get('DO_SPACES_KEY'),  // Your DigitalOcean Spaces Access Key
        secretAccessKey: this.config.get('DO_SPACES_SECRET'),  // Your DigitalOcean Spaces Secret Key
    });

    saveDir = this.config.get('ATTACHMENT');
    domainPath = this.config.get('ATTACHMENT_URL');
    constructor(private db: DbService, private config: ConfigService) {

    }

    // Function to download a file from DigitalOcean Space
    async downloadFileFromS3(spacePath: string): Promise<Buffer> {
        const params = {
            Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),  // Your DigitalOcean Space (Bucket) name
            Key: spacePath  // The file path in the bucket
        }

        try {
            const data = await this.s3.getObject(params).promise();
            return data.Body as Buffer;
        } catch (error) {
            console.error('Error downloading file from S3:', error.message);
            throw new Error(`Error downloading file from S3: ${error.message}`);
        }
    }
    async readFileAsArrayBuffer(filePath: string): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
            });
        });
    }
    async getemailparse(body: EmailparseReq): Promise<any> {
        debugger;
        const isLive = this.config.get<string>('PDF_LOAD_PATH')?.includes('https://');
        let filePath = body.cPath;
        let nBid = body?.nId | 0;
        try {
            // if (!fs.existsSync(filePath)) {
            //   return { msg: -1, error: `File not found` };
            // }
            // fs.accessSync(filePath, fs.constants.R_OK);

            // const fileData = fs.readFileSync(filePath);
            let fileData;

            if (isLive) {
                fileData = await this.downloadFileFromS3(filePath);
            } else {
                fileData = await this.readFileAsArrayBuffer(`${this.config.get<string>('SAVE_ATTECH')}/${body.cPath}`);
            }
            // const reader = new MsgReader(fileData);

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
                if (isLive) {
                    attechments = await this.saveAttachment(msgData, reader, dirpath);
                } else {
                    attechments = await this.saveAttachmentLocal(msgData, reader, `${true ? this.config.get<string>('SAVE_ATTECH') + '/' : ''}${dirpath}`);
                }
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

            resultText = this.replaceHtmlImg(resultText, attechments, `${!isLive ? 'http://localhost:5000/' : this.domainPath}${dirpath}`);

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

    saveAttachment(msgData, reader, dirpath): Promise<any> {
        let attechments: any = [];
        try {
            // console.log(msgData.attachments)
            msgData.attachments.forEach(async (attachment, index) => {
                const attachment_file = reader.getAttachment(attachment);
                attechments.push({ cFilename: attachment.fileName, cPath: attachment.fileName, dataType: attachment.dataType, data: attachment || null, })
                if (attachment_file.content) { // Check if content is valid
                    let s3Key = `${dirpath}/${attachment.fileName}`;
                    try {
                        // Upload attachment to S3
                        await this.s3.putObject({
                            Bucket: this.config.get('DO_SPACES_BUCKET_NAME'), // Your bucket name
                            Key: s3Key, // The file path in the bucket
                            Body: attachment_file.content,
                            ContentType: attachment.mimeType || 'application/octet-stream', // Set content type if available
                            ACL: 'public-read' // Set ACL as needed (e.g., 'public-read' for public access)
                        }).promise();

                        console.log(`Attachment uploaded to S3: ${s3Key}`);
                    } catch (uploadError) {
                        console.error(`Failed to upload attachment to S3: ${s3Key}`, uploadError);
                    }
                } else {
                    console.log(`Attachment content is missing for: ${attachment.fileName}`);
                }
            });
        } catch (error) {

        }
        return attechments;
        // Iterate over each attachment and save it to S3
    }


    saveAttachmentLocal(msgData, reader, dirpath): Promise<any> {
        let attachments: any = [];
        try {
            // Iterate over each attachment
            msgData.attachments.forEach(async (attachment, index) => {
                const attachment_file = reader.getAttachment(attachment);
                attachments.push({
                    cFilename: attachment.fileName,
                    // cPath: path.join(dirpath, attachment.fileName),
                    cPath: attachment.fileName,
                    dataType: attachment.dataType,
                    data: attachment || null,
                });

                if (attachment_file.content) { // Check if content is valid
                    const filePath = path.join(dirpath, attachment.fileName); // Resolve full local path

                    try {
                        // Ensure the directory exists
                        if (!fs.existsSync(dirpath)) {
                            fs.mkdirSync(dirpath, { recursive: true });
                        }

                        // Write file to local filesystem
                        fs.writeFileSync(filePath, attachment_file.content);

                        console.log(`Attachment saved locally: ${filePath}`);
                    } catch (writeError) {
                        console.error(`Failed to save attachment locally: ${filePath}`, writeError);
                    }
                } else {
                    console.log(`Attachment content is missing for: ${attachment.fileName}`);
                }
            });
        } catch (error) {
            console.error('Error while saving attachments:', error);
        }
        return Promise.resolve(attachments); // Return the list of attachments
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