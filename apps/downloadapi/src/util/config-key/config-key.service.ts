import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigKeyService {

    /* LARGE BATCHES*/
    largeBatchQueueName = (nDPid: string): string => {
        return `download:${nDPid}:large-batches`;
    }

    largePartQueueName = (nDPid: string, batchIndex: number): string => {
        return `download:${nDPid}:large-parts-${batchIndex}`;
    }

    /* SMALL BATCHES*/
    smallBatchQueueName = (nDPid: string): string => {
        return `download:${nDPid}:small-batches`;
    }

    smallPartQueueName = (nDPid: string, batchIndex: number): string => {
        return `download:${nDPid}:small-parts-${batchIndex}`;
    }

    /* ACTIVE BATCHES */
    activeBatchesKey = (nDPid: string, batch: 'small' | 'large'): string => {
        return `download:${nDPid}:active:${batch}:batches`;
    }

    /* ACTIVE PARTS */
    activePartsKey = (nDPid: string, batchIndex: number, batch: 'small' | 'large'): string => {
        return `download:${nDPid}:active:${batch}:parts-${batchIndex}`;
    }

    largeBatchName(nDPid: string, batchIndex: number): string {
        return `${nDPid}/batches/batch_${batchIndex}.tar`;
    }

    smallBatchName(nDPid: string, batchIndex: number): string {
        return `${nDPid}/batches/smallbatch_${batchIndex}.tar`;
    }

    finalArchiveName(nDPid: string, tarName: string): string {
        return `${nDPid}/${tarName || 'final-archiver'}.tar`;
    }
}
