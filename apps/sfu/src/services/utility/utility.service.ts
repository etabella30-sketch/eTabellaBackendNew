import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilityService {



    getTransportKey(nPresentid: string, nUserid: string, isProducer: boolean): string {
        return `${nPresentid}|${nUserid}|${isProducer ? 'producer' : 'consumer'}`;
    }


    
}
