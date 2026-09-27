/**
 * Content-Disposition value for a streamed download. The file name comes from the request (the
 * cFilename query of GET /download, the cPname inside the present-report params) or from stored
 * document names, so it must never be able to add a header or another parameter.
 *
 * - Control characters (CR, LF, NUL, C1, the Unicode line/paragraph separators) are dropped.
 * - The quoted `filename` is ASCII only, with `"` and `\` replaced, so it cannot close its quotes.
 * - A name with any non-ASCII character also gets an RFC 5987 `filename*` (percent-encoded UTF-8),
 *   which browsers prefer. Node refuses header text above U+00FF, so such names used to fail with
 *   a 500 before this.
 * - A plain ASCII name gives exactly `attachment; filename="<name>"`, as before.
 */
export function attachmentDisposition(name: unknown, fallback = 'download'): string {
    const cleaned = String(name ?? '')
        .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, '')
        // A lone surrogate cannot be percent-encoded (encodeURIComponent throws).
        .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, '_')
        .trim();
    const safe = cleaned || fallback;
    const ascii = safe.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
    if (ascii === safe) return `attachment; filename="${ascii}"`;
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeRfc5987(safe)}`;
}

function encodeRfc5987(value: string): string {
    return encodeURIComponent(value).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}
