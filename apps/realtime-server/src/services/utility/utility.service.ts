import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { Injectable } from '@nestjs/common';
import * as levenshtein from 'fast-levenshtein';
import { notificationReq } from '../../interfaces/notification.interface';
// import * as Fuse from 'fuse.js';
// import Fuse from 'fuse.js';
const Fuse = require('fuse.js');

@Injectable()
export class UtilityService {

  constructor(private readonly kafka: KafkaGlobalService) { }


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
  }
  
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

  // findIndices(searchText: string, destinationText: string): { startIndex: number; endIndex: number } {
  //   let searchWords:any = searchText.split(' ');
  //   const destinationWords = destinationText.split(' ');
  //   if (destinationWords.length == 1) {
  //     searchWords = searchText.trim().toLowerCase().replace(/\s+/g, '');
  //   }
  //   let matchedIndices = [];
  //   let searchIndices = [];
  //   let lastMatchedIndex = -1;

  //   const attemptMatch = (searchWords: string[], destinationWords: string[]) => {
  //     for (let i = 0; i < searchWords.length; i++) {
  //       let searchWord = searchWords[i].toLowerCase();
  //       for (let j = lastMatchedIndex + 1; j < destinationWords.length; j++) {
  //         let destinationWord = destinationWords[j].toLowerCase();
  //         if ((searchWord === destinationWord) || searchWord.replace(/[^a-zA-Z0-9\s]/g, '') === destinationWord.replace(/[^a-zA-Z0-9\s]/g, '')) {
  //           searchIndices.push(i);
  //           matchedIndices.push(j);
  //           lastMatchedIndex = j;
  //           break;
  //         }
  //       }
  //     }
  //   };

  //   attemptMatch(searchWords, destinationWords);

  //   if (matchedIndices.length === 0) {
  //     searchText = searchText.trim().toLowerCase().replace(/\s+/g, '');
  //     destinationText = destinationText.trim().toLowerCase();
  //     searchWords = searchText.split(' ');
  //     lastMatchedIndex = -1;
  //     searchIndices = [];
  //     matchedIndices = [];
  //     attemptMatch(searchWords, destinationWords);
  //   }

  //   let destination_prefix = [];
  //   let search_prefix = [];
  //   let search_suffix = [];
  //   let destination_suffix = [];

  //   if (searchIndices.length > 0 && searchIndices[0] !== 0) {
  //     destination_prefix = destinationWords.slice(0, matchedIndices[0]);
  //     search_prefix = searchWords.slice(0, searchIndices[0]);
  //   }
  //   if (searchIndices.length > 0 && searchIndices[searchIndices.length - 1] !== searchWords.length - 1) {
  //     destination_suffix = destinationWords.slice(matchedIndices[matchedIndices.length - 1] + 1, destinationWords.length);
  //     search_suffix = searchWords.slice(searchIndices[searchIndices.length - 1] + 1, searchWords.length);
  //   }

  //   let startIndex = -1;
  //   let endIndex = -1;
  //   let smallestDistance = Infinity;
  //   if (matchedIndices.length > 0) {
  //     if (search_prefix.length > 0 && destination_prefix.length > 0) {
  //       const prefixText = search_prefix.join(' ');
  //       const prefixDEST = destination_prefix.join(' ');
  //       const prefixIndex = prefixDEST.lastIndexOf(prefixText);
  //       const distance = levenshtein.get(prefixText, prefixDEST);
  //       if (distance < smallestDistance) {
  //         startIndex = distance;
  //       }
  //     }

  //     if (startIndex == -1) {
  //       startIndex = destinationText.indexOf(destinationWords[matchedIndices[0]]);
  //     }

  //     if (endIndex === -1) {
  //       endIndex = startIndex;
  //       for (let i = 0; i < matchedIndices.length; i++) {
  //         const word = destinationWords[matchedIndices[i]];
  //         endIndex = destinationText.indexOf(word, endIndex) + word.length;
  //       }
  //     }

  //     if (search_suffix.length > 0 && destination_suffix.length > 0) {
  //       const suffixText = search_suffix.join(' ');
  //       const suffixDEST = destination_suffix.join(' ');
  //       const suffixIndex = suffixDEST.indexOf(suffixText, startIndex);
  //       const res = this.fuzzySearchLevenshtein(suffixText, suffixDEST);
  //       if (res.endIndex !== -1) {
  //         endIndex = endIndex + 1;
  //         endIndex = endIndex + res.endIndex + 1;
  //       }
  //     }
  //   } else {
  //     let distance = levenshtein.get(searchText.toLowerCase(), destinationText.toLowerCase());
  //     startIndex = destinationText.toLowerCase().lastIndexOf(searchText.toLowerCase());
  //     if (startIndex !== -1) {
  //       endIndex = startIndex + searchText.length;
  //     } else {
  //       ({ startIndex, endIndex } = this.fuzzySearchLevenshtein(searchText, destinationText));
  //     }
  //   }

  //   return { startIndex, endIndex };
  // }

  convertSortTimestamp(timestamp) {
    // console.log(timestamp);
    if (!timestamp) return '';
    // Convert the timestamp into frames (assuming 30 frames per second)
    const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
    return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
  }

  sortArray(array) {
    // array.sort((a, b) => {
    //     return this.convertToFrame(a[0]) - this.convertToFrame(b[0]);
    //   });
    array.sort((a, b) => {
      const frameA: any = this.convertSortTimestamp(a?.[0] ?? 0);
      const frameB: any = this.convertSortTimestamp(b?.[0] ?? 0);
      if (frameA !== frameB) return frameA - frameB;

      // 2nd level: sort by a[4]
      // const valA4 = a?.[4] ?? 0;
      // const valB4 = b?.[4] ?? 0;
      // if (valA4 !== valB4) return valA4 - valB4;

      const valA2 = a?.[6] ?? 0;
      const valB2 = b?.[6] ?? 0;
      if (valA2 !== valB2) return valA2 - valB2;
    });
  }


  convertToFrame(timestamp) {
    try {
      // console.log(timestamp);
      if (!timestamp) return '';
      // Convert the timestamp into frames (assuming 30 frames per second)
      const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
      return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
    } catch (error) {
      return ''
    }
  }

  removeTimestampsInRange(timestamps: any, range: [any, any], refreshType: string): any {
    // try {
    //   const [startRange, endRange] = range.map(this.convertToFrame);

    //   return timestamps.filter(([timestamp]) => {
    //     const currentFrame = this.convertToFrame(timestamp);
    //     // return currentFrame < startRange || currentFrame > endRange;

    //     let isInRange = currentFrame >= startRange && currentFrame <= endRange;
    //     try {
    //       // console.log('RANGE TYPE',refreshType);
    //       if (refreshType == 'no-first-last') {
    //         isInRange = currentFrame > startRange && currentFrame < endRange; // TODO: REMOVE ONLY THE RANGE NOT FIRST AND LAST
    //       } else if (refreshType == 'no-first') {
    //         isInRange = currentFrame > startRange && currentFrame <= endRange; // TODO: REMOVE ONLY THE RANGE NOT FIRST 
    //       } else if (refreshType == 'no-last') {
    //         isInRange = currentFrame >= startRange && currentFrame < endRange; // TODO: REMOVE ONLY THE RANGE NO LAST
    //       }
    //     } catch (error) {
    //     }

    //     return !isInRange; //currentFrame < startRange || currentFrame > endRange;

    //   });
    // } catch (error) {
    //   console.error("Error in removeTimestampsInRange:", error);
    //   return timestamps; // Return original data in case of error
    // }

    const [startRange, endRange] = range.map(this.convertToFrame);


    const removedData = []; // Array to store removed elements
    const sInd = timestamps.findIndex(([timestamp], index) => {
      const currentFrame = this.convertToFrame(timestamp);
      return currentFrame >= startRange && currentFrame <= endRange;
    })

    const lInd = timestamps.findLastIndex(([timestamp], index) => {
      const currentFrame = this.convertToFrame(timestamp);
      return currentFrame >= startRange && currentFrame <= endRange;
    })

    const newData = timestamps.filter(([timestamp], index) => {
      const currentFrame = this.convertToFrame(timestamp);
      // const isInRange = currentFrame >= startRange && currentFrame <= endRange; // TODO: REMOVE EVERYTHING IN RANGE
      let isInRange = currentFrame >= startRange && currentFrame <= endRange;

      if (lInd != sInd && lInd == index && currentFrame == endRange) {
        isInRange = false
      }

      if (((lInd - sInd) + 1) > 2 && sInd == index && currentFrame == startRange) {
        try {
          const nextData = timestamps[index + 1]
          if (nextData) {
            const nextTimeRange = this.convertToFrame(nextData[0])
            if (nextTimeRange == startRange) {
              isInRange = false
            }
          }
        } catch (error) {

        }
      }

      if (isInRange) {
        try {
          removedData.push(timestamps[index]); // Assuming unicid is at index 6  //
        } catch (error) {
        }

      }

      // try {
      //   // console.log('RANGE TYPE',refreshType);
      //   if (refreshType == 'no-first-last') {
      //     isInRange = currentFrame > startRange && currentFrame < endRange; // TODO: REMOVE ONLY THE RANGE NOT FIRST AND LAST
      //   } else if (refreshType == 'no-first') {
      //     isInRange = currentFrame > startRange && currentFrame <= endRange; // TODO: REMOVE ONLY THE RANGE NOT FIRST 
      //   } else if (refreshType == 'no-last') {
      //     isInRange = currentFrame >= startRange && currentFrame < endRange; // TODO: REMOVE ONLY THE RANGE NO LAST
      //   }
      // } catch (error) {
      // }

      return !isInRange; //  && sInd != index && lInd != index; //currentFrame < startRange || currentFrame > endRange;
    });


    return { newData, removedData }; // Return the filtered array
  }

  async delay(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(1);
      }, ms);
    })
  }


  emit(data: any, topic?: string) {
    console.log('UtilityService emit', data, topic);
    this.kafka.sendMessage((topic ? topic : 'upload-messages'), data);
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

  sendNotification(notificationlist: any[], nMasterid) {
    try {
        notificationlist.forEach((jobData: any) => {
            const mdl: notificationReq = {
                nUserid: jobData.nUserid,
                cTitle: jobData.cTitle,
                cMsg: jobData.cMsg,
                cStatus: jobData.cStatus || 'P',
                cType: jobData.cType,
                nCaseid: jobData.nCaseid,
                cToken: jobData.cToken,
                nFSid: jobData.nFSid || null,
                nDocid: jobData.nDocid || null,
                nWebid: jobData.nWebid || null,
                nBundledetailid: jobData.nBundledetailid || null,
                nRefuserid: nMasterid || null
                
            }
            this.emit(mdl, 'notification');
        });
    } catch (error) {

    }


}
}
