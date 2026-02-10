import { Injectable } from '@nestjs/common';
import { TransferHighlight } from '../../interfaces/transfer.interface';
import { SessionService } from '../../session/session.service';

@Injectable()
export class RhighlightsService {

    constructor(private readonly sessionService: SessionService) {

    }


    transfer(lineBuffer: TransferHighlight[], removedLine: TransferHighlight[], newLines: TransferHighlight[], finalData: TransferHighlight[]) {
        
        // const rhighlights = this.sessionService.getRhighlights();

    }

}
