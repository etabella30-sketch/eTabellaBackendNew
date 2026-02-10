/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { ConfigService } from '@nestjs/config';
import { FileValidateResponse } from '../../interfaces/chunk.interface';
import * as fs from 'fs';

@Injectable()
export class VerifypdfService {
    constructor(private readonly config: ConfigService) { }

    async verifyFile(filePath: string, isTakesize?: boolean): Promise<FileValidateResponse> {
        console.log('VERIFYING FILE...');

        const defaultResponse: FileValidateResponse = {
            isValidate: false,
            totalpages: 0,
            totalsizeoffile: 0,
            pagerotation: 0,
            isLinerised: false,
        };

        try {
            const fileType = filePath.split('.').pop().toUpperCase();

            if (fileType !== 'PDF') {
                console.log('File is not a PDF');
                defaultResponse.totalsizeoffile = await this.getFileSize(filePath);
                return { ...defaultResponse, isValidate: true };
            }

            const pythonProcess = spawn(this.config.get('pythonV'), [
                this.config.get('PY_VERIFY'),
                filePath,
                isTakesize ? true : false,
            ]);

            let dataBuffer = '';

            pythonProcess.stdout.on('data', (data: Buffer) => {
                // console.log('DATA:', data.toString());
                dataBuffer += data.toString();
            });

            pythonProcess.stderr.on('data', (data: Buffer) => {
                console.log('ERROR:', data.toString());
                console.error('ERROR:', data.toString());
            });

            return new Promise((resolve, reject) => {
                pythonProcess.on('error', (err) => {
                    console.error('ERROR:', err);
                    reject(err);
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`Python process exited with code ${code}`);
                        resolve(defaultResponse);
                        return;
                    }

                    const response: FileValidateResponse = { ...defaultResponse };

                    if (dataBuffer.includes('The PDF is not corrupted.')) {
                        response.isValidate = true;

                        const lines = dataBuffer.split('\n');
                        for (const line of lines) {
                            if (line.includes('TotalPages:')) {
                                response.totalpages = parseInt(line.replace('TotalPages:', ''));
                            } else if (line.includes('FileSize:')) {
                                response.totalsizeoffile = parseInt(line.replace('FileSize:', ''));
                            } else if (line.includes('PDFRotation:')) {
                                response.pagerotation = parseInt(line.replace('PDFRotation:', ''));
                            }
                        }
                    }

                    if (dataBuffer.includes('The PDF is linearized (Fast Web View is enabled).')) {
                        response.isLinerised = true;
                    }

                    resolve(response);
                });
            });
        } catch (error) {
            console.error('ERROR:', error);
            return defaultResponse;
        }
    }

    getFileSize(filePath: string): number {
        try {
            // Check if file exists
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath); // Get file statistics
                return stats.size; // Return file size in bytes
            } else {
                return null
            }
        } catch (error) {
            console.error('Error getting file size:', error.message);
            return null
        }
    }
}