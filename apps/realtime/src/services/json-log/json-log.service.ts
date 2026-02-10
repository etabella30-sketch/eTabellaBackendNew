import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { logJson } from '../../interfaces/transfer.interface';


@Injectable()
export class JsonLogService {


    async saveLog(
        filepathId: string,
        jsonObject: logJson[],
        sessionId: string = 'default',
    ): Promise<void> {
        const folderPath = path.join('logs', sessionId, 'python');
        const filePath = path.join(folderPath, `${filepathId}.json`);

        try {
            // Ensure directory exists
            await fs.mkdir(folderPath, { recursive: true });

            let logs: any[] = [];

            try {
                const fileContent = await fs.readFile(filePath, 'utf8');
                logs = JSON.parse(fileContent);
                if (!Array.isArray(logs)) {
                    throw new Error('Log file is not a valid array.');
                }
            } catch (err) {
                // If file does not exist or is invalid, we start fresh
                logs = [];
            }

            logs.push(...jsonObject);

            await fs.writeFile(filePath, JSON.stringify(logs, null, 2), 'utf8');
            console.log(`✅ Log saved to ${filePath}`);
        } catch (err) {
            console.error(`❌ Failed to save log to ${filePath}:`, err);
            throw err;
        }
    }
}