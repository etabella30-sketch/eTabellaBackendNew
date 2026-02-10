
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export interface presentPosition {
  x: number;
  y: number;
  
  nBundledetailid: string;
  
  nPresentid: string;
  pageRotation: number;
  zoom: number;
  currentPage:number;
}



export interface presentCurrentTab {
  
  nBundledetailid: string;
  
  nPresentid: string;
  cFilename:string;
  originalPath: string;
  isLoaded:boolean;
  cType:string;
}


export interface presentCompare {
  
  nPresentid: string;
  compareMode:boolean;
  compareIndex:number;
  compareDocumentList:any[];
}



export interface presentCompareData {
  
  nPresentid: string;
  compareMode:boolean;
  toolBarOptions: pdfToolOptions;
}


interface pdfToolOptions {
  pageRotation: any;
  handTool: boolean;
  zoom: string | number;
  totalSearch: number;
  currentSearch: number;
  isSearching: boolean;
  pageViewMode: string;
  docInfo: any;
  currentPage: number;
  pagesCount: number;
  pdfLoaded: boolean;
  pagginationRenge: any[];
}