import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { HTTPRequest, Page } from 'puppeteer';

/**
 * Network policy for the headless-Chrome renders of export HTML (transcript publish / export PDF,
 * the .docx pre-render, the word index). That HTML carries client-sent and stored text, and the
 * browser runs with --no-sandbox, so even if a builder ever misses an escape the page must not be
 * able to read other local files (file:// iframes) or reach the network (internal hosts, cloud
 * metadata). JavaScript is switched off and every request is aborted except:
 *  - the page document itself, in the main frame;
 *  - font / image / stylesheet files under `<page dir>/assets/` (the theme's ./assets/fonts/...);
 *  - the cover background `/assets/bglayer.png`, answered from the server's own copy and never
 *    fetched (the template points it at the request's Host);
 *  - data: URIs (Chrome never routes those through interception).
 */
export interface RenderPolicy {
  /** Absolute path of the HTML file being rendered: the only document allowed to load. */
  documentPath: string;
  /** Absolute directories whose font / image / stylesheet files may load over file://. */
  assetDirs: string[];
  /** URL path -> local file served in its place (http/https), or allowed as is (file://). */
  standIns: Record<string, string>;
}

export type RenderDecision =
  | { action: 'continue' }
  | { action: 'respond'; file: string; contentType: string }
  | { action: 'abort'; reason: string };

const ASSET_TYPES: Record<string, string> = {
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.css': 'text/css',
};

/** The policy for rendering the HTML file at `htmlPath` (relative paths resolve against the cwd). */
export function renderPolicyFor(htmlPath: string): RenderPolicy {
  const documentPath = path.resolve(htmlPath);
  return {
    documentPath,
    assetDirs: [path.join(path.dirname(documentPath), 'assets')],
    // Same base the export already reads impact icons from (path.resolve('assets', ...)).
    standIns: { '/assets/bglayer.png': path.resolve('assets', 'bglayer.png') },
  };
}

function filePathOf(url: string): string | null {
  try {
    return path.resolve(fileURLToPath(url));
  } catch {
    return null; // e.g. file://host/share on POSIX
  }
}

function samePath(a: string, b: string): boolean {
  return path.relative(a, b) === '';
}

function isInside(dir: string, target: string): boolean {
  const rel = path.relative(dir, target);
  return !!rel && rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel);
}

const abort = (reason: string): RenderDecision => ({ action: 'abort', reason });

/** Pure decision for one request of a locked-down render (exported for tests). */
export function decideRenderRequest(policy: RenderPolicy, url: string, isNavigation: boolean, isMainFrame: boolean): RenderDecision {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return abort('unparsable url');
  }

  if (isNavigation) {
    // Only the export page itself: no iframes, no meta-refresh / link navigations elsewhere.
    if (!isMainFrame || parsed.protocol !== 'file:') return abort('navigation');
    const target = filePathOf(url);
    return target && samePath(target, policy.documentPath) ? { action: 'continue' } : abort('navigation');
  }

  if (parsed.protocol === 'data:') return { action: 'continue' };

  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    const file = policy.standIns[parsed.pathname];
    if (file) return { action: 'respond', file, contentType: ASSET_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' };
    return abort('network');
  }

  if (parsed.protocol === 'file:') {
    const target = filePathOf(url);
    if (!target) return abort('file outside the export assets');
    if (Object.values(policy.standIns).some((f) => samePath(f, target))) return { action: 'continue' };
    if (ASSET_TYPES[path.extname(target).toLowerCase()] && policy.assetDirs.some((d) => isInside(d, target))) return { action: 'continue' };
    return abort('file outside the export assets');
  }

  return abort(`scheme ${parsed.protocol}`);
}

async function settle(request: HTTPRequest, policy: RenderPolicy, onDecision?: (url: string, decision: RenderDecision) => void): Promise<void> {
  if (request.isInterceptResolutionHandled()) return;
  const url = request.url();
  const frame = request.frame();
  let decision = decideRenderRequest(policy, url, request.isNavigationRequest(), !!frame && !frame.parentFrame());
  let body: Buffer | null = null;
  if (decision.action === 'respond') {
    try {
      body = await fs.promises.readFile(decision.file);
    } catch {
      decision = abort('stand-in missing');
    }
  }
  onDecision?.(url, decision);
  try {
    if (decision.action === 'continue') await request.continue();
    else if (decision.action === 'respond') await request.respond({ status: 200, contentType: decision.contentType, body });
    else await request.abort('blockedbyclient');
  } catch {
    // The page or browser closed first; nothing left to resolve.
  }
}

/**
 * Applies the policy to `page`; call before `page.goto`. `onDecision` sees every decision
 * (tests / diagnostics).
 */
export async function lockDownRenderPage(page: Page, policy: RenderPolicy, onDecision?: (url: string, decision: RenderDecision) => void): Promise<void> {
  await page.setJavaScriptEnabled(false);
  await page.setRequestInterception(true);
  page.on('request', (request) => { void settle(request, policy, onDecision); });
}
