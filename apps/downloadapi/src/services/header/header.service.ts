import { Injectable } from '@nestjs/common';

@Injectable()
export class HeaderService {
    /**
       * Pads a value to octal with proper null termination (matching Node.js script)
       */
    /*private pad(value: number, length: number): string {
        return value.toString(8).padStart(length - 1, '0') + '\0';
    }

    private checksumBlock(block: Buffer): number {
        let sum = 0;
        for (let i = 0; i < block.length; i++) {
            if (i >= 148 && i < 156) {
                sum += 32; // checksum field treated as space during calculation
            } else {
                sum += block[i];
            }
        }
        return sum;
    }*/

    /**
     * Builds the 512-byte TAR header for a single file entry.
     * @param filePath full path (within the archive) to store
     * @param size     size of the file in bytes
     * @param typeflag type flag (default '0' for regular file)
     */
    createHeader(filePath: string, size: number, typeflag: string = '0'): Buffer {
        const buf = Buffer.alloc(512, 0);
        const nameBuf = Buffer.from(filePath, 'utf8');

        // Handle long filenames (over 100 bytes) with prefix field
        if (nameBuf.length > 100) {
            let splitIndex = filePath.length - 100;
            const lastSlash = filePath.lastIndexOf('/', splitIndex);
            if (lastSlash !== -1) splitIndex = lastSlash;

            const prefix = filePath.substring(0, splitIndex);
            const name = filePath.substring(splitIndex + 1);

            if (prefix.length > 155 || name.length > 100) {
                // fallback: just truncate
                buf.write(filePath.substring(0, 100), 0, 100, 'utf8');
            } else {
                buf.write(name, 0, 100, 'utf8');
                buf.write(prefix, 345, 155, 'utf8');
            }
        } else {
            buf.write(filePath, 0, 100, 'utf8');
        }

        // Write fields using the same approach as Node.js script
        buf.write(this.pad(0o644, 8), 100);                                    // File mode
        buf.write(this.pad(0, 8), 108);                                        // UID
        buf.write(this.pad(0, 8), 116);                                        // GID
        buf.write(this.pad(size, 12), 124);                                    // File size
        buf.write(this.pad(Math.floor(Date.now() / 1000), 12), 136);          // MTime
        buf.write('        ', 148);                                            // Checksum placeholder (8 spaces)
        buf.write(typeflag, 156);                                              // Type flag
        buf.write('ustar\0', 257);                                             // UStar magic
        buf.write('00', 263);                                                  // UStar version

        // Calculate and write checksum
        const sum = this.checksumBlock(buf);
        buf.write(this.pad(sum, 8), 148);

        return buf;
    }

    /**
     * Creates PAX header for extended attributes (like long filenames)
     */
    createPaxHeader(fields: Record<string, string>): Buffer {
        let body = '';
        for (const [key, value] of Object.entries(fields)) {
            let entry = `${key}=${value}\n`;
            let len = entry.length + ('' + entry.length).length + 1;

            // Ensure the length calculation is correct
            while ((`${len} ${entry}`).length !== len) {
                len = (`${len} ${entry}`).length;
            }
            body += `${len} ${entry}`;
        }

        const bodyBuf = Buffer.from(body, 'utf8');
        const headerBuf = this.createHeader('././@PaxHeader', bodyBuf.length, 'x');
        const padding = Buffer.alloc((512 - (bodyBuf.length % 512)) % 512);

        return Buffer.concat([headerBuf, bodyBuf, padding]);
    }

    /**
     * Creates TAR header with PAX support for long filenames
     */
    createHeaderWithPaxSupport(filePath: string, size: number): Buffer[] {
        const filePathBytes = Buffer.byteLength(filePath, 'utf8');

        if (filePathBytes > 100) {
            // Use PAX header for long filenames
            const paxHeader = this.createPaxHeader({ path: filePath });
            const regularHeader = this.createHeader('./file', size); // Placeholder name
            return [paxHeader, regularHeader];
        } else {
            // Regular header is sufficient
            return [this.createHeader(filePath, size)];
        }
    }









