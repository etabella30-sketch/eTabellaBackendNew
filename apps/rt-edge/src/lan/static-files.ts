/**
 * The FE `edge` bundle (spec §8.1, D23) served from `BoxConfig.paths.publicDir` (`/app/public` on the box), same
 * origin as the API so every call is same-origin (spec §8.3).
 *
 * - GET / HEAD only, never for the API paths (`/edge`, `/edge/…`, `/edge-config.json`, `/socket.io/…`, and the cloud
 *   service bases of cloud-paths.ts such as `/realtimeapi…`, `/coreapi…`): those fall through to their controllers,
 *   or to the contract's 404 (`/edge…`) / `use_cloud` 403 (cloud bases) from the exception filter.
 * - Strict path handling: the path is decoded once, then refused (404) when it holds a NUL, a backslash, an empty,
 *   `.` or `..` segment, or a dot-file segment; the file must resolve, after symlinks, inside the public directory.
 * - SPA fallback: an extension-less path that is no file (`/auth/callback`, `/rt/session/…`) gets `index.html`; a
 *   missing asset with an extension is a 404 (a stale chunk must fail loudly, not load HTML as JavaScript).
 * - Headers: exact MIME types, `X-Content-Type-Options: nosniff`, a weak ETag (`If-None-Match` → 304),
 *   `Cache-Control: no-cache` for HTML, `public, max-age=31536000, immutable` for content-hashed Angular outputs
 *   (`main-ABCD1234.js`), `public, max-age=3600` otherwise.
 * - gzip for text types over 1 KiB when the browser accepts it, compressed once per file version and cached in memory
 *   (bounded), so it stays cheap on the box.
 */
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream';
import { gzipSync } from 'zlib';

import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { BOX_CONFIG, BoxConfig, EdgePortError } from '../ports';
import { isCloudApiPath } from './cloud-paths';
import { sendError } from './edge-http';

export const STATIC_MIME_TYPES: Readonly<Record<string, string>> = Object.freeze({
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',
    '.wasm': 'application/wasm',
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
});

const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.map', '.webmanifest', '.txt', '.xml', '.svg']);
/** Angular's content-hashed output names: `main-ABCD1234.js`, `chunk-…`, `styles-…`, `media/x-ABCD1234.woff2`. */
const HASHED_NAME_RE = /-[A-Z0-9]{8}\.[a-z0-9]+$/;
const GZIP_MIN_BYTES = 1024;
const GZIP_MAX_FILE_BYTES = 8 * 1024 * 1024;
const GZIP_CACHE_MAX_BYTES = 64 * 1024 * 1024;

/** Paths the static server never answers (the box API, the config, the socket, the cloud service bases). */
export function isApiPath(pathname: string): boolean {
    return (
        pathname === '/edge-config.json' ||
        pathname === '/edge' ||
        pathname.startsWith('/edge/') ||
        isCloudApiPath(pathname) ||
        pathname.startsWith('/socket.io/') ||
        pathname === '/socket.io'
    );
}

export type StaticTarget =
    | { readonly kind: 'refused' }
    | { readonly kind: 'bad-request' }
    | { readonly kind: 'file'; readonly segments: readonly string[] }
    | { readonly kind: 'index' };

/**
 * Decode and check a request path. `refused`: never a file (traversal, dot-files, NUL, backslash); `bad-request`: the
 * escape sequences do not decode; `index`: `/`; `file`: the safe segments to look up.
 */
export function staticTarget(rawPathname: string): StaticTarget {
    let decoded: string;
    try {
        decoded = decodeURIComponent(rawPathname);
    } catch {
        return { kind: 'bad-request' };
    }
    if (!decoded.startsWith('/') || decoded.includes('\0') || decoded.includes('\\')) return { kind: 'refused' };
    if (decoded === '/' || decoded === '/index.html') return { kind: 'index' };
    const segments = decoded.slice(1).split('/');
    if (segments[segments.length - 1] === '') segments.pop(); // a trailing slash
    for (const segment of segments) {
        if (segment === '' || segment === '.' || segment === '..' || segment.startsWith('.') || segment.includes(':')) return { kind: 'refused' };
    }
    return segments.length ? { kind: 'file', segments } : { kind: 'index' };
}

/** `public, max-age=…` policy of one served file. */
export function cacheControlFor(fileName: string): string {
    if (fileName.endsWith('.html')) return 'no-cache';
    if (HASHED_NAME_RE.test(fileName)) return 'public, max-age=31536000, immutable';
    return 'public, max-age=3600';
}

function acceptsGzip(header: string | string[] | undefined): boolean {
    const text = Array.isArray(header) ? header.join(',') : header ?? '';
    return text
        .split(',')
        .map(part => part.trim().toLowerCase())
        .some(part => {
            const [coding, ...params] = part.split(';').map(p => p.trim());
            if (coding !== 'gzip' && coding !== '*') return false;
            const q = params.find(p => p.startsWith('q='));
            return !q || Number(q.slice(2)) > 0;
        });
}

@Injectable()
export class EdgeStaticFiles implements NestMiddleware {
    private readonly logger = new Logger('LanStatic');
    private readonly root: string;
    private realRoot: string | null = null;
    private readonly gzipCache = new Map<string, Buffer>();
    private gzipCacheBytes = 0;

