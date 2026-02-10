
export interface notificationReq {
  nUserid: number;
  cTitle: string;
  cMsg: string;
  cStatus: string;
  nFSid?: number;
  nDocid?: number;
  nWebid?: number;
  nBundledetailid?: number;
  cType: 'FS' | 'DS' | 'WS' | 'LS';
  nCaseid: number;
  cToken: string;
  nRefuserid: number;
}
