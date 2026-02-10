import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class UnicIdentityService implements OnModuleInit {
    private readonly logger = new Logger(UnicIdentityService.name);
    private readonly sessionFilePath = path.resolve(process.cwd(), 'local-session.json');
    private cSessionUnicId: string;

    async onModuleInit(): Promise<void> {
        try {
            // Try to read existing session file
            const content = await fs.readFile(this.sessionFilePath, 'utf-8');
            const parsed = JSON.parse(content);
            if (parsed?.nUnicuserid && typeof parsed.nUnicuserid === 'string') {
                this.cSessionUnicId = parsed.nUnicuserid;
                this.logger.log(`Loaded existing nUnicuserid: ${this.cSessionUnicId}`);
                return;
            }
            throw new Error('Invalid file format');
        } catch {
            // File doesn't exist or is invalid → create a new one
            this.cSessionUnicId = this.generateRandomId(12);
            const payload = { nUnicuserid: this.cSessionUnicId };
            await fs.writeFile(this.sessionFilePath, JSON.stringify(payload, null, 2), 'utf-8');
            this.logger.log(`Created new session file with nUnicuserid: ${this.cSessionUnicId}`);
        }
    }

    /** Returns the unique user ID (after init) */
    getSessionUnicId(): string {
        return this.cSessionUnicId;
    }

    /** Generates a hex string of the given length */
    private generateRandomId(length: number): string {
        // randomBytes produces twice as many hex chars as bytes requested
        return randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }



}
