const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escapes text for HTML element content or a quoted attribute value. The value is stringified
 * exactly as a template literal would (`${undefined}` is "undefined"), so text without & < > " '
 * comes out byte-identical to the unescaped interpolation it replaces.
 */
export function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** A character reference already in stored text (&nbsp; &amp; &#39; ...): decoded as text, never markup. */
const CHAR_REF = /&(?:#\d{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,31});/iy;
/** A start or end tag (attributes included). */
const TAG = /<(\/?)([a-z][a-z0-9]*)\b[^<>]*>/iy;
/** The formatting the legacy contenteditable note editors store (line breaks, blocks, mentions, bold...). */
const RICH_TAGS = new Set(['br', 'div', 'p', 'span', 'b', 'strong', 'i', 'em', 'u']);

/**
 * For note / source text written by the legacy contenteditable editors, which is stored as HTML
 * (`text<div>next line</div>`, `&nbsp;`, `<span class="alias_mention">`) and was always rendered as
 * HTML by the exports. The tags above come back without their attributes and balanced, character
 * references stay as they are; everything else is escaped exactly as escapeHtml does, so any other
 * tag (iframe, img, script, style, a...) prints as text. Text without & < > " ' is unchanged.
 */
export function escapeRichText(value: unknown): string {
  const text = String(value);
  const open: string[] = [];
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '<') {
      TAG.lastIndex = i;
      const tag = TAG.exec(text);
      const name = tag ? tag[2].toLowerCase() : '';
      if (tag && RICH_TAGS.has(name)) {
        i += tag[0].length;
        if (name === 'br') {
          out += '<br>';
        } else if (!tag[1]) {
          out += `<${name}>`;
          open.push(name);
        } else if (open.includes(name)) {
          // Close what this end tag closes; an end tag with nothing open is dropped, so a note can
          // never close the export's own containers.
          let top: string;
          do {
            top = open.pop();
            out += `</${top}>`;
          } while (top !== name);
        }
        continue;
      }
    } else if (c === '&') {
      CHAR_REF.lastIndex = i;
      const ref = CHAR_REF.exec(text);
      if (ref) {
        out += ref[0];
        i += ref[0].length;
        continue;
      }
    }
    out += HTML_ESCAPES[c] ?? c;
    i++;
  }
  while (open.length) out += `</${open.pop()}>`;
  return out;
}

/**
 * A colour for a style attribute (`#ffd400`, `ffd400`, `rgb(0, 0, 0)`, `yellow`) comes back unchanged.
 * Any other value becomes '' (the colour is dropped): `;` `:` `/` quotes or `\` could add a
 * declaration or an absolute url(), which wkhtmltopdf (no per-request blocking) would fetch.
 */
export function cssColor(value: unknown): string {
  const text = String(value);
  return /^[#\w\s(),.%+-]*$/.test(text) ? text : '';
}

/**
 * Keeps generated CSS inside its <style> element: `<` never appears in these declarations
 * legitimately, and replacing it with the CSS escape `\3c ` means no value can spell `</style>`.
 */
export function escapeStyleText(css: string): string {
  return String(css).replace(/</g, '\\3c ');
}