    constructor(@Inject(BOX_CONFIG) config: BoxConfig) {
        this.root = path.resolve(config.paths.publicDir);
    }

    use(req: Request, res: Response, next: NextFunction): void {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        let pathname: string;
        try {
            pathname = new URL(req.originalUrl ?? req.url ?? '/', 'http://box.invalid').pathname;
        } catch {
            return next();
        }
        if (isApiPath(pathname)) return next();
        try {
            this.serve(req, res, next, pathname);
        } catch (err) {
            sendError(res, err, this.logger, `static ${pathname}`);
        }
    }

    private serve(req: Request, res: Response, next: NextFunction, pathname: string): void {
        const target = staticTarget(pathname);
        if (target.kind === 'bad-request') throw new EdgePortError('invalid_request', 'the path does not decode');
        if (target.kind === 'refused') return next();
        if (target.kind === 'file') {
            const file = this.resolveInside(target.segments);
            if (file) return this.sendFile(req, res, file);
            // A path without an extension is an app route: the SPA renders it.
            const last = target.segments[target.segments.length - 1];
            if (path.extname(last) !== '') return next();
        }
        const index = this.resolveInside(['index.html']);
        if (!index) return next();
        this.sendFile(req, res, index);
    }

    /** The regular file at `segments` inside the public directory (symlinks resolved), or null. */
    private resolveInside(segments: readonly string[]): string | null {
        const candidate = path.join(this.root, ...segments);
        if (candidate !== this.root && !candidate.startsWith(this.root + path.sep)) return null;
        let real: string;
        try {
            real = fs.realpathSync(candidate);
        } catch {
            return null;
        }
        const realRoot = this.rootReal();
        if (!realRoot || (real !== realRoot && !real.startsWith(realRoot + path.sep))) return null;
        try {
            return fs.statSync(real).isFile() ? real : null;
        } catch {
            return null;
        }
    }

    private rootReal(): string | null {
        if (this.realRoot) return this.realRoot;
        try {
            this.realRoot = fs.realpathSync(this.root);
        } catch {
            return null;
        }
        return this.realRoot;
    }

    private sendFile(req: Request, res: Response, file: string): void {
        const stat = fs.statSync(file);
        const ext = path.extname(file).toLowerCase();
        const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
        res.setHeader('Content-Type', STATIC_MIME_TYPES[ext] ?? 'application/octet-stream');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', cacheControlFor(path.basename(file)));
        res.setHeader('ETag', etag);
        res.setHeader('Last-Modified', new Date(stat.mtimeMs).toUTCString());
        if (ext === '.html') res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        const compressible = COMPRESSIBLE.has(ext);
        if (compressible) res.setHeader('Vary', 'Accept-Encoding');

        const ifNoneMatch = req.headers['if-none-match'];
        if (typeof ifNoneMatch === 'string' && ifNoneMatch.split(',').map(t => t.trim()).includes(etag)) {
            res.status(304).end();
            return;
        }

        if (compressible && stat.size >= GZIP_MIN_BYTES && stat.size <= GZIP_MAX_FILE_BYTES && acceptsGzip(req.headers['accept-encoding'])) {
            const gz = this.gzipped(file, stat);
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Length', String(gz.length));
            res.status(200);
            if (req.method === 'HEAD') res.end();
            else res.end(gz);
            return;
        }

        res.setHeader('Content-Length', String(stat.size));
        res.status(200);
        if (req.method === 'HEAD') {
            res.end();
            return;
        }
        // `pipeline`, not `pipe`: a client that goes away mid-transfer (a cancelled download, a closed tab, a device
        // leaving the room Wi-Fi) destroys the file stream and closes its descriptor. `pipe` only unpipes on the
        // response's 'close' and leaves the file open and paused for the life of the process. A read error ends the
        // response as before.
        pipeline(this.openFile(file), res, err => {
            if (err && (err as NodeJS.ErrnoException).code !== 'ERR_STREAM_PREMATURE_CLOSE') this.logger.error(`could not send ${file}: ${err.message}`);
        });
    }

    /** The bytes of one served file (overridden by the spec to watch the descriptor). */
    protected openFile(file: string): fs.ReadStream {
        return fs.createReadStream(file);
    }

    /** gzip of one file version, compressed once; the cache drops its oldest entries past its budget. */
    private gzipped(file: string, stat: fs.Stats): Buffer {
        const key = `${file}|${stat.size}|${stat.mtimeMs}`;
        const cached = this.gzipCache.get(key);
        if (cached) return cached;
        const gz = gzipSync(fs.readFileSync(file), { level: 6 });
        this.gzipCache.set(key, gz);
        this.gzipCacheBytes += gz.length;
        while (this.gzipCacheBytes > GZIP_CACHE_MAX_BYTES && this.gzipCache.size > 1) {
            const [oldestKey, oldest] = this.gzipCache.entries().next().value as [string, Buffer];
            this.gzipCache.delete(oldestKey);
            this.gzipCacheBytes -= oldest.length;
        }
        return gz;
    }
}
