export type actionStatus = 'STARTED' | 'SIZE-UPDATING' | 'SIZE-UPDATED' | 'BATCH-STARTED' | 'FINAL-MEARGING';
export type queueStatus = 'completed' | 'failed' | 'stalled' | 'waiting' | 'active' | 'removed' | 'delayed';
export type batchStatus = 'ADDED';

export interface downloadQueuePayload {
  nDPid: string;
  nMasterid: string;
}

export interface ProcessJobDetail {
  nDPid: string;
  nCaseid: string;
  nSectionid: string;
  cStatus: 'P' | 'Q' | 'R' | 'C' | 'F';
  jFiles: string;
  jFolders: string;
  isBatchUpdated: boolean;
  cZipname: string;
}


export interface filesdetail {
  nBundledetailid: string;
  cFilename: string;
  foldername: string;
  cBatchType: 'S' | 'L' | 'I';
  cPath: string;
}


export interface LargeFilePart {
  partNumber: number;
  type: 'FIRST' | 'MIDDLE_COPY' | 'LAST';
  dataRange?: { offset: number; length: number };
  copyRange?: string;
}

export interface EnrichedFile extends filesdetail {
  size: number;
  isExists: boolean;
  parts?: LargeFilePart[];
}

export interface LargeFileBatch {
  batchIndex: number;
  files: EnrichedFile[];
  totalSize?: number;
  totalParts?: number;
}




export interface SmallFilePart {
  partNumber: number;
  files: EnrichedFile[];
  totalSize?: number;
}


export interface SmallFileBatch {
  batchIndex: number;
  parts: SmallFilePart[];
  totalSize?: number;
  totalParts?: number;
}

export interface UpdateFileSizePayload {
  bd: string,
  b: number,
  s: string,
  x: boolean,
  t: string
}


export interface QueueSummary {
  total: number;
  created: string;
  completedParts: number;
  totalParts: number;
  queueStatus: queueStatus;
  lastUpdated: string;
  actionStatus: string;
  smallBatchs: number;
  largeBatches: number;
  largeBatchAdded: boolean;
  smallBatchAdded: boolean;
  isAllPartsUploaded: boolean;
  dStartDt?: string | null; // Optional field for start date
  totalSize?: number; // Optional field for total size
  MergeCompletedParts: number;
  MergeTotalParts: number;
}