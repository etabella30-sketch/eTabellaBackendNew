export type payloadEvents = 'DOWNLOAD-STATUS' | 'DOWNLOAD-PROGRESS';
export interface KafkaPayload {
    event: payloadEvents;
    data: {
        nDPid: string;
        nMasterid: string;
        cStatus?: string;
        completedParts?: number;
        totalParts?: number;
        dStartDt?:string;
        users?: string[];
    }
}