import { Injectable, NotFoundException } from '@nestjs/common';
import { UtilityService } from '../../utility/utility.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { EmailparseReq, FileAttachment, fileConvertReq, fileURLReq } from '../../../interfaces/convert.interface';
import * as path from 'path';
import { join, resolve } from 'path';
import {
    promises as fs, readFileSync as readFileSync, unlinkSync, writeFileSync as writeFileSync, existsSync, mkdirSync, copyFileSync, readdir,
    createReadStream, lstatSync, statSync, readdirSync, rmdirSync
} from 'fs';
import { LogService } from '@app/global/utility/log/log.service';
const mime = require('mime-types');
const rimraf = require('rimraf');
const util = require('util');
const rimrafPromise = util.promisify(rimraf);
import * as puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { promises } from 'dns';
import { UpdatefileinfoService } from '../../updatefileinfo/updatefileinfo.service';
import { Readable } from 'stream';
import { VerifypdfService } from '../../verifypdf/verifypdf.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { query } from 'express';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { filecopyService } from '../../filecopy/filecopy.service';

@Injectable()
export class EmailService {
    private ASSETS_PATH = this.config.get('S3_SYNC_PATH');
    private readonly logApp: string = 'convert';
    private readonly s3Client: S3Client;
    emailReaderPath = 'assets/pythons/convert/msg_to_html.py' //this.configService.get('PY_PAGINATION')
    pythonV = this.config.get('pythonV')
    bucketName = this.config.get('DO_SPACES_BUCKET_NAME');
    constructor(
        private readonly config: ConfigService,
        private readonly fileInfo: UpdatefileinfoService,
        private readonly fileVerificationService: VerifypdfService,
        private readonly filecopyService: filecopyService,
        @InjectQueue('delete-files') private fileDeleteQueue: Queue,
    ) {

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




    async emailConvert(body: fileConvertReq): Promise<any> {
        let data = await this.fileInfo.get_filedata(body);
        data.nMasterid = body.nMasterid;
        data.name = data.cPath.replace(`.${data.cPath.split('.').pop()}`, '');
        data.filetype = data.cPath.split('.').pop();


        const dirPath = `doc/case${body.nCaseid}`;
        const tempFile = path.basename(data.cPath);
        const input = data.cPath;
        let output = tempFile.replace(/\.MSG$/, '.pdf');
        output = output.replace(/\.MSG$/, '.pdf');
        const inputPath = resolve(this.config.get('ASSETS'), input);
        const outputPath = resolve(this.config.get('ASSETS'), output);
        const dataf = { dirPath: dirPath, cPath: data.cPath, cOutputpath: outputPath, nId: body.nBundledetailid, nCaseid: body.nCaseid };
        const result = await this.getemailparse(dataf, 'C');
        return { msg: 1 };
    }


    async emailParse(body: fileConvertReq): Promise<any> {
        let data = await this.fileInfo.get_filedata(body);
        data.nMasterid = body.nMasterid;
        data.name = data.cPath.replace(`.${data.cPath.split('.').pop()}`, '');
        data.filetype = data.cPath.split('.').pop();


        const dirPath = `doc/case${body.nCaseid}`;
        const tempFile = path.basename(data.cPath);
        const input = data.cPath;
        let output = tempFile.replace(/\.MSG$/, '.pdf');
        output = output.replace(/\.MSG$/, '.pdf');
        const inputPath = resolve(this.config.get('ASSETS'), input);
        const outputPath = resolve(this.config.get('ASSETS'), output);
        const dataf = { dirPath: dirPath, cPath: data.cPath, cOutputpath: outputPath, nId: body.nBundledetailid, nCaseid: body.nCaseid };
        const result = await this.getemailparse(dataf, 'N');

        return { msg: 1 };
    }





    async getemailparse(body: EmailparseReq, convertType: string): Promise<boolean> {
        console.log('Step 3');
        let nBid = body?.nId;
        try {
            const tempFile = path.basename(body.cPath);
            // const assetsFolder = path.join(__dirname, 'assets');

            let time = new Date().getTime()
            const sessionFolder = path.join(this.config.get('TMP_PATH'), `email_${time}/${nBid}`);

            const tempFilePath = path.join(sessionFolder, tempFile);
            const tempDir = path.dirname(tempFilePath);
            console.log('dir', tempDir)
            if (!existsSync(tempDir)) {
                mkdirSync(tempDir, { recursive: true });
            }
            let outputPath = tempFilePath.replace(/\.MSG$/, '.html');
            outputPath = outputPath.replace(/\.msg$/, '.html');

            const destinationPath = path.join(tempDir, path.basename(body.cPath));
            // Check if the source file exists
            let filepath = resolve(this.config.get('ASSETS'), body.cPath)
            console.log('filepath', filepath)
            if (existsSync(filepath)) {
                console.log(`File exists locally. Copying from ${body.cPath} to ${destinationPath}`);
                copyFileSync(filepath, destinationPath);
            } else {
                console.log(`File does not exist locally. Attempting to download to ${tempFilePath}`);
                await this.downloadFileToDisk('etabella', (body.cPath), tempFilePath);
            }

            try {
                const msg_result = await this.readData(tempFilePath, outputPath, nBid, body['dirPath'])
                if (msg_result) {

                    this.uploadFolderToS3(sessionFolder, 'etabella', `${body['dirPath']}/${nBid}`, convertType == 'N')
                    this.fileInfo.converStatus({ nID: body.nId, bIsconvert: convertType == 'N' ? 'V' : 'C' });
                    if (convertType != 'N') {
                        let pdfPath = body.cPath.replace(/\.MSG$/, '.pdf');
                        pdfPath = pdfPath.replace(/\.msg$/, '.pdf');
                        let filepath = resolve(this.config.get('ASSETS'), pdfPath)
                        let result = await this.createPdfFromHtml(outputPath, filepath)
                        // await this.processAttachments(`${sessionFolder}/attachments`, body)
                        if (convertType == 'C') {
                            this.deleteFolder('etabella', `${body['dirPath']}/${nBid}`)
                        }
                        if (result) {
                            console.log('pdf genetate result', result)
                            this.deleteFolder('etabella', `${body['dirPath']}/${nBid}`)
                            unlinkSync(tempFilePath);
                            // this.deleteSessionFolder(sessionFolder)
                            return result
                        }

                    } else {
                        console.log('reading .msg file:', true);
                        return true;
                    }
                    console.log('Unsync folder:', true);
                    // this.deleteSessionFolder(sessionFolder)
                    unlinkSync(tempFilePath);

                } else {
                    console.log('Error reading .msg file:', false);
                    return false;
                }
            } catch (error) {
                console.error('Error reading .msg file:', error.message);
                return false;
            }
        } catch (error) {
            console.error('Error reading .msg file:', error.message);
            return false
        }
    }




    async getFilesFromDirectory(directoryPath) {
        try {
            const files = await fs.readdir(directoryPath, { withFileTypes: true });
            return files
                .filter(file => file.isFile()) // Include only files
                .map(file => ({
                    cPath: path.join(directoryPath, file.name), // Full path
                    fileName: file.name,
                }));
        } catch (error) {
            console.error('Error reading directory:', error);
            throw error;
        }
    }


    async readData(input, output, nBid, dirPath): Promise<boolean> {
        return new Promise((resolve, reject) => {
            console.log(this.emailReaderPath, input, output, nBid)
            const pythonProcess = spawn(this.pythonV, [this.emailReaderPath, input, output, nBid, `${this.config.get('ATTACHMENT_URL')}${dirPath}`]);

            pythonProcess.stdout.on("data", (data) => {
                // this.logService.info(`Responce to python file success ${data.toString().trim()}`, logApp)
                console.log('step 3 res', data.toString().trim());
            });
            pythonProcess.stderr.on("data", (data) => {
                // this.logService.info(`Responce to python file error ${data.toString().trim()}`, logApp)
                console.log(data.toString().trim())
                // print_log(`stderr: ${data.toString().trim()}`);
            });
            pythonProcess.on("close", (code) => {
                if (code === 0) {
                    // this.logService.info(`Responce to python file close with code ${code} success`, logApp)
                    console.log('step 3 res', code.toString().trim());
                    // print_log(`end file ${new Date().toISOString(), jsonData.cPath}`)
                    resolve(true);
                } else {
                    // this.logService.info(`Responce to python file close with code ${code} failed`, logApp)
                    console.log('step 3 res', code.toString().trim());
                    // print_log(`Python script failed with code ${code}`);
                    // reject(new Error(`Python script failed with code ${code}`));
                    resolve(false);
                }
            });
        })
    }



    async createPdfFromHtml(htmlFilePath, outputPath: string): Promise<boolean> {
        let browser;
        // const htmlFilePath = `${this.config.get('TMP_PATH')}/temp_${new Date().getTime()}.html`
        // writeFileSync(htmlFilePath, emailHtml);
        // Validate URL
        try {
            if (!htmlFilePath.startsWith('http://') && !htmlFilePath.startsWith('https://')) {
                // If it's a local file, prepend file:// protocol
                htmlFilePath = `file://${htmlFilePath}`;
            }

            try {
                new URL(htmlFilePath); // This will throw if URL is invalid
            } catch (error) {
                console.error('Invalid URL:', htmlFilePath);
                return false;
            }
            console.log('htmlFilePath', htmlFilePath, outputPath)
            try {
                browser = await puppeteer.launch({
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security', // Disable web security for cross-origin images
                        '--allow-running-insecure-content', // Allow insecure content if images are HTTP
                    ],
                });
            } catch (launchError) {
                console.error('Error launching Puppeteer:', launchError.stack || launchError.message);
                return false; // Return false if Puppeteer launch fails
            }

            const page = await browser.newPage();

            // Set the HTML content
            // await page.setContent(emailHtml, { waitUntil: 'networkidle2' });

            // const encodedPath = encodeURI(`file://${htmlFilePath}`);
            const encodedPath = `${htmlFilePath.replace(/\\/g, '/')}`;
            await page.goto(encodedPath, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            const outputDir = path.dirname(outputPath);
            await fs.mkdir(outputDir, { recursive: true });
            // Ensure all images are loaded
            await page.evaluate(() => {
                return Promise.all(
                    Array.from(document.images)
                        .filter(img => !img.complete)
                        .map(img => new Promise(resolve => {
                            img.onload = img.onerror = resolve;
                        }))
                );
            });

            // Add class to force page breaks where needed
            await page.evaluate(() => {
                document.querySelectorAll('.attachments-section').forEach(el => {
                    el.remove();
                });

                const emailDividers = document.querySelectorAll('div[style*="border-top:solid #E1E1E1"]');
                emailDividers.forEach(divider => {
                    divider.classList.add('page-break');
                });
                // Handle WordSection1 divs
                const wordSections = document.querySelectorAll('div.WordSection1');
                wordSections.forEach((section: any) => {
                    // Ensure the section gets the auto page property
                    section.style.setProperty('page', 'auto', 'important');
                });

                const signatureBlocks = document.querySelectorAll('p.MsoNormal[style*="margin-right:22.5pt"]');
                signatureBlocks.forEach(block => {
                    if (block.textContent.includes('Regards,')) {
                        block.closest('div').classList.add('signature-block');
                    }
                });
            });

            // Generate the PDF
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '2cm',
                    right: '1.5cm',   // Right margin
                    bottom: '1.5cm',
                    left: '2cm',    // Left margin
                }
            });

