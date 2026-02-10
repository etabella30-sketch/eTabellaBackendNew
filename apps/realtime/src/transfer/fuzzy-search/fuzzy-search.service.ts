import { Injectable, Logger } from '@nestjs/common';
import { SequenceMatcher } from 'difflib';
import { FuzzyMatchRange, FuzzyMatchResult, fuzzyPyResult, searchRequest, searchResponse, SpanRapidfuzz } from '../../interfaces/transfer.interface';
import { RapidfuzzService } from '../rapidfuzz/rapidfuzz.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, lastValueFrom, of } from 'rxjs';
import { map, retry, timeout, catchError } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
// import Fuse from 'fuse.js';
// const Fuse = require('fuse.js').default;  // ← Note the “.default” here

@Injectable()
export class FuzzySearchService {

    private readonly logger = new Logger(FuzzySearchService.name);
    constructor(private readonly rapidfuzzService: RapidfuzzService, private readonly httpService: HttpService,
        private readonly config: ConfigService
    ) {

    }

    /*findMatcheIndexDiffLib(
        lines: string[],
        query: string,
        type: 'START' | 'END',
        margin: number,
        threshold = 0.4
    ): number {
        if (!Array.isArray(lines)) {
            throw new Error('Invalid input: lines must be an array');
        }

        try {
            let idx = 0;
                for (idx; idx < lines.length; idx++) {
                    const matcher = new SequenceMatcher(null, query, lines[idx]);
                    if (matcher.ratio() >= threshold) {
                        return idx;
                    }
                }
        
            // no match above threshold
            return -1;
        } catch (error) {
            this.logger.error(
                `Error in findFirstMatch (query="${query}", threshold=${threshold}): ${error.message}`,
                error.stack,
            );
            throw new Error('Failed to perform fuzzy search');
        }
    }*/

    /*
        findMatcheIndexDiffLib(
            lines: string[],
            query: string,
            type: 'START' | 'END',
            margin: number,
            matchedFirstIndex: number | null = null,
            threshold = 0.6
        ): number {
            if (!Array.isArray(lines)) {
                throw new Error('Invalid input: lines must be an array');
            }
    
            try {
                const len = lines.length;
                // Clamp margin to [0, len-1]
                const startIdx = Math.min(Math.max(Math.floor(margin), 0), len - 1);
    
                if (type === 'START') {
                    // scan backwards from startIdx down to 0
                    for (let idx = startIdx; idx >= 0; idx--) {
                        const matcher = new SequenceMatcher(null, query, lines[idx]);
                        const score = matcher.ratio();
                        if (score >= threshold) {
                            this.logger.log(`difflib START match @${idx} (score=${score.toFixed(3)})`);
                            return idx;
                        }
                    }
                } else {
                    // scan forwards from startIdx up to len-1
                    for (let idx = matchedFirstIndex; idx < len; idx++) {
                        const matcher = new SequenceMatcher(null, query, lines[idx]);
                        const score = matcher.ratio();
                        if (score >= threshold) {
                            this.logger.log(`difflib END match @${idx} (score=${score.toFixed(3)})`);
                            return idx;
                        }
                    }
                }
    
                // nothing matched
                this.logger.log(`No difflib match (${type}) under threshold=${threshold}`);
                return -1;
            } catch (error) {
                this.logger.error(
                    `Error in findMatcheIndexDiffLib (type=${type}, margin=${margin}, threshold=${threshold}): ${error.message}`,
                    error.stack,
                );
                throw new Error('Failed to perform fuzzy search (difflib)');
            }
        }
    */

    /**
     * Fuzzy-searches `query` across `lines` (and merges each line with its successor),
     * and returns the best matching chunk’s line & word indices.
     * Returns null if nothing exceeds the `threshold`.
     */

