import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
@Injectable()
export class FilesystemService {
    constructor(private config: ConfigService) {

    }
    createDirectoryHierarchy(dirPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const fullPath = path.join(this.config.get('ASSETS'), dirPath);
            // The 'recursive' option in 'fs.mkdir' creates the directory path along with any nested directories if they don't exist
            try {
                if (!fs.existsSync(fullPath)) {
                    fs.mkdir(fullPath, { recursive: true }, (error) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            } catch (error) {

            }

        });
    }


}
