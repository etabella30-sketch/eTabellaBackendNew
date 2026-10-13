
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
  cType: string;
  cEventKey?: string;
  jTarget?: Record<string, unknown>;
  
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
