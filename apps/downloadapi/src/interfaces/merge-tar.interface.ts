
export interface tarList {
    name: string;
    size: number;
    type: 'large' | 'small';
    batchIndex?: number;
}


export interface CopyPartDetail {
  partNumber: number;
  key: string;
  copySource: string;
  copySourceRange?: string;
}
