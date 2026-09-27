import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { UPLOAD_CHUNK_GATE } from '../auth/upload-access';

/**
 * Path guards for every place the upload app turns request fields into file-system paths.
 *
 * multer runs inside FileInterceptor, before the controller, so the chunk and image routes are
 * checked in the multer callbacks themselves; the services and the Bull processors check again
 * before every later mkdir / write / append / unlink / rm that uses the same values.
 */

/** Where multer writes chunks: `<cwd>/assets/upload-chunks/<identifier>/<chunkNumber>`. */
export const UPLOAD_CHUNK_ROOT = './assets/upload-chunks';

/** An id-like path segment: a UUID, a legacy numeric id, 'null', 'undefined'. No dots or separators. */
const SAFE_SEGMENT_RE = /^[A-Za-z0-9_-]{1,64}$/;
const CHUNK_NUMBER_RE = /^\d{1,9}$/;
/** The random stored name clients generate: `file_<digits>` (uploads), `s_<nSesid>` (venue transcripts). */
const UPLOAD_NAME_RE = /^[A-Za-z0-9_-]{1,128}$/;
/**
 * The stored extension: the original name's last dot-part, upper-cased by the client ('PDF', 'DOCX').
 * Letters, digits, '_' and '-' only: it ends up on an s3cmd shell command line (filecopy.service).
 */
const FILE_TYPE_RE = /^[\p{L}\p{N}_-]{1,32}$/u;
/** `doc/case<nCaseid>/<name>.<type>`, the only shape a merged upload is written to. */
const DOC_PATH_RE = /^doc\/case([A-Za-z0-9_-]{1,64})\/([A-Za-z0-9_-]{1,128})\.([\p{L}\p{N}_-]{1,32})$/u;
const IMAGE_EXT_RE = /^\.[A-Za-z0-9]{1,10}$/;
/**
 * Image types each image route keeps (compared case-insensitively). The stored file is later served
 * from the site's own origin, so anything a browser would run as a page or script (.html, .svg, ...)
 * is refused before multer writes it.
 *  - profile: what ProfileService carries through to S3 (jpg/jpeg/png become webp; webp is kept).
 *    (Anything else never worked: the S3 copy looks for a `.webp` name that was never made.)
 *  - help centre and ticket images: the pickers offer png/jpg/jpeg (their `image/svg` is refused);
 *    gif and webp are plain raster images too. The file is copied to S3 unchanged.
 */
export const PROFILE_IMAGE_EXTENSIONS: readonly string[] = ['.jpg', '.jpeg', '.png', '.webp'];
export const HELP_IMAGE_EXTENSIONS: readonly string[] = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_RE = /[\u0000-\u001f\u007f]/;

type PathCallback = (error: Error | null, value: string) => void;

/**
 * Resolves `relative` against `baseDir` and returns the absolute result only when it stays
 * strictly inside `baseDir`; null for traversal, absolute paths, NUL bytes or empty input.
 * (Same rule as realtime-server's safe-path resolveInside.)
 */
export function resolveInside(baseDir: unknown, relative: unknown): string | null {
  if (typeof baseDir !== 'string' || typeof relative !== 'string') return null;
  if (!relative || relative.includes('\0') || baseDir.includes('\0')) return null;
  const base = path.resolve(baseDir);
  const target = path.resolve(base, relative);
  const rel = path.relative(base, target);
  if (!rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) return null;
  return target;
}

/**
 * A chunk identifier, used as one directory name under the chunk root. The legacy uploader sends
 * `${file.name}_${uuid}`, so real identifiers carry spaces, brackets, dots, '&', accents and so on;
 * what is refused is anything that could name another directory: '/', '\', '..', control
 * characters, or more than one file-name's worth (255 bytes) of text.
 */
export function isSafeChunkIdentifier(value: unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && Buffer.byteLength(value, 'utf8') <= 255
    && value !== '.'
    && !value.includes('..')
    && !value.includes('/')
    && !value.includes('\\')
    && !CONTROL_CHAR_RE.test(value);
}

/** A chunk index: decimal digits only (it becomes the chunk's file name). */
export function isChunkNumber(value: unknown): boolean {
  return (typeof value === 'string' || typeof value === 'number') && CHUNK_NUMBER_RE.test(String(value));
}

/** A required id segment (case id): a safe string, or a non-negative integer (venue clients). */
export function isSafeIdSegment(value: unknown): boolean {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0;
  return typeof value === 'string' && SAFE_SEGMENT_RE.test(value);
}

/** An optional id segment (nUPid): absent or empty is fine; anything present must be safe. */
export function isOptionalIdSegment(value: unknown): boolean {
  return value === undefined || value === null || value === '' || isSafeIdSegment(value);
}

export function isUploadName(value: unknown): value is string {
  return typeof value === 'string' && UPLOAD_NAME_RE.test(value);
}

export function isUploadFileType(value: unknown): value is string {
  return typeof value === 'string' && FILE_TYPE_RE.test(value);
}

/** The chunk directory of `identifier`, strictly inside the chunk root; null when unsafe. */
export function chunkDirFor(identifier: unknown): string | null {
  return isSafeChunkIdentifier(identifier) ? resolveInside(UPLOAD_CHUNK_ROOT, identifier) : null;
}

