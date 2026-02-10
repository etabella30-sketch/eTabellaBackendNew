import { Injectable, Logger } from '@nestjs/common';
import { DefaultService } from '../../default/default.service';
import { EnrichedFile } from 'apps/downloadapi/src/interfaces/download.interface';

@Injectable()
export class BatchSplitService extends DefaultService {

    private readonly logger = new Logger(BatchSplitService.name);

    splitBatchFiles(files: EnrichedFile[]): { smallFiles: EnrichedFile[], largeFiles: EnrichedFile[], invalidFiles: EnrichedFile[] } {
        try {

            const smallFiles: EnrichedFile[] = files.filter(file => file.size && file.size < this.LARGE_BATCH_FILE_SIZE);
            const largeFiles: EnrichedFile[] = files.filter(file => file.size && file.size >= this.LARGE_BATCH_FILE_SIZE);
            const invalidFiles: EnrichedFile[] = files.filter(file => !file.size);


            return { smallFiles, largeFiles, invalidFiles };
        } catch (error) {
            this.logger.error(`Error splitting batch files: ${error.message}`, error.stack);
            throw new Error(`Error splitting batch files: ${error.message}`);
        }

    }

}