    /* findMatcheIndexDiffLib(
         lines: string[],
         query: string,
         type: 'START' | 'END',
         margin: number,
         matchedFirstIndex: number | null = null,
         threshold = 0.7
     ): FuzzyMatchRange | null {
         try {
             this.logger.fatal('LINES TO SEARCH', lines);
 
             this.logger.fatal('QUERY TO SEARCH', query);
             if (!Array.isArray(lines)) {
                 throw new Error('Invalid input: lines must be an array');
             }
 
             const len = lines.length;
             const clamp = (n: number) => Math.min(Math.max(Math.floor(n), 0), len - 1);
             const startIdx = clamp(margin);
 
             // Build the scan order based on START or END
             let scanIdxs: number[] = [];
             if (type === 'START') {
                 for (let i = startIdx; i >= 0; i--) scanIdxs.push(i);
             } else {
                 const forwardStart = matchedFirstIndex != null ? clamp(matchedFirstIndex) : startIdx;
                 for (let i = forwardStart; i < len; i++) scanIdxs.push(i);
             }
 
             // For each line index in our scan order...
             for (const idx of scanIdxs) {
                 // Build candidates: the line itself and (if exists) merged with next
                 const cands = [
                     { text: lines[idx], startLine: idx, endLine: idx }
                 ];
                 if (idx + 1 < len) {
                     cands.push({
                         text: lines[idx].trim() + ' ' + lines[idx + 1].trim(),
                         startLine: idx,
                         endLine: idx + 1
                     });
                 }
 
                 // Slide a word-window over each candidate
                 for (const cand of cands) {
                     const words = cand.text.split(/\s+/).filter(Boolean);
                     for (let s = 0; s < words.length; s++) {
                         for (let e = s + 1; e <= words.length; e++) {
                             const chunk = words.slice(s, e).join(' ');
                             const score = new SequenceMatcher(null, query, chunk).ratio();
 
                             if (score >= threshold) {
                                 const result: FuzzyMatchRange = {
                                     startLine: cand.startLine + 1,
                                     endLine: cand.endLine + 1,
                                     startWordIndex: s,
                                     endWordIndex: e - 1,
                                 };
                                 this.logger.verbose(
                                     `difflib ${type} match lines ` +
                                     `${result.startLine}–${result.endLine} words ` +
                                     `${s}–${e - 1} (score=${score.toFixed(3)})`
                                 );
                                 // this.logger.verbose(`search result`, result);
                                 return result;
                             }
                         }
                     }
                 }
             }
 
             this.logger.log(`No difflib match (${type}) under threshold=${threshold}`);
             return null;
         } catch (error) {
             this.logger.error(
                 `Error in findMatcheIndexDiffLib (type=${type}, margin=${margin}, threshold=${threshold}): ${error.message}`,
                 error.stack
             );
             throw new Error('Failed to perform fuzzy search (difflib)');
         }
     }*/


    findBestMatchIndexDiffLib(
        lines: string[],
        query: string,
        threshold = 0.6
    ): number {
        if (!Array.isArray(lines)) {
            throw new Error('Invalid input: lines must be an array');
        }

        try {
            let bestIdx = -1;
            let bestScore = threshold;

            for (let idx = 0; idx < lines.length; idx++) {
                const matcher = new SequenceMatcher(null, query, lines[idx]);
                const score = matcher.ratio();

                if (score >= threshold && score > bestScore) {
                    bestScore = score;
                    bestIdx = idx;
                }
            }

            if (bestIdx >= 0) {
                this.logger.log(
                    `difflib BEST match @${bestIdx} (score=${bestScore.toFixed(3)})`
                );
            } else {
                this.logger.log(
                    `No difflib match above threshold=${threshold}`
                );
            }

            return bestIdx;
        } catch (error) {
            this.logger.error(
                `Error in findBestMatchIndexDiffLib (threshold=${threshold}): ${error.message}`,
                error.stack
            );
            throw new Error('Failed to perform fuzzy search (difflib)');
        }
    }

