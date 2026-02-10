
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export interface notificationReq {
  
  nUserid: string;
  cTitle: string;
  cMsg: string;
  cStatus: string;
  
  nFSid: string;
  
  nDocid: string;
  
  nWebid: string;
  
  nBundledetailid: string;
  cType: 'FS' | 'DS' | 'WS' | 'LS' | 'U' | 'I' | 'P' | 'H' | 'PRESENT-START' | 'PRESENT-USER-ADDED';
  
  nCaseid: string;
  cToken: string;
  
  nUPid: string;
  
  nRefuserid: string;
  action?: any;
  
  nPresentid: string;
}

export class notificationRes {
  msg: number;
  res: any;
  
  nNTid?: string;
}