    //////////////////////// LONG SUPPOERT


    private pad(value: number, length: number): string {
        return value.toString(8).padStart(length - 1, '0') + '\0';
    }

    private checksumBlock(block: Buffer): number {
        let sum = 0;
        for (let i = 0; i < block.length; i++) {
            // checksum field (148–155) treated as spaces
            sum += (i >= 148 && i < 156) ? 32 : block[i];
        }
        return sum;
    }

    /**
     * Core USTAR header builder (no split logic)
     */
    private buildUstarHeader(filename: string, size: number, typeflag = '0', prefix = ''): Buffer {
        const buf = Buffer.alloc(512, 0);
        buf.write(filename, 0, 100, 'utf8');
        buf.write(this.pad(0o644, 8), 100);
        buf.write(this.pad(0, 8), 108);
        buf.write(this.pad(0, 8), 116);
        buf.write(this.pad(size, 12), 124);
        buf.write(this.pad(Math.floor(Date.now() / 1000), 12), 136);
        buf.write('        ', 148);
        buf.write(typeflag, 156);
        buf.write('ustar\0', 257);
        buf.write('00', 263);
        if (prefix) buf.write(prefix, 345, 155, 'utf8');
        const sum = this.checksumBlock(buf);
        buf.write(this.pad(sum, 8), 148);
        return buf;
    }

    /**
     * GNU LongLink extension: write a special header + raw path bytes
     */
    private writeLongLinkHeader(fullPath: string): Buffer[] {
        const pathBuf = Buffer.from(fullPath + '\0', 'utf8');
        // Header with typeflag 'L' and name '././@LongLink'
        const longHdr = this.buildUstarHeader('././@LongLink', pathBuf.length, 'L');
        const padding = Buffer.alloc((512 - (pathBuf.length % 512)) % 512);
        return [longHdr, Buffer.concat([pathBuf, padding])];
    }

    /**
     * Try USTAR splitting; on failure, fall back to GNU LongLink + placeholder header.
     */
    createHeaderWithLongLink(filePath: string, size: number): Buffer[] {
        const nameBuf = Buffer.from(filePath, 'utf8');
        // If it fits, just a normal USTAR header:
        if (nameBuf.length <= 100) {
            return [this.buildUstarHeader(filePath, size)];
        }

        // Try splitting into prefix + name
        let prefix = '', name = filePath;
        let idx = filePath.length;
        while (idx > 0) {
            const slash = filePath.lastIndexOf('/', idx - 1);
            if (slash === -1) break;
            const candidatePrefix = filePath.slice(0, slash);
            const candidateName = filePath.slice(slash + 1);
            if (
                Buffer.byteLength(candidatePrefix, 'utf8') <= 155 &&
                Buffer.byteLength(candidateName, 'utf8') <= 100
            ) {
                prefix = candidatePrefix;
                name = candidateName;
                break;
            }
            idx = slash;
        }

        if (prefix) {
            // Splittable: write a single header
            return [this.buildUstarHeader(name, size, '0', prefix)];
        }

        // Otherwise: fallback to GNU LongLink + placeholder
        const longlinkBuffers = this.writeLongLinkHeader(filePath);
        // Create a short placeholder name (last 99 bytes)
        let placeholder = filePath.slice(-99);
        while (Buffer.byteLength(placeholder, 'utf8') > 99) {
            placeholder = placeholder.slice(1);
        }
        const placeholderHdr = this.buildUstarHeader(placeholder, size);
        return [...longlinkBuffers, placeholderHdr];
    }




}
/**
 * Calculate the number of digits in the length prefix for a PAX line.
 */
function lengthPrefixLength(line: string): number {
    // will be replaced by actual prefix length, so worst-case assume 1 extra digit
    return line.length.toString().length + 1;
}