    findMatcheIndexDiffLib(
        lines: string[],
        query: string,
        type: 'START' | 'END',
        margin: number,
        matchedFirstIndex: number | null = null,
        threshold = 0.6
    ): { lineIndex: number; wordIndex: number } {
        if (!Array.isArray(lines)) {
            throw new Error('Invalid input: lines must be an array');
        }

        try {
            const len = lines.length;
            // Clamp margin to [0, len-1]
            const startIdx = Math.min(Math.max(Math.floor(margin), 0), len - 1);

            if (type === 'START') {
                // scan backwards from startIdx down to 0
                for (let idx = startIdx; idx >= 0; idx--) {
                    const matcher = new SequenceMatcher(null, query, lines[idx]);
                    const score = matcher.ratio();
                    if (score >= threshold) {
                        const wordIndex = this.getMatchWordIndex(matcher, lines[idx], 'START');
                        this.logger.log(`difflib START match @${idx} (score=${score.toFixed(3)}, wordIndex=${wordIndex})`);
                        return { lineIndex: idx, wordIndex };
                    }
                }
            } else {
                // scan forwards from startIdx up to len-1
                for (let idx = matchedFirstIndex; idx < len; idx++) {
                    const matcher = new SequenceMatcher(null, query, lines[idx]);
                    const score = matcher.ratio();
                    if (score >= threshold) {
                        const wordIndex = this.getMatchWordIndex(matcher, lines[idx], 'END');
                        this.logger.log(`difflib END match @${idx} (score=${score.toFixed(3)}, wordIndex=${wordIndex})`);
                        return { lineIndex: idx, wordIndex };
                    }
                }
            }

            // nothing matched
            this.logger.log(`No difflib match (${type}) under threshold=${threshold}`);
            return { lineIndex: -1, wordIndex: -1 }; // Return -1 for both indices if no match found
        } catch (error) {
            this.logger.error(
                `Error in findMatcheIndexDiffLib (type=${type}, margin=${margin}, threshold=${threshold}): ${error.message}`,
                error.stack,
            );
            throw new Error('Failed to perform fuzzy search (difflib)');
        }
    }

    /**
     * Helper method to get word index from character position
     */
    private getMatchWordIndex(matcher: any, line: string, type: 'START' | 'END'): number {
        const matchingBlocks = matcher.getMatchingBlocks();

        if (matchingBlocks.length === 0) {
            return 0;
        }

        // Find the largest matching block
        let bestBlock = matchingBlocks[0];
        for (const block of matchingBlocks) {
            if (block.size > bestBlock.size) {
                bestBlock = block;
            }
        }

        // Get character position in the line (b refers to the second string, which is the line)
        const charPosition = type === 'START' ? bestBlock.b : bestBlock.b + bestBlock.size - 1;

        // Convert character position to word index
        return this.charPositionToWordIndex(line, charPosition, type);
    }

    /**
     * Convert character position to word index
     */
    private charPositionToWordIndex(text: string, charPosition: number, type: 'START' | 'END'): number {
        // Split text into words (keeping track of positions)
        const words = text.split(/\s+/);
        let currentPos = 0;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const wordStart = currentPos;
            const wordEnd = currentPos + word.length - 1;

            // Check if character position falls within this word
            if (charPosition >= wordStart && charPosition <= wordEnd) {
                return type === 'START' ? i : i;
            }

            // Check if character position is in the space after this word
            if (charPosition < wordStart + word.length + 1) {
                return type === 'START' ? i : i;
            }

            // Move to next word (account for space)
            currentPos += word.length + 1;
        }

        // If we reach here, return last word index
        return type === 'START' ? 0 : words.length - 1;
    }

    cleanText(input) {
        try {
            return input
            // 1. Split on any whitespace into tokens
            // .split(/\s+/)
            // 2. Filter out tokens made up only of dots or carets
            // .filter(token => !/^[\.\^]+$/.test(token))
            // 3. Rejoin tokens with a single space
            // .join(' ');
        } catch (error) {
            return input; // If any error occurs, return the original input
            this.logger.error(`Error cleaning text: ${error.message}`, error.stack);
        }
    }

    findFuzzySearch(bufferLines, queryString, isRecalculateLine?: boolean): FuzzyMatchRange {
        debugger;
        const lines = bufferLines.map(line => line.trim());
        const query = this.cleanText(queryString.trim());
        let bestScore = 0;
        let bestChunk = '';
        let bestLineStart = -1;
        let bestLineEnd = -1;
        let bestStartWordIdx = -1;
        let bestEndWordIdx = -1;

        for (let i = 0; i < lines.length; i++) {
            // Consider single line and combined with next line
            const candidates = [
                { text: lines[i], startLine: i, endLine: i }
            ];
            if (i < lines.length - 1) {
                candidates.push({
                    text: lines[i].trim() + ' ' + lines[i + 1].trim(),
                    startLine: i,
                    endLine: i + 1
                });
            }

            for (const cand of candidates) {
                const words = cand.text.split(/\s+/);
                for (let start = 0; start < words.length; start++) {
                    for (let end = start + 1; end <= words.length; end++) {
                        const chunk = words.slice(start, end).join(' ');
                        const score = new SequenceMatcher(null, query, chunk).ratio();
                        if (score > bestScore) {
                            bestScore = score;
                            bestChunk = chunk;
                            bestLineStart = cand.startLine;
                            bestLineEnd = cand.endLine;
                            bestStartWordIdx = start;
                            bestEndWordIdx = end - 1;
                        }
                    }
                }
            }
        }

        // Adjust word indices if the best match spans two lines
        if (bestLineStart !== -1 && bestLineEnd !== -1 && bestLineStart !== bestLineEnd) {
            const wordsLineStart = lines[bestLineStart].trim().split(/\s+/);
            const offset = wordsLineStart.length;
            if (bestStartWordIdx >= offset) {
                // Match starts in the second line portion (no words from the first line)
                bestStartWordIdx -= offset;
                bestEndWordIdx -= offset;
                bestLineStart = bestLineEnd;  // treat as if it’s entirely in the second line
            } else {
                // Match spans from first line into second line
                bestEndWordIdx -= offset;
                // (bestStartWordIdx remains relative to the first line)
            }
        }



        this.logger.fatal('Lines', lines);

        this.logger.fatal('Query', query);


        const extracted = this.extractFuzzyText(lines, bestLineStart, bestLineEnd, bestStartWordIdx, bestEndWordIdx, isRecalculateLine);

        this.logger.fatal('Final Result', {
            chunk: bestChunk,
            score: bestScore,
            fromStartLine: extracted.fromStartLine,
            fromEndLine: extracted.fromEndLine,
            startLine: bestLineStart + 1,
            endLine: bestLineEnd + 1,
            startWordIndex: bestStartWordIdx,
            endWordIndex: bestEndWordIdx
        });



        return {
            // chunk: bestChunk,
            // score: bestScore,
            fromStartLine: extracted.fromStartLine,
            fromEndLine: extracted.fromEndLine,
            startLine: bestLineStart,
            endLine: bestLineEnd,
            startWordIndex: bestStartWordIdx,
            endWordIndex: bestEndWordIdx
        };
    }

    extractFuzzyText(lines, startLine, endLine, startWordIndex, endWordIndex, isRecalculateLine: boolean) {
        debugger;
        const result = {
            fromStartLine: '',
            fromEndLine: ''
        };


        if (startLine === endLine && !isRecalculateLine) {
            // Match is on a single line
            // Extract from startLine: from startWordIndex to end
            const words = lines[startLine].trim().split(/\s+/);
            if (startWordIndex <= endWordIndex) { // && endWordIndex < words.length
                const matchWords = words.slice(startWordIndex, endWordIndex + 1);
                result.fromStartLine = matchWords.join(' ');
                result.fromEndLine = result.fromStartLine; // Optional: duplicate or leave blank
            }
            return result;
        }

        // Extract from startLine: from startWordIndex to end
        const startWords = lines[startLine].trim().split(/\s+/);
        if (startWordIndex < startWords.length) {
            result.fromStartLine = startWords.slice(startWordIndex).join(' ');
        }

        // Extract from endLine: from 0 to endWordIndex
        const endWords = lines[endLine].trim().split(/\s+/);
        if (endWordIndex >= 0 && endWordIndex < endWords.length) {
            result.fromEndLine = endWords.slice(0, endWordIndex + 1).join(' ');
        }

        return result;
    }




    findBestFuzzyMatchInText(data, query) {
        // 1) Tokenize on whitespace
        const words = data.trim().split(/\s+/);

        console.log([...words].map((a, index) => `${index}: ${a}`));
        const qWords = query.trim().split(/\s+/);
        const qLen = qWords.length;
        if (!qLen || !words.length) {
            return { start: -1, end: -1, score: 0, chunk: '' };
        }

        // 2) Slide windows of size [qLen-1, qLen, qLen+1]
        const windowSizes = [qLen - 1, qLen, qLen + 1].filter(n => n > 0);
        let bestScore = 0, bestStart = 0, bestEnd = qLen - 1;

        for (const w of windowSizes) {
            for (let i = 0; i + w <= words.length; i++) {
                const chunk = this.chunkFromWords(words, i, i + w - 1);
                const score = this.fuzzyRatio(query, chunk);
                if (score > bestScore) {
                    bestScore = score;
                    bestStart = i;
                    bestEnd = i + w - 1;
                }
            }
        }

        // 3) Trim off any non‐matching boundaries
        const trimmed = this.trimBoundaries(words, query, bestStart, bestEnd, bestScore);

        return {
            start: trimmed.start,
            end: trimmed.end,
            score: trimmed.score,
            chunk: this.chunkFromWords(words, trimmed.start, trimmed.end)
        };
        // return {
        //     start: bestStart,
        //     end: bestEnd,
        //     score: bestScore,
        //     chunk: this.chunkFromWords(words, bestStart, bestEnd)
        // };
    }


    trimBoundaries(words, query, start, end, currentScore) {
        let improved = true;
        while (improved && start < end) {
            improved = false;
            // Try dropping the first word
            const dropFirstChunk = this.chunkFromWords(words, start + 1, end);
            const scoreDropFirst = this.fuzzyRatio(query, dropFirstChunk);
            if (scoreDropFirst > currentScore) {
                start++;
                currentScore = scoreDropFirst;
                improved = true;
                continue; // re‐try trimming from new boundaries
            }
            // Try dropping the last word
            const dropLastChunk = this.chunkFromWords(words, start, end - 1);
            const scoreDropLast = this.fuzzyRatio(query, dropLastChunk);
            if (scoreDropLast > currentScore) {
                end--;
                currentScore = scoreDropLast;
                improved = true;
            }
        }
        return { start, end, score: currentScore };
    }

    chunkFromWords(words, start, end) {
        return words.slice(start, end + 1).join(' ');
    }

    fuzzyRatio(a, b) {
        return new SequenceMatcher(null, a.trim(), b.trim()).ratio();
    }

    async textSearch(lines: string[], queryLines: string[]): Promise<FuzzyMatchResult[]> {
        debugger;
        // const linesDetail = lines.map(a => a.trim()).map((a, index) => ({ line: index, textLength: a?.length, wordCount: a?.split(/\s+/).length, text: a }));
        // this.logger.fatal('Lines Detail', linesDetail);


        const targetText = lines.map(a => a.trim()).join(' ');
        const query = queryLines.map(a => a.trim()).join(' ');

        let wordCounter = 0;
        const wordsWithMeta = lines.flatMap((text, lineIdx) => {
            return text
                .split(/\s+/)
                .map(word => ({
                    wordIndex: wordCounter++,
                    line: lineIdx,
                    word
                }));
        });

        this.logger.fatal('Target Text', targetText);

        this.logger.fatal('Lines Detail', wordsWithMeta);

        const result = this.findBestFuzzyMatchInText(targetText, query);

        // const rapidResult = await this.rapidfuzzService.runCommand(lines, queryLines)

        // this.logger.fatal('Rapidfuzz Result', rapidResult);
        this.logger.fatal(`🔍 Query:     "${query.trim()}"`);
        this.logger.fatal(`🔍 Best span: words ${result.start}–${result.end}`);
        this.logger.fatal(`🎯 Score:     ${result.score.toFixed(3)}`);
        this.logger.fatal(`📦 Chunk:     "${result.chunk}"`);

        const cordinates: FuzzyMatchResult[] = []

        if (result.start >= 0 && result.end >= 0) {
            // Convert word indices to line & word numbers
            for (let i = result.start; i <= result.end; i++) {
                const wordMeta = wordsWithMeta[i];
                if (wordMeta) {
                    const lineObj = cordinates.find(a => a.line == wordMeta.line);
                    if (lineObj) {
                        lineObj.word += ` ${wordMeta.word}`;
                    } else {
                        cordinates.push({
                            line: wordMeta.line,
                            word: wordMeta.word
                        });
                    }

                }
            }
        } else {
            this.logger.fatal('No matches found');
        }

        return cordinates;
    }

    /*async textSearchPython(lines: string[], queryLines: string[]): Promise<FuzzyMatchResult[]> {
        try {
            const rapidResult = await this.postSearchData(lines, queryLines); //this.rapidfuzzService.runCommand(lines, queryLines);
            if (!rapidResult) {
                this.logger.warn('No results returned from Python search');
                return [];
            }
            this.logger.fatal('Rapidfuzz Result', rapidResult);
            const results = this.extractMatches(lines, rapidResult);

            return results;
        } catch (error) {
            this.logger.error('Error during text search with Python:', error);
            throw new Error(error?.message);
        }
    }*/

    async textSearchPython(lines: string[], queryLines: string[]): Promise<fuzzyPyResult> {
        try {
            const rapidResult = await this.postSearchData(lines, queryLines); //this.rapidfuzzService.runCommand(lines, queryLines);
            if (!rapidResult) {
                this.logger.warn('No results returned from Python search');
                return null;
            }
            return rapidResult;
        } catch (error) {
            this.logger.error('Error during text search with Python:', error);
            throw new Error(error?.message);
        }
    }






    extractMatches(lines: string[], span: SpanRapidfuzz): FuzzyMatchResult[] {
        const { start_line, start_word, end_line, end_word } = span;
        const results: FuzzyMatchResult[] = [];

        for (let ln = start_line; ln <= end_line; ln++) {
            const text = lines[ln - 1] || '';
            // split line into tokens
            const tokens = text.split(/\s+/).filter(t => t.length > 0);

            // determine slice bounds for this line
            const from = ln === start_line ? start_word - 1 : 0;
            const to = ln === end_line ? end_word : tokens.length;

            // clamp to valid indices
            const startIdx = Math.max(0, Math.min(from, tokens.length));
            const endIdx = Math.max(0, Math.min(to, tokens.length));

            const slice = tokens.slice(startIdx, endIdx);
            if (slice.length) {
                results.push({
                    line: ln - 1,
                    word: slice.join(' ')
                });
            }
        }

        return results;
    }



    async postSearchData(lines: string[], queryLines: string[]): Promise<fuzzyPyResult> {
        try {

            const payload = {
                contentText: lines,
                searchText: queryLines
            };
            // fire the POST and await the response
            const url = this.config.get('SEARCH_API_URL') || 'http://127.0.0.1:5001/match';

            this.logger.verbose('URL', url);
            const response$ = this.httpService.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 1000 * 60, // ms, adjust as needed
            });
            const response = await lastValueFrom(response$);
            // this.logger.fatal('RES', response);
            if (response.status !== 200) {
                this.logger.error(`Python API responded with status ${response.status}`);
                throw new Error(`Python API responded with status ${response.status}`);
            }
            return response.data?.match || null;
        } catch (error) {
            this.logger.error('PY ERROR', error?.message);
            throw new Error(`PY ERROR ${error?.message}`);
            //  return null;
        }
    }


    /*async postSearchData(
        lines: string[],
        queryLines: string[]
    ): Promise<fuzzyPyResult[]> {
        const payload = { contentText: lines, searchText: queryLines };
        const url = this.config.get('SEARCH_API_URL')
            || 'http://127.0.0.1:5001/match';

        // build the observable with retry/timeout/fallback
        const response$ = this.httpService
            .post<{ match: fuzzyPyResult }>(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                // you can keep this, but RxJS timeout is more flexible
            })
            .pipe(
                // if it errors (network, timeout, 5xx), retry up to 2 more times
                retry(2),

                // if it still hasn’t emitted in 5s, error out
                timeout(5000),

                // map only the payload we care about
                map(resp => resp.data.match),

                // catch any error in the chain, log it, and return null instead
                catchError(err => {
                    this.logger.warn('Search API failed, returning null', err.message);
                    return of<null>(null);
                }),
            );

        // firstValueFrom will never throw here, because catchError returns a value
        return firstValueFrom(response$);
    }*/








    async generateNewCordinates(body: searchRequest): Promise<searchResponse[]> {
        try {
            const payload = body;
            // fire the POST and await the response
            const url = this.config.get('SEARCH_API_URL') || 'http://127.0.0.1:5001/search';

            // this.logger.verbose('URL', url);
            const response$ = this.httpService.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 1000 * 60, // ms, adjust as needed
                maxRedirects: 2
            });
            const response = await lastValueFrom(response$);
            // this.logger.fatal('RES', response);
            if (response.status !== 200) {
                this.logger.error(`Python API responded with status ${response.status}`);
                throw new Error(`Python API responded with status ${response.status}`);
            }
            if (response.data?.msg == 1) {
                return response.data?.match;
            } else {
                throw new Error(`No response found :${response.data?.error || ''}`);
            }

        } catch (error) {
            this.logger.error('PY ERROR', error?.message);
            throw new Error(`PY ERROR ${error?.message}`);
            //  return null;
        }
    }





}