import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import * as levenshtein from 'fast-levenshtein';

import * as moment from 'moment';
import { EventEmitter2 } from '@nestjs/event-emitter';

const Fuse = require('fuse.js');

@Injectable()
export class UtilityService implements OnApplicationBootstrap {

  private failedSessionPages: any[] = [];

  private readonly logger = new Logger('utility-service');
  constructor(private eventEmitter: EventEmitter2) {

  }

  getFaildSession() {
    return this.failedSessionPages;
  }

  setFaildSession(sessionData, currentSession) {
    this.failedSessionPages = sessionData;
    this.saveFailedPage(this.failedSessionPages, currentSession);
  }


  async onApplicationBootstrap() {
    this.failedSessionPages = [];
    try {
      const data = await this.readJsonFromFile('faileddata/data.json');
      if (data && data.length) {
        this.failedSessionPages = data;
        // console.log('Failed data loaded successfully.', this.failedSessionPages);
      }
    } catch (error) {
      this.logger.error('Error reading failed data:', error);
    }
  }

  private pattern = /\x0F.*?\x0C[^\s]*/ // /\x0F\d{8}\x0C\d{4}/;
  private customPattern = /y([0-9A-Fa-f]+)z/g;

  private writeFileAsync = promisify(fs.writeFile);
  private readFileAsync = promisify(fs.readFile);

  getRT(): string {
    return `\x0F${new Date().getFullYear()}${("0" + (new Date().getMonth() + 1)).slice(-2)}${("0" + new Date().getDate()).slice(-2)}\x0C`;
  }

  pageNoReplace(str: string): string {
    return str.replace(this.pattern, "");
  }

  matchPattern(str: string): boolean {
    return this.pattern.test(str);
  }

  getIndianTM(): string {
    return new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  getDate(): string {
    const date = new Date();
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const result = new Date(utc + 3600000 * +5.5);
    return `${result.getFullYear()}-${("0" + (result.getMonth() + 1)).slice(-2)}-${("0" + result.getDate()).slice(-2)}`;
  }

  async fileLog(nm: string, val: string, lgName: string): Promise<void> {
    try {
      val = val.replace(/\n/g, `\n${this.getIndianTM()}  -  `);
      const dt1 = this.getDate();
      const name = `file${nm}_${lgName}`;
      const dir = './logs';

      if (!fs.existsSync(dir)) {
        await fsp.mkdir(dir, { recursive: true });
      }

      await fsp.appendFile(`${dir}/${dt1}_${name}.txt`, val);
    } catch (error) {
      this.logger.error('Error log:', error);
    }
  }

  async writeJSONToFile(obj: any, filePath: string): Promise<void> {
    try {
      const fullPath = path.resolve(filePath);
      const dirPath = path.dirname(fullPath);

      await fsp.mkdir(dirPath, { recursive: true });
      const jsonData = JSON.stringify(obj, null, 2);

      await fsp.writeFile(fullPath, jsonData);
      // console.log('JSON successfully written to', fullPath);
    } catch (err) {
      this.logger.error('Error writing file:', err);
    }
  }

  replaceCustomPattern(input: string): string {
    return input.replace(this.customPattern, "\n");
  }

  async saveData(data: any, currentSession: string, filename: string): Promise<void> {
    await this.writeJSONToFile({ d: data }, `data/sessions${currentSession}/${filename}.json`);
  }


  async markFailedPage(data, currentSession: any): Promise<void> {
    try {

      if (!currentSession) return;
      let obj = this.failedSessionPages.find((session) => session.nSesid == currentSession);
      if (obj) {
        if (!obj.d.includes(data.p)) {
          obj.d.push(data.p);
        }
      } else {
        this.failedSessionPages.push({ nSesid: currentSession, d: [data.p] });
      }
    } catch (error) {
      this.logger.error('Error marking failed page:', error);
    }
    // let sessionFailedData = this.failedSessionPages.find((session) => session.nSesid == currentSession);
    this.saveFailedPage(this.failedSessionPages, currentSession)
  }

  async saveFailedPage(datas: any, currentSession: string): Promise<void> {
    await this.writeJSONToFile(datas, `faileddata/data.json`);
  }


  async saveJsonToFile(data: any, filePath: string): Promise<any> {
    try {
      // Convert JSON object to string
      const jsonData = JSON.stringify(data, null, 2);  // Pretty print the JSON

      // Write JSON data to file, automatically replaces the file if it exists
      await this.writeFileAsync(filePath, jsonData, 'utf8');
      // console.log('JSON data has been saved successfully.');
      return { msg: 1, value: 'Data saved successfully.' };
    } catch (error) {
      this.logger.error('Error writing JSON to file:', error);
      // throw new Error('Failed to write JSON to file');
      return { msg: -1, value: 'Data saved failed.' + JSON.stringify(error) };
    }
  }

  async readJsonFromFile(filePath: string): Promise<any> {
    try {
      // Read file content
      const fileContent = await this.readFileAsync(filePath, 'utf8');

      // Parse JSON string to an object
      return JSON.parse(fileContent);
    } catch (error) {
      // console.error('Error reading JSON from file:', error);
      return null;
    }
  }

  findCurrentSessionId(sessions: any[]): string | null {
    const now = moment();
    let latestSession = null;
    let latestTime = null;
    // console.log('\n\r\n\r\n\r CHECKING')
    for (const session of sessions) {
      if (session.cStatus == 'R') {
        latestSession = session.nSesid;
        break;
      };
      /* if (session.cStatus != 'C') {
         // console.log('DT', session.dStartDt)
         const startTime = moment(session.dStartDt);
         // console.log(' START TM', startTime)
         // console.log(' CONDITION ', startTime.isBefore(now) && (!latestTime || startTime.isAfter(latestTime)))
         if (startTime.isBefore(now) && (!latestTime || startTime.isAfter(latestTime))) {
           latestTime = startTime;
           latestSession = session.nSesid;
         }
       }*/
    }
    return latestSession;
  }

  convertToProperDateFormat(dateString) {
    const regex = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})\s*(AM|PM)$/i;
    const match = dateString.match(regex);

