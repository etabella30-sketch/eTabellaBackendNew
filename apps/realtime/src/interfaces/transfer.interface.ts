export type feedFormate = 'FL' | 'QES' | 'ANS' | 'SPKR' | 'QES-CONTINUE' | 'ANS-CONTINUE' | 'SPKR-CONTINUE' | 'PRNTH' | 'CNTRD' | 'RHT-FLS' | 'BY-LINE' | 'BY-LINE-CONTINUE' | 'USR-DEFIND';

export type TransferHighlight = [
  timestamp: string,           //  0
  textData: number,            //  1
  globalLineIndex: number,     //  2
  format: feedFormate,          //  3
  currentPage: number,         //  4
  currentLineNumber: number,   //  5
  uniqId: string | null,       //  6
  tabs: string[] | null,       //  7
  convertedFrames?: string,    //  8
  replaceIndex?: string        //  9
];
// [crTm, [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null, null, null, null];


export interface FuzzyMatchRange {
  startLine: number;  // 1-based
  endLine: number;  // 1-based
  startWordIndex: number;  // 0-based
  endWordIndex: number;  // 0-based
  fromStartLine: string;
  fromEndLine: string;
  toIndex?: number;  // 0-based
}


export interface FuzzyMatchResult {
  line: number;  // 1-based
  word: string;  // The matched word
}

export interface fuzzyPyResult {
  // start_line: number;
  // start_word: number;
  // end_line: number;
  // end_word: number;
  // score: number;
  // chunk?: string;
  end_result: optionResults;
  start_result: optionResults;
  singleMatch?: optionResults;
}


interface optionResults {
  character_index: number;
  clean_content: string[];
  clean_search: string[];
  end_character_index: number;
  line_number: number;
  primaryLine: string;
  tail: string;
  total_lines: number;
}


export interface SpanRapidfuzz {
  start_line: number;
  start_word: number;
  end_line: number;
  end_word: number;
  // …score, chunk, etc.
}


export interface logJson {
  refreshCount: number;
  line: string[];
  SearchTerm: string[];
  SearchResults: string[];
  isStart?: boolean;
  failed?: any
}


export interface searchRequest {
  content: { text: string, index: number, timestamp: string }[];
  terms: { text: string, timestamp: string }[];
  nId: string;
  type: string;
  nSesid: string;
  refreshCount: number;
}


export interface searchResponse {
  index: number;
  timestamp: string;
  text: string;
}