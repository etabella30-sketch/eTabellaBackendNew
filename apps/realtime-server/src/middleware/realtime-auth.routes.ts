import { RequestMethod } from '@nestjs/common';
import { RouteInfo } from '@nestjs/common/interfaces';

const get = (path: string): RouteInfo => ({ path, method: RequestMethod.GET });
const post = (path: string): RouteInfo => ({ path, method: RequestMethod.POST });
const del = (path: string): RouteInfo => ({ path, method: RequestMethod.DELETE });

/**
 * Session routes the venue (local) realtime app calls on the cloud server (fixmap §4c): service key
 * or a global admin's JWT. The whole SyncController is venue-only and is wired by class in
 * RealtimeServerModule.
 */
export const VENUE_SESSION_ROUTES: RouteInfo[] = [
  post('session/synssessions'),
  post('session/syncfeeddata'),
  post('session/sessionstart'),
  post('session/sessionend'),
  post('session/CreateUser'),
  post('session/insertConnetivityLog'),
  get('session/synctranscriptfile'),
];

/** Service key or global admin, never anonymous. */
export const SERVICE_OR_ADMIN_ROUTES: RouteInfo[] = [post('session/getallusers')];

/**
 * nUserid here is the user being looked at, not the caller, so it is NOT overwritten; the caller
 * must be an admin, a case admin of the case in scope, or that user. The rt/logs family is the log
 * viewer; its siblings without nUserid are gated the same way.
 */
export const TARGET_USER_ROUTES: RouteInfo[] = [
  get('session/rt/logs'),
  get('session/rt/logs/session'),
  get('session/rt/logs/session/users'),
  post('session/rt/logs/export'),
  get('session/getConnectivityLog'),
];

/**
 * Global-admin session writes (none of them is a venue route). Every non-GET SessionController
 * route must sit in exactly one group here or in the spec's reviewed browser list
 * (realtime-auth.routes.spec.ts), so a new write cannot ship with only the login check.
 */
export const SESSION_ADMIN_ROUTES: RouteInfo[] = [
  post('session/sessionbuilder'),
  post('session/sessiondelete'),
  post('session/serverbuilder'),
  post('session/assign'),
  post('session/setserver'),
  post('session/updatetranscriptstatus'),
  // Opens a live session in any nCaseid (same insert as sessionbuilder); caller: admin RT Production.
  post('session/eclipse'),
  // Marks any nSesid running and closes the user's other running sessions; no frontend caller.
  post('session/checkforrunningsession'),
  // Sets cStatus on any BundleDetail row; no frontend caller (legacy call is commented out).
  post('session/publishfile'),
  // upload_checkduplicacy inserts UploadMaster/BundleMaster folders into any case; no frontend
  // caller (both frontends use coreapi upload/checkduplicacy).
  post('session/checkduplicacy'),
  // Deletes any RTConnectivityLogs row by nLogid; no frontend caller.
  post('session/deleteConnetivityLog'),
];

/**
 * Global-admin uploads (the whole UploadController; same exhaustiveness rule, checked for every
 * method). They write client-named TXT files that only admin-only steps consume
 * (session/updatetranscriptstatus 'P', transcript/convert_txtfile_to_json), and multer overwrites an
 * existing file. Callers: new FE RT Production, legacy admin transcript import and Realtime Activity.
 * The gate is middleware, so it runs before multer writes anything.
 */
export const UPLOAD_ADMIN_ROUTES: RouteInfo[] = [
  post('upload'),
  post('upload/transcript-file'),
];

/** Global-admin transcript production writes. Same exhaustiveness rule as SESSION_ADMIN_ROUTES. */
export const TRANSCRIPT_ADMIN_ROUTES: RouteInfo[] = [
  post('transcript/transcript_builder'),
  post('transcript/theme_builder'),
  post('transcript/publish'),
  del('transcript/delete'),
  post('transcript/convert_txtfile_to_json'),
  // Renders a server-side file to .docx in exports/; callers: admin RT Production and the legacy
  // admin transcript table.
  post('transcript/html-file-to-doc-stream'),
  // Reads REALTIME_PATH + client cPath into a word-index PDF; same two admin-screen callers.
  post('transcript/generate-file-index'),
];
