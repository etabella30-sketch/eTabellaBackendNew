import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { Injectable } from '@nestjs/common';
import { notificationReq } from '../../interfaces/notification.interface';

@Injectable()
export class UtilityService {
    constructor(private readonly kafka: KafkaGlobalService) { }


    emit(data: any, topic?: string) {
        this.kafka.sendMessage((topic ? topic : 'hyperlink-response'), data);
    }

    sendNotification(notificationlist: any[], nMasterid) {
        try {
            notificationlist.forEach((jobData: any) => {
                const mdl: notificationReq = {
                    nUserid: jobData.nUserid,
                    cTitle: jobData.cTitle,
                    cMsg: jobData.cMsg,
                    cStatus: jobData.cStatus || 'P',
                    cType: jobData.cType,
                    nCaseid: jobData.nCaseid,
                    cToken: jobData.cToken,
                    nFSid: jobData.nFSid || null,
                    nDocid: jobData.nDocid || null,
                    nWebid: jobData.nWebid || null,
                    nBundledetailid: jobData.nBundledetailid || null,
                    nRefuserid: nMasterid || null
                    
                }
                this.emit(mdl, 'notification');
            });
        } catch (error) {
            console.log('Error in sending notification', error);
        }


    }
}