    if (!match) {
      // throw new Error('Invalid date format');
      return ''
    }

    let [_, datePart, hours, minutes, meridian] = match;

    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);

    if (meridian.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridian.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${datePart}T${formattedHours}:${formattedMinutes}:00`;
  }
  getCurrentTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }




  ///////////////////////////////



  hexToRgb(hex) {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');

    // Parse the r, g, b values
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    console.log(`\n\r\n\r rgb(${r}, ${g}, ${b},0.5)`)
    return `rgb(${r}, ${g}, ${b},0.5)`;
  }

  findFirstMatchingLine(curPageData: any[], lineno: number): any {
    let idx = 0, txt_idx = 0;
    for (const i of curPageData) {
      idx++;
      for (const j of i.cordinates) {
        txt_idx++;
        if (lineno == j.l) {
          j.txt_idx = txt_idx;
          j.idx = idx;
          j.color = '#' + (i.color || 'e1dd0e') //this.hexToRgb(i.color || 'e1dd0e');
          return j;
        }
      }
    }
    return null;
  }

  fuzzySearchLevenshtein(search: string, destination: string): { startIndex: number; endIndex: number } {
    const substrings = [];
    for (let i = 0; i <= destination.length - search.length; i++) {
      for (let j = i + 2; j <= destination.length; j++) {
        substrings.push(destination.substring(i, j));
      }
    }

    const fuse = new Fuse(substrings, {
      includeScore: true,
      minMatchCharLength: 2,
      threshold: 0.6,
      keys: [],
    });

    const fuseResults = fuse.search(search);
    let potentialMatches = fuseResults.map(result => result.item);

    let closestMatch = null;
    let minDistance = Infinity;
    let startIndex = -1;
    let endIndex = -1;

    potentialMatches.forEach(substring => {
      const distance = levenshtein.get(search, substring);
      if (distance < minDistance) {
        minDistance = distance;
        closestMatch = substring;
        startIndex = destination.indexOf(substring);
        endIndex = startIndex + substring.length - 1;
      }
    });

    return { startIndex, endIndex };
  }

  findIndices(searchText: string, destinationText: string): { startIndex: number, endIndex: number } {
    // Normalize curly quotes to straight for both sides
    const normQuotes = (s: string) => s.replace(/[\u2018\u2019]/g, "'");
    const destOriginal = normQuotes(destinationText);
    const search = normQuotes(searchText).trim().replace(/'{2,}/g, "'");

    // --- Exact match allowing variable whitespace ---
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const whitespaceFlexible = escaped.replace(/\s+/g, "\\s+");
    const re = new RegExp(whitespaceFlexible, "i"); // i = case-insensitive
    const m = re.exec(destOriginal);
    if (m) {
      return { startIndex: m.index, endIndex: m.index + m[0].length };
    }

    // --- Fuzzy fallback with variable window width ---
    const dest = destOriginal.toLowerCase();
    const query = search.toLowerCase();

    let bestStart = -1, bestEnd = -1, minDistance = Infinity;

    // allow the window to be a bit shorter/longer than the query length
    const L = query.length;
    const slack = Math.max(2, Math.floor(L * 0.3)); // tune as needed

    const minW = Math.max(1, L - slack);
    const maxW = Math.min(dest.length, L + slack);

    for (let w = minW; w <= maxW; w++) {
      for (let i = 0; i + w <= dest.length; i++) {
        const sub = dest.substring(i, i + w);
        const d = levenshtein.get(query, sub);
        if (d < minDistance) {
          minDistance = d;
          bestStart = i;
          bestEnd = i + w;
        }
      }
    }

    return { startIndex: bestStart, endIndex: bestEnd };
  }

  /* findIndices(searchText: string, destinationText: string): { startIndex: number, endIndex: number } {
    const FgBlue = "\x1b[34m";
    const FgYellow = "\x1b[33m";

    // console.log(FgBlue,'searchText = ', searchText);
    // console.log(FgYellow,'destinationText = ', destinationText);
    searchText = searchText.trim().toLowerCase()?.replace(/'{2,}/g, "'");;
    destinationText = destinationText.toLowerCase();

    // Exact substring match first
    let exactIndex = destinationText.indexOf(searchText);
    if (exactIndex !== -1) {
      return { startIndex: exactIndex, endIndex: exactIndex + searchText.length };
    }

    // Fuzzy search fallback
    let minDistance = Infinity;
    let bestStart = -1;
    let bestEnd = -1;

    for (let i = 0; i <= destinationText.length - searchText.length; i++) {
      const sub = destinationText.substring(i, i + searchText.length);
      const distance = levenshtein.get(searchText, sub);

      if (distance < minDistance) {
        minDistance = distance;
        bestStart = i;
        bestEnd = i + searchText.length;
      }
    }
    console.log('bestStart - ',bestStart,bestEnd)
    return { startIndex: bestStart, endIndex: bestEnd };
  }*/

  findIndices_old(searchText, destinationText) {
    searchText = searchText.toLowerCase();
    destinationText = destinationText.toLowerCase();

    // console.log('searchText = ', searchText, 'destinationText = ', destinationText);

    let searchWords = searchText.split(' ');
    const destinationWords = destinationText.split(' ');
    if (destinationWords.length == 1) {
      searchWords = searchText.trim().toLowerCase().replace(/\s+/g, '');
      //   console.error('searchWords = ',searchWords,destinationText)
    }
    let matchedIndices = [];
    let searchIndices = [];
    let lastMatchedIndex = -1;

    // for (let i = 0; i < searchWords.length; i++) {
    //   let searchWord = searchWords[i].toLowerCase();
    //   for (let j = lastMatchedIndex + 1; j < destinationWords.length; j++) {
    //     let destinationWord = destinationWords[j].toLowerCase();
    //     if ((searchWord === destinationWord) || searchWord.replace(/[^a-zA-Z0-9\s]/g, '') === destinationWord.replace(/[^a-zA-Z0-9\s]/g, '')) {
    //       searchIndices.push(i);
    //       matchedIndices.push(j);
    //       lastMatchedIndex = j;
    //       break;  // Move to the next search word after finding the first match
    //     }
    //   }
    // }

    const attemptMatch = (searchWords, destinationWords) => {
      for (let i = 0; i < searchWords.length; i++) {
        let searchWord = searchWords[i].toLowerCase();
        if (searchWord.length == 0) {
          continue;
        }
        for (let j = lastMatchedIndex + 1; j < destinationWords.length; j++) {
          let destinationWord = destinationWords[j].toLowerCase();
          if ((searchWord === destinationWord) || searchWord.replace(/[^a-zA-Z0-9\s]/g, '') === destinationWord.replace(/[^a-zA-Z0-9\s]/g, '')) {
            searchIndices.push(i);
            matchedIndices.push(j);
            lastMatchedIndex = j;
            break;  // Move to the next search word after finding the first match
          }
        }
      }
    };
    // Initial match attempt
    attemptMatch(searchWords, destinationWords);

    // If no matches found, attempt with trimmed and lowercase transformation
    if (matchedIndices.length === 0) {
      searchText = searchText.trim().toLowerCase().replace(/\s+/g, '');
      destinationText = destinationText.trim().toLowerCase();
      searchWords = searchText.split(' ');
      const destinationWords = destinationText.split(' ');
      lastMatchedIndex = -1;
      searchIndices = [];
      matchedIndices = [];
      attemptMatch(searchWords, destinationWords);
    }


    let destination_prefix = [];
    let search_prefix = [];
    let search_suffix = [];
    let destination_suffix = [];

    if (searchIndices.length > 0 && searchIndices[0] !== 0) {
      destination_prefix = destinationWords.slice(0, matchedIndices[0]);
      search_prefix = searchWords.slice(0, searchIndices[0]);
    }
    if (searchIndices.length > 0 && searchIndices[searchIndices.length - 1] !== searchWords.length - 1) {
      destination_suffix = destinationWords.slice(matchedIndices[matchedIndices.length - 1] + 1, destinationWords.length);
      search_suffix = searchWords.slice(searchIndices[searchIndices.length - 1] + 1, searchWords.length);
    }

    let startIndex = -1;
    let endIndex = -1;
    let smallestDistance = Infinity;
    if (matchedIndices.length > 0) {
      // Adjust the start index for the prefix
      if (search_prefix.length > 0 && destination_prefix.length > 0) {
        const prefixText = search_prefix.join(' ');
        const prefixDEST = destination_prefix.join(' ');
        const prefixIndex = prefixDEST.lastIndexOf(prefixText);
        const distance = levenshtein.get(prefixText, prefixDEST);
        if (distance < smallestDistance) {
          startIndex = distance;
        }
      }

      // If no prefix adjustment, use the matched index start
      // if (startIndex === -1) {
      //     startIndex = destinationText.indexOf(destinationWords[matchedIndices[0]]);
      // }

      // If no prefix adjustment, use the matched index start
      if (startIndex === -1) {
        let txt = "";
        for (let i = 0; i < matchedIndices[0]; i++) {
          txt += destinationWords[i] + " ";
        }
        startIndex = txt.length;
        // Adjust to remove trailing space if necessary
        if (startIndex > 0 && destinationText[startIndex - 1] === ' ') {
          startIndex -= 1;
        }
        if (startIndex === -1) {
          startIndex = destinationText.indexOf(destinationWords[matchedIndices[0]]);
        }
        console.log('\n\n\n', startIndex, matchedIndices[0], destinationWords[matchedIndices[0]], txt, '\n\n\n');
      }

      // If no suffix adjustment, calculate endIndex based on the positions of matched words
      if (endIndex === -1) {
        endIndex = startIndex;
        for (let i = 0; i < matchedIndices.length; i++) {
          const word = destinationWords[matchedIndices[i]];
          endIndex = destinationText.indexOf(word, endIndex) + word.length;
        }

      }

      // Adjust the end index for the suffix
      if (search_suffix.length > 0 && destination_suffix.length > 0) {
        const suffixText = search_suffix.join(' ');
        const suffixDEST = destination_suffix.join(' ');
        const suffixIndex = suffixDEST.indexOf(suffixText, startIndex);
        const res = this.fuzzySearchLevenshtein(suffixText, suffixDEST);
        //  console.log('res = ',res)
        //  console.log('startIndex',startIndex,'endIndex',endIndex,' || suffixIndex', suffixIndex,'suffixDEST = ',suffixDEST,' || suffixText',suffixText,suffixText.length);
        if (res.endIndex !== -1) {
          endIndex = endIndex + 1;
          endIndex = endIndex + res.endIndex + 1;
        }
      }
    } else {
      let distance = levenshtein.get(searchText.toLowerCase(), destinationText.toLowerCase());
      startIndex = destinationText.toLowerCase().lastIndexOf(searchText.toLowerCase());
      if (startIndex !== -1) {
        endIndex = startIndex + searchText.length;
      } else {
        ({ startIndex, endIndex } = this.fuzzySearchLevenshtein(searchText, destinationText));
      }
    }

    return { startIndex, endIndex };
  }


  parseTimeFormate(formate) {
    if (formate) {
      const date = new Date();
      const frmArry = formate.split(':').map(Number); // Ensure all parts are numeric
      date.setHours(frmArry[0] || 0, frmArry[1] || 0, frmArry[2] || 0, frmArry[3] || 0);
      return date.getTime(); // Return timestamp for numeric comparison
    } else {
      return null;
    }
  }

  findAllMatchingLines(curPageData: any[], lineno: number): any[] {
    const matches: any[] = [];
    let idx = 0, txt_idx = 0;

    for (const i of curPageData) {
      idx++;
      for (const j of i.cordinates) {
        txt_idx++;
        if (lineno == j.l) {
          j.txt_idx = txt_idx;
          j.idx = idx;
          j.color = '#' + (i.color || 'e1dd0e');
          matches.push({
            ...j,
            startIndex: j.startIndex,
            endIndex: j.endIndex
          });
        }
      }
    }

    // Sort by startIndex to apply highlights in order
    return matches.sort((a, b) => a.startIndex - b.startIndex);
  }


  convertSortTimestamp(timestamp) {
    // console.log(timestamp);
    if (!timestamp) return '';
    // Convert the timestamp into frames (assuming 30 frames per second)
    const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
    return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
  }

  sortArray(array) {
    array.sort((a, b) => {
      const frameA: any = this.convertSortTimestamp(a?.[0] ?? 0);
      const frameB: any = this.convertSortTimestamp(b?.[0] ?? 0);
      if (frameA !== frameB) return frameA - frameB;

      const valA2 = a?.[6] ?? 0;
      const valB2 = b?.[6] ?? 0;
      if (valA2 !== valB2) return valA2 - valB2;
    });

    try {
      array.map((line, index) => line[2] = index);
    } catch (error) {

    }
  }

  emitEvent(topic: string, data: any) {
    // Emit an event
    this.eventEmitter.emit(topic, data);
  }
}
