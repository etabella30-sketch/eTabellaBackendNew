import { Injectable, Logger } from '@nestjs/common';
import { TransferHighlight } from '../../interfaces/transfer.interface';
import { RhighlightsService } from '../rhighlights/rhighlights.service';

@Injectable()
export class TransferHighlightsService {

    private readonly logger = new Logger(TransferHighlightsService.name);
    constructor(private readonly rhighlightsService: RhighlightsService) {


    }

    async transferHighlights(lineBuffer: TransferHighlight[], removedLine: TransferHighlight[], newLines: TransferHighlight[], finalData: TransferHighlight[]): Promise<void> {

        try {



            await this.rhighlightsService.transfer(lineBuffer, removedLine, newLines, finalData);




        } catch (error) {
            // Log the detailed error
            this.logger.error(
                `Error in transferHighlights: ${error.message}`,
                error.stack,
            );  // Uses Nest’s built-in Logger

            // throw new Error('Failed to process transfer highlights');  // Handled by Nest’s exception layer
        }

    }


}