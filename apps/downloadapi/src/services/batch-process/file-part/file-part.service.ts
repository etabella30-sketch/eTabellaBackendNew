import { Injectable, Logger } from '@nestjs/common';
import { LargeFilePart } from 'apps/downloadapi/src/interfaces/download.interface';
import { DefaultService } from '../../default/default.service';

@Injectable()
export class FilePartService extends DefaultService {


    private readonly logger = new Logger(FilePartService.name);
    async FileParts(size, startPartNo): Promise<{ parts: LargeFilePart[], nextPartNo: number }> {
        try {
            const parts: LargeFilePart[] = [];
            const MIN = this.S3_MIN_PART_SIZE;
            const MAX = this.S3_MAX_PART_SIZE;
            let partNo = startPartNo;

            // first 5 MB
            parts.push({
                partNumber: partNo++,
                type: 'FIRST',
                dataRange: { offset: 0, length: MIN }
            });

            // last 5 MB
            const lastStart = size - MIN;
            const lastPart: LargeFilePart = {
                partNumber: null,
                type: 'LAST',
                dataRange: { offset: lastStart, length: MIN }
            };

            // middle region
            const midStart = MIN;
            const midLen = lastStart - midStart;
            if (midLen >= MIN) {
                const minParts = Math.ceil(midLen / MAX);
                const maxParts = Math.floor(midLen / MIN);
                const numParts = minParts <= maxParts ? minParts : maxParts;
                const baseSize = Math.floor(midLen / numParts);
                const remainder = midLen % numParts;

                let offset = midStart;
                for (let i = 0; i < numParts; i++) {
                    const thisSize = baseSize + (i < remainder ? 1 : 0);
                    const end = offset + thisSize - 1;
                    parts.push({
                        partNumber: partNo++,
                        type: 'MIDDLE_COPY',
                        copyRange: `bytes=${offset}-${end}`
                    });
                    offset = end + 1;
                }
            }

            // push last 5 MB
            lastPart.partNumber = partNo++;
            parts.push(lastPart);

            return { parts, nextPartNo: partNo };
        } catch (error) {
            this.logger.error('Error in FileParts', error);
            throw error;
        }

    }

}