            // unlinkSync(htmlFilePath);

            console.log('PDF created successfully:', outputPath);
            return true
        } catch (error) {
            console.error('Error creating PDF:', error);
            return false
        } finally {
            if (browser) {
                await browser.close();
                return true
            }
        }

    }


    async createPdfFromHtml_old(url: string, outputPath: string): Promise<boolean> {
        console.log('Step 4', url, outputPath);
        let browser;
        try {
            // Validate URL
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                // If it's a local file, prepend file:// protocol
                url = `file://${url}`;
            }

            try {
                new URL(url); // This will throw if URL is invalid
            } catch (error) {
                console.error('Invalid URL:', url);
                return false;
            }
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--disable-features=IsolateOrigins,site-per-process',
                ],
            });

            const page = await browser.newPage();
            await page.evaluate(() => {
                console.log('Header height:', (document.querySelector('.header') as HTMLElement)?.offsetHeight);
                console.log('Body content height:', (document.querySelector('.body-content') as HTMLElement)?.offsetHeight);

                // Log all elements between header and body-content
                const header = document.querySelector('.header');
                const bodyContent = document.querySelector('.body-content');
                let current = header?.nextElementSibling;
                while (current && current !== bodyContent) {
                    console.log('Intermediate element:', current.tagName, current.className);
                    current = current.nextElementSibling;
                }
            });
            // Add custom styles to control page breaks
            await page.evaluateOnNewDocument(() => {
                document.addEventListener('DOMContentLoaded', () => {
                    const style = document.createElement('style');
                    style.textContent = `
                        @page {
                            margin: 0;
                            size: A4;
                        }
                        body {
                            margin: 0;
                        }
                        .header {
                            page-break-after: avoid !important;
                        }
                        .body-content {
                            page-break-before: avoid !important;
                        }
                        table {
                            page-break-inside: avoid;
                        }
                        tr {
                            page-break-inside: avoid;
                        }
                        .page-break-avoid {
                            page-break-inside: avoid !important;
                        }
                    `;
                    document.head.appendChild(style);
                });
            });

            await page.goto(url, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 30000
            });

            // Fix page break issues
            await page.evaluate(() => {
                // Function to get element height
                const getElementHeight = (element) => {
                    const styles = window.getComputedStyle(element);
                    const margin = parseFloat(styles['marginTop']) +
                        parseFloat(styles['marginBottom']);
                    return element.offsetHeight + margin;
                };

                // Fix spacing between header and content
                const header: any = document.querySelector('.header');
                const bodyContent: any = document.querySelector('.body-content');

                if (header && bodyContent) {
                    // Remove any empty divs between header and body content
                    let nextElement = header.nextElementSibling;
                    while (nextElement && nextElement !== bodyContent) {
                        const isEmpty = !nextElement.textContent.trim();
                        if (isEmpty) {
                            const temp = nextElement;
                            nextElement = nextElement.nextElementSibling;
                            temp.remove();
                        } else {
                            nextElement = nextElement.nextElementSibling;
                        }
                    }

                    // Ensure header and first part of content stay together
                    const headerHeight = getElementHeight(header);
                    const contentHeight = getElementHeight(bodyContent);
                    const pageHeight = 1123; // A4 height in pixels (297mm)

                    if (headerHeight + contentHeight < pageHeight * 0.8) {
                        header.style.pageBreakAfter = 'avoid';
                        bodyContent.style.pageBreakBefore = 'avoid';

                        // Add wrapper div if needed
                        const wrapper = document.createElement('div');
                        wrapper.className = 'page-break-avoid';
                        header.parentNode.insertBefore(wrapper, header);
                        wrapper.appendChild(header);
                        wrapper.appendChild(bodyContent);
                    }
                }
            });

            // Generate PDF with adjusted settings
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0mm',      // Margins handled in CSS
                    right: '0mm',
                    bottom: '0mm',
                    left: '0mm',
                },
                preferCSSPageSize: true,
                displayHeaderFooter: false,
                scale: 1
            });

            console.log('PDF generated successfully:', outputPath);
            return true;

        } catch (error) {
            console.error('Error in PDF generation:', error);
            return false;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }


    async removeTempDir(localFolderPath): Promise<boolean> {
        try {
            await rimrafPromise(localFolderPath);
            console.log(`Successfully deleted local folder: ${localFolderPath}`);
            return true
        } catch (deleteError) {
            console.error(`Error deleting local folder ${localFolderPath}:`, deleteError);
            return false
        }
    }

    async uploadFolderToS3(
        localFolderPath: string,
        bucketName: string,
        s3Prefix = '',
        deleteAfterUpload = true,
        maxConcurrent = 5,
        maxRetries = 3
    ): Promise<boolean> {
        try {
            console.log(`Uploading folder: ${localFolderPath} to S3 bucket: ${bucketName}/${s3Prefix}`);

            if (!await fs.access(localFolderPath).then(() => true).catch(() => false)) {
                console.error(`Local folder does not exist: ${localFolderPath}`);
                return false;
            }

            const files = await fs.readdir(localFolderPath);
            let processedFiles = 0;
            let failedFiles = 0;

            // Process uploads with concurrency control
            for (let i = 0; i < files.length; i += maxConcurrent) {
                const batch = files.slice(i, i + maxConcurrent);
                const uploadPromises = batch.map(async (file) => {
                    const localFilePath = path.join(localFolderPath, file);
                    const stats = await fs.stat(localFilePath);

                    if (stats.isDirectory()) {
                        const newPrefix = path.join(s3Prefix, file).replace(/\\/g, '/');
                        const success = await this.uploadFolderToS3(
                            localFilePath,
                            bucketName,
                            newPrefix,
                            deleteAfterUpload,
                            maxConcurrent,
                            maxRetries
                        );
                        if (!success) failedFiles++;
                        processedFiles++;
                    } else {
                        let attempts = 0;
                        while (attempts < maxRetries) {
                            try {
                                const s3Key = path.join(s3Prefix, file).replace(/\\/g, '/');
                                const fileStream = createReadStream(localFilePath);
                                const uploadParams: any = {
                                    Bucket: bucketName,
                                    Key: s3Key,
                                    Body: fileStream,
                                    ContentType: mime.lookup(file) || 'application/octet-stream',
                                    ACL: 'public-read',
                                };

                                const command = new PutObjectCommand(uploadParams);
                                await this.s3Client.send(command);
                                console.log(`Successfully uploaded: ${s3Key}`);
                                processedFiles++;
                                break;
                            } catch (error) {
                                attempts++;
                                if (attempts === maxRetries) {
                                    console.error(`Failed to upload ${file} after ${maxRetries} attempts:`, error);
                                    failedFiles++;
                                    processedFiles++;
                                } else {
                                    await new Promise(resolve =>
                                        setTimeout(resolve, Math.pow(2, attempts) * 1000)
                                    );
                                }
                            }
                        }
                    }
                });

                await Promise.all(uploadPromises);

                // Check if all files have been processed
                if (processedFiles === files.length) {
                    const allSuccess = failedFiles === 0;

                    if (allSuccess) {
                        console.log(`Successfully uploaded all files in: ${localFolderPath}`);
                        if (deleteAfterUpload) {
                            await fs.rm(localFolderPath, { recursive: true, force: true });
                            console.log(`Deleted local folder: ${localFolderPath}`);
                        }
                        return true;
                    } else if (failedFiles === files.length) {
                        console.error(`All files in ${localFolderPath} failed to upload`);
                        return false;
                    }
                }
            }

            return false;
        } catch (error) {
            console.error('Error in uploadFolderToS3:', error);
            return false;
        }
    }

    async uploadFolderToS3_old(localFolderPath, bucketName, s3Prefix = '', deleteAfterUpload = true): Promise<boolean> {
        try {
            // Read the directory contents
            console.log(`Uploading folder: ${localFolderPath} to S3 bucket: ${bucketName}/${s3Prefix}`);
            const files = await fs.readdir(localFolderPath);

            for (const file of files) {
                const localFilePath = path.join(localFolderPath, file);
                const stats = await fs.stat(localFilePath);

                if (stats.isDirectory()) {
                    // Recursively upload subdirectories
                    const newPrefix = path.join(s3Prefix, file).replace(/\\/g, '/');
                    await this.uploadFolderToS3(localFilePath, bucketName, newPrefix);
                } else {
                    // Upload file
                    const fileContent = await fs.readFile(localFilePath);
                    const s3Key = path.join(s3Prefix, file).replace(/\\/g, '/');

                    const uploadParams: any = {
                        Bucket: bucketName,
                        Key: s3Key,
                        Body: fileContent,
                        ContentType: mime.lookup(file) || 'application/octet-stream',
                        ACL: 'public-read' // Adjust based on your needs
                    };

                    try {
                        const command = new PutObjectCommand(uploadParams);
                        await this.s3Client.send(command);
                        console.log(`Successfully uploaded: ${s3Key}`);
                    } catch (uploadError) {
                        console.error(`Error uploading ${s3Key}:`, uploadError);
                    }
                }
            }
            return true
            console.log(`Successfully uploaded folder: ${localFolderPath} to S3 bucket: ${bucketName}`);

        } catch (error) {
            console.error('Error uploading folder to S3:', error);
            return true
        }
    }


    async deleteFolder(bucketName: string, folderPath: string): Promise<void> {
        try {
            // Step 1: List objects with the specified prefix (folder path)
            let continuationToken: string | undefined = undefined;
            do {
                const listCommand = new ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: folderPath,
                    ContinuationToken: continuationToken,
                });
                const listResponse = await this.s3Client.send(listCommand);

                const objectsToDelete = listResponse.Contents?.map((item) => ({
                    Key: item.Key,
                }));

                // Step 2: If there are objects to delete, send a delete request
                if (objectsToDelete && objectsToDelete.length > 0) {
                    const deleteCommand = new DeleteObjectsCommand({
                        Bucket: bucketName,
                        Delete: {
                            Objects: objectsToDelete,
                        },
                    });

                    const deleteResponse = await this.s3Client.send(deleteCommand);
                    console.log('Deleted objects:', deleteResponse.Deleted);
                }

                continuationToken = listResponse.NextContinuationToken;
            } while (continuationToken); // Continue if the response is truncated

            console.log(`Folder "${folderPath}" deleted successfully.`);
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    }


    async downloadFileToDisk(
        bucketName: string,
        fileKey: string,
        resolvedPath: string,
    ): Promise<boolean> {
        try {

            // Fetch the file from S3
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: fileKey,
            });

            const response = await this.s3Client.send(command);

            if (!response.Body) {
                console.error('File body is empty');
                return false;
            }

            // Convert the stream to a buffer
            const streamToBuffer = (stream: Readable): Promise<Buffer> => {
                return new Promise((resolve, reject) => {
                    const chunks: any[] = [];
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', reject);
                });
            };

            const buffer = await streamToBuffer(response.Body as Readable);

            // Ensure the folder exists before writing the file
            const folderPath = resolve(resolvedPath, '..');
            if (!existsSync(folderPath)) {
                mkdirSync(folderPath, { recursive: true });
            }

            // Write the file to the specified path
            console.log('File write:', resolvedPath);
            writeFileSync(resolvedPath, buffer);
            console.log('File write success:', resolvedPath);

            return true;
        } catch (error) {
            console.error('Error downloading file to disk:', error.message);
            return false;
        }
    }


    async processAttachments(directoryPath, filedata) {
        if (!directoryPath || !filedata) {
            throw new Error('Directory path and file data are required');
        }

        try {
            const files = await this.getFilesFromDirectory(directoryPath);

            if (!Array.isArray(files) || files.length === 0) {
                console.warn('No files found in directory:', directoryPath);
                return false;
            }

            const results = await Promise.allSettled(
                files.map(async (attachment) => {
                    try {
                        const attachmentData = {
                            data: {
                                dataType: 'attachment',
                                attachmentHidden: false,
                                fileName: attachment.fileName,
                            },
                            cPath: attachment.cPath,
                        };

                        // if (!this.isValidAttachment(attachmentData)) {
                        //     return false;
                        // }

                        const verificationResult = await this.fileVerificationService.verifyFile(attachmentData.cPath);
                        if (!verificationResult) {
                            return false
                        }

                        // Generate new filename with timestamp
                        const fileExtension = path.extname(attachmentData.cPath);
                        const timestamp = new Date().getTime();
                        const newFileName = `doc_att_${timestamp}${fileExtension}`;
                        const newFilePath = `${filedata.dirPath}/${newFileName}`;
                        console.log('newFilePath', newFilePath)
                        try {
                            // Move and rename file
                            await fs.mkdir(filedata.dirPath, { recursive: true }); // Ensure directory exists
                            // await fs.rename(attachmentData.cPath, newFilePath);
                            await fs.copyFile(attachmentData.cPath, `${this.ASSETS_PATH}${newFilePath}`);

                            // Update the path in attachmentData
                            attachmentData.cPath = newFilePath;
                            // Now get stats of the moved file
                            const stats = await fs.stat(`${this.ASSETS_PATH}${newFilePath}`);
                            const fileInfoData = this.constructFileInfo(filedata, attachmentData, verificationResult, stats.size);
                            const fileres = await this.fileInfo.updateConvertFileInfo(fileInfoData);
                            if (fileres?.msg === 1) {
                                try {
                                    if (fileres && fileres['cOldpath'] && fileres['cOldpath'] != '') {
                                        this.fileDeleteQueue.add({ jFiles: [fileres['cOldpath']] })
                                    }
                                } catch (error) {
                                    console.log('Error in fileDeleteQueue:', error)
                                }
                                await this.queueFileForProcessing(attachmentData.cPath, fileres.nBundledetailid);
                                return true;
                            }
                        } catch (error) {
                            console.error('Error moving file:', error);
                            return false;
                        }

                        console.error('Failed to update file info for attachment:', attachmentData.data.fileName);
                        return false;
                    } catch (error) {
                        console.error(`Error processing individual attachment: ${attachment.fileName}`, error);
                        return false;
                    }
                })
            );

            const successCount = results.filter(
                result => result.status === 'fulfilled' && result.value === true
            ).length;

            return successCount === files.length;
        } catch (error) {
            console.error('Error in processAttachments:', error);
            throw error;
        }
    }

    constructFileInfo(filedata, attachmentData, verificationResult, fileSize) {
        return {
            nUDid: null, // Changed from "0" to null
            nMasterid: filedata.nMasterid,
            cFilename: `${attachmentData.data.fileName}`,
            nSectionid: filedata?.nSectionid,
            nBundleid: filedata.nBundleid,
            nBundledetailid: null, // Changed from "0" to null
            cFiletype: attachmentData.cPath.split('.').pop()?.toUpperCase() || '',
            isValidate: verificationResult.isValidate || false,
            cPath: attachmentData.cPath,
            cFilesize: fileSize.toString(),
            nPagerotation: verificationResult.pagerotation,
            cPage: `1-${verificationResult.totalpages}`,
            bisTranscript: false,
        };
    }

    async queueFileForProcessing(cPath, nBundledetailid) {
        // await this.fileCopyQueue.add(
        //     { cPath: cPath },
        //     { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60, attempts: 3, backoff: 1000 * 60 * 5 }
        // );
        await this.filecopyService.copyFile(cPath, '', '', nBundledetailid);
    }


    async processAttachments_old(directoryPath, filedata) {
        try {
            const files = await this.getFilesFromDirectory(directoryPath);

            await Promise.all(
                files.map(async (attachment) => {
                    // Simulate attachment data
                    const attachmentData = {
                        data: {
                            dataType: 'attachment', // Example data type
                            attachmentHidden: false, // Example visibility
                            fileName: attachment.fileName,
                        },
                        cPath: attachment.cPath,
                    };

                    if (attachmentData.data.dataType === 'attachment' && !attachmentData.data.attachmentHidden) {
                        // Verify the attachment file
                        const verificationResult = await this.fileVerificationService.verifyFile(attachmentData.cPath);

                        // Get the file size
                        const stats = await fs.stat(attachmentData.cPath);
                        const fileSize = stats.size;
                        // Construct file information
                        const fileInfoData = {
                            nUDid: null,
                            nMasterid: filedata.nMasterid,
                            cFilename: `${filedata.cFilename || filedata.name}_${attachmentData.data.fileName}`,
                            nSectionid: filedata?.nSectionid,
                            nBundleid: filedata.nBundleid,
                            nBundledetailid: null,
                            cFiletype: attachmentData.cPath.split('.').pop().toUpperCase(),
                            isValidate: verificationResult.isValidate || false,
                            cPath: attachmentData.cPath,
                            cFilesize: fileSize.toString(),
                            nPagerotation: verificationResult.pagerotation,
                            cPage: `1-${verificationResult.totalpages}`,
                            bisTranscript: false,
                        };

                        const fileres = await this.fileInfo.updateConvertFileInfo(fileInfoData);
                        if (fileres.msg && fileres.msg === 1) {
                            try {
                                if (fileres && fileres['cOldpath'] && fileres['cOldpath'] != '') {
                                    this.fileDeleteQueue.add({ jFiles: [fileres['cOldpath']] })
                                }
                            } catch (error) {
                                console.log('Error in fileDeleteQueue:', error)
                            }
                            await this.filecopyService.copyFile(attachmentData.cPath, '', '', fileres.nBundledetailid);
                            // await this.fileCopyQueue.add(
                            //     { cPath: attachmentData.cPath },
                            //     { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60, attempts: 3, backoff: 1000 * 60 * 5 }
                            // );
                        } else {
                            console.error('Failed to update file info for attachment:', attachmentData.data.fileName);
                        }
                    }
                })
            );
        } catch (error) {
            console.error('Error processing attachments:', error);
        }
    }

    async getSignedUrl(key: string): Promise<string> {
        try {
            console.log(`Generating signed URL for key: ${key}`);
            console.log(`Using bucket: ${this.bucketName}`);

            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            // const signedUrl = await getSignedUrl(this.s3Client, command, {
            //     expiresIn: 3600,
            // });
            try {
                await this.s3Client.send(command);
            } catch (error) {
                if (error.name === 'NotFound' || error.Code === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
                    console.log(`File not found: ${key}`);
                    // throw new NotFoundException(`File ${key} not found in bucket`);
                }
                return error;
            }
            // If we get here, the file exists, so generate the signed URL
            const getCommand = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
                expiresIn: 3600,
            });
            console.log(`Generated signed URL successfully`, signedUrl, this.config.get('DO_SPACES_ENDPOINT'));
            return signedUrl.substring(signedUrl.indexOf("doc/case"));
        } catch (error) {
            console.error(`Error generating signed URL: ${error.message}`, error.stack);
            return '';
        }
    }


    async deleteSessionFolder(sessionFolder: string): Promise<boolean> {
        try {
            // Check if folder exists
            if (!existsSync(sessionFolder)) {
                console.log('Session folder does not exist:', sessionFolder);
                return true; // Already deleted/non-existent is considered success
            }

            // Verify it's a directory
            const stats = statSync(sessionFolder);
            if (!stats.isDirectory()) {
                console.error('Path exists but is not a directory:', sessionFolder);
                return false;
            }

            // Recursive function to delete folder contents
            const deleteFolderRecursive = (folderPath: string) => {
                if (existsSync(folderPath)) {
                    readdirSync(folderPath).forEach((file) => {
                        const curPath = path.join(folderPath, file);
                        if (lstatSync(curPath).isDirectory()) {
                            // Recurse if directory
                            deleteFolderRecursive(curPath);
                        } else {
                            // Delete file
                            unlinkSync(curPath);
                        }
                    });
                    // Delete empty directory
                    rmdirSync(folderPath);
                }
            };

            // Delete the session folder and all contents
            deleteFolderRecursive(sessionFolder);
            console.log('Successfully deleted session folder:', sessionFolder);
            return true;

        } catch (error) {
            console.error('Error deleting session folder:', sessionFolder);
            console.error('Error details:', error);
            return false;
        }
    };

}
