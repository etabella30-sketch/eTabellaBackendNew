export interface serializeParts {
  partNumber: number;
  type: 'FIRST' | 'MIDDLE_COPY' | 'LAST';
  copyRange?: string;
  dataRange?: ByteRange;
  nBundledetailid: string;
  identifier: string;
  uploadId: string;
  tarKey: string;
  ETag?: string;
}


export interface serializeSmallParts {
  partNumber: number;
  identifier: string;
  uploadId: string;
  tarKey: string;
  ETag?: string;
}




export interface ByteRange {
  offset: number;
  length: number;
}