import { Injectable } from '@nestjs/common';
const sanitize: (name: string) => string = require('sanitize-filename');
import * as path from 'path';

@Injectable()
export class TransformNameService {

    /**
      * Given a raw filename and an optional folder path (slash-delimited),
      * returns a sanitized destination path.
      *
      * @param filename  the raw filename (e.g. `" my?file.txt "`)
      * @param folder    optional folder string (e.g. `"  uploads / images / "`)
      */
    sanitizeDestination(filename: string, folder?: string): string {
        const fn = filename?.trim();
        if (!fn) {
            throw new Error('Filename must be provided');
        }

        // Break folder path into segments, sanitize each, drop empties
        const segments = folder
            ? folder
                .split('/')
                .map(seg => sanitize(seg.trim()))
                .filter(Boolean)
            : [];

        // Sanitize the actual filename
        const safeName = sanitize(fn);
        if (!safeName) {
            throw new Error('Filename could not be sanitized');
        }

        // Join with POSIX-style separators so it works cross-platform
        return segments.length
            ? path.posix.join(...segments, safeName)
            : safeName;
    }

}
