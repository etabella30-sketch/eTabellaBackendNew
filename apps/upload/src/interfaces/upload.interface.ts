
export class saveFileInfoReq {
    nMasterid: string;
    cFilename: string;
    nSectionid: string;
    nBundleid: string;
    nBundledetailid: string;
    cFiletype: string;
    isValidate: boolean;
    cPath: string;
    cFilesize: string;
    nPagerotation: number;
    cPage: string;
    bisTranscript: boolean | false;
    nUDid: string;
    bMetadata?: boolean;
    nBaseBDid?: string;
}


export class startJob {
    nUDid: string;
    nMasterid: string;
    cPath: string;
    nCaseid: string;
    nSectionid: string;
    nBundleid: string;
    identifier: string;
    bIsconvert?: boolean;
    converttype?: boolean;
    bIsocr?: boolean;
    nOcrtype?: number;
}

export class saveConvertFileInfoReq {
    nMasterid: string;
    cFilename: string;
    nSectionid: string;
    nBundleid: string;
    nBundledetailid: string;
    cFiletype: string;
    isValidate: boolean;
    cPath: string;
    cFilesize: string;
    nPagerotation: number;
    cPage: string;
    bisTranscript: boolean | false;
    nUDid?: string;
}