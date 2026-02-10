import { FileValidateResponse } from "./chunk.interface";

export class jobDetail {
    nJobid: string;
    cPath: string;
    nUserid?: string;
    nCaseid: string;
    cStatus: string;
    nBundleid: string;
    nSectionid: string;
    identifier: string;
    converttype: string;
    bIsconvert: boolean;
    bIsocr: boolean;
    nOcrtype: number;
    nUPid: string;
    nUDid?: string;
    verificationResult?: FileValidateResponse;
    cName?: string
}