/** One chunk file, strictly inside its identifier's chunk directory; null when unsafe. */
export function chunkFileFor(identifier: unknown, chunkNumber: unknown): string | null {
  const dir = chunkDirFor(identifier);
  return dir && isChunkNumber(chunkNumber) ? resolveInside(dir, String(chunkNumber)) : null;
}

/**
 * The document file an upload is merged into, resolved under `<assetsRoot>/doc`. `cPath` must be
 * exactly `doc/case<nCaseid>/<name>.<type>` (what every client sends to /status and what
 * MergeProcessor builds); when `nCaseid` is given, the path must name that case.
 */
export function resolveUploadDocPath(assetsRoot: unknown, cPath: unknown, nCaseid?: unknown): string | null {
  if (typeof assetsRoot !== 'string' || typeof cPath !== 'string') return null;
  const match = DOC_PATH_RE.exec(cPath);
  if (!match) return null;
  if (nCaseid !== undefined && (!isSafeIdSegment(nCaseid) || match[1] !== String(nCaseid))) return null;
  return resolveInside(path.join(assetsRoot, 'doc'), cPath.slice('doc/'.length));
}

/**
 * The extension kept on an uploaded image's stored name: '' or '.' + up to 10 letters/digits. With
 * `allowed`, only those extensions (compared case-insensitively; '' is never in such a list).
 */
export function safeImageExtension(originalname: unknown, allowed?: readonly string[]): string | null {
  if (typeof originalname !== 'string') return null;
  const ext = path.extname(originalname);
  if (ext !== '' && !IMAGE_EXT_RE.test(ext)) return null;
  if (allowed && !allowed.includes(ext.toLowerCase())) return null;
  return ext;
}

const refused = (what: string) => new BadRequestException(`Invalid upload ${what}`);

/**
 * multer destination for the chunk routes: `<chunk root>/<identifier>`, checked before mkdir. The
 * request must also carry the chunk gate UploadCallerMiddleware sets (req[UPLOAD_CHUNK_GATE]), which
 * refuses an identifier the signed-in caller did not open with /status; it runs before mkdir too.
 */
export function chunkDestination(req: any, _file: unknown, cb: PathCallback): void {
  const body = req?.body ?? {};
  const dir = chunkDirFor(body.identifier);
  if (!dir || !isChunkNumber(body.chunkNumber) || !isOptionalIdSegment(body.nUPid)) {
    cb(refused('chunk'), '');
    return;
  }
  const gate = req?.[UPLOAD_CHUNK_GATE];
  if (typeof gate !== 'function') {
    cb(new ForbiddenException('Open this upload with /status first'), '');
    return;
  }
  Promise.resolve()
    .then(() => gate(body.identifier))
    .then(() => fs.promises.mkdir(dir, { recursive: true }))
    .then(() => cb(null, dir))
    .catch((err) => cb(err, ''));
}

/** multer file name for the chunk routes: the chunk number, re-checked against the chunk root. */
export function chunkFilename(req: any, _file: unknown, cb: PathCallback): void {
  const body = req?.body ?? {};
  if (!chunkFileFor(body.identifier, body.chunkNumber)) {
    cb(refused('chunk'), '');
    return;
  }
  cb(null, String(body.chunkNumber));
}

/**
 * multer destination for the image routes: `base()` (read from env per request, as before) plus,
 * when `withRootPath`, the form's `rootPath` as one plain segment ('users', 'contacts', 'help').
 * The file's extension must be one of `allowed` (PROFILE_ / HELP_IMAGE_EXTENSIONS).
 */
export function imageDestination(base: () => string, withRootPath: boolean, allowed: readonly string[]) {
  return (req: any, file: { originalname?: unknown }, cb: PathCallback): void => {
    const rootPath = req?.body?.rootPath;
    if (withRootPath && !isSafeRootPath(rootPath)) {
      cb(refused('rootPath'), '');
      return;
    }
    // Checked here too (imageFilename runs after this mkdir) so a refused file makes no folder.
    if (safeImageExtension(file?.originalname, allowed) === null) {
      cb(refused('file name'), '');
      return;
    }
    const destPath = base() + (withRootPath ? rootPath : '');
    fs.promises.mkdir(destPath, { recursive: true })
      .then(() => cb(null, destPath))
      .catch((err) => cb(err, destPath));
  };
}

/** multer file name for the image routes: `<prefix><timestamp><ext>`, the extension one of `allowed`. */
export function imageFilename(prefix: string, allowed: readonly string[]) {
  return (_req: any, file: { originalname?: unknown }, cb: PathCallback): void => {
    const ext = safeImageExtension(file?.originalname, allowed);
    if (ext === null) {
      cb(refused('file name'), '');
      return;
    }
    cb(null, `${prefix}${Date.now()}${ext}`);
  };
}

/** Service-side re-check of `rootPath` after multer (a later duplicate field turns it into an array). */
export function isSafeRootPath(value: unknown): value is string {
  return typeof value === 'string' && SAFE_SEGMENT_RE.test(value);
}
