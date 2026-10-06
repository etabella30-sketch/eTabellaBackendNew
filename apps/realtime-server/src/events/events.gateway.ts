import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SavedataService } from '@app/global/utility/savedata/savedata.service';
import { StreamDataService } from '@app/global/utility/stream-data/stream-data.service';
import { DbService } from '@app/global/db/pg/db.service';
import { isAnonymousSocket, isServiceSocket, wsActingUserId, wsVerifiedUserId, wsWarnThrottled } from '@app/global/utility/ws-auth/ws-auth';
import { BroadcastCut, broadcastCutFromRound, BroadcastPlan, planBroadcast, RoundPage, sessionRoom } from '@app/edge-sync';
import { SessionService } from '../services/session/session.service';
import { IssueService } from '../services/issue/issue.service';
import { UsersService } from '../services/users/users.service';
import { getIssueAnnotationListBody } from '../interfaces/issue.interface';
import { SyncService } from '../services/sync/sync.service';
import { FeedDataService } from '../services/feed-data/feed-data.service';
import { AnnotTransferService } from '../services/annot-transfer/annot-transfer.service';
import { MARK_EVENTS_SINK, MarkEventsServerSink } from '../services/marks/mark-events.port';
import { isUuid } from '../services/utility/safe-path';
import { RealtimeSessionAccess, parseRealtimeRoom, roomNameOf, sameId } from './realtime-socket-access';
import { cloudEdgeStatus, EDGE_VIEWER_PORT, EdgeVenueState, EdgeViewerAlert, EdgeViewerPort, EdgeViewerStatus, lastContactMs, venueOf } from './edge-viewer.port';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Socket identity (set at connection time by WsAuthIoAdapter, see main.ts):
 * - 'user'      verified JWT. Acts as the token user only; client-sent nUserid is ignored.
 * - 'service'   REALTIME_SERVICE_KEY (venue app, feed-replay). Ingest events only; joins no rooms.
 * - 'anonymous' no credential; exists only while WS_AUTH_ENFORCE is not 'true'. Keeps the old
 *               behaviour (client-sent ids) with a throttled warning, so old clients keep working.
 * A socket with no identity at all means the adapter is not installed; it is refused everywhere.
 */
type SocketKind = 'user' | 'service' | 'anonymous' | 'none';

const INGEST_EVENTS = ['TCP-DATA', 'annot-refresh-transfer', 'feed-refresh-data', 'lost-data'] as const;
type IngestEvent = typeof INGEST_EVENTS[number];

/**
 * Which lane writes a session's pages (RT edge spec section 7, RC-2 / D14):
 * - 'cut'  cloud-direct in cut mode (the Eclipse route is pinned apply:'cut', or cApply = 'C');
 * - 'edge' a venue box (cFeedSource = 'E').
 * Both are fed by ONE writer through applyPagesAtomic; a legacy socket feed (TCP-DATA,
 * feed-refresh-data, lost-data) for such a session would place lines by index under it, so it is
 * refused with an admin alert. null = not positively known to be either: legacy 'H', 'D' in legacy
 * mode, NULL provenance, no session row, a lookup that failed, or one not answered yet (the read runs
 * in the background; an event never waits for it). Those keep today's behaviour.
 */
export type IngestLane = 'cut' | 'edge';

/** Synchronous lookup the embedded Eclipse ingest registers (its cached routes). */
export type IngestLaneLookup = (nSesid: string) => IngestLane | null | undefined;

/** Legacy socket ingest events a cut-mode or venue session refuses. annot-refresh-transfer writes no page. */
const LANE_GUARDED: ReadonlySet<IngestEvent> = new Set<IngestEvent>(['TCP-DATA', 'feed-refresh-data', 'lost-data']);

/**
 * The provenance read (plain SQL, like SESSION_ACCESS_SQL). The two columns arrive with the
 * 2026-10-01 rt_edge migration; before it the read fails and every session stays "unknown".
 */
export const INGEST_PROVENANCE_SQL = 'SELECT "cFeedSource", "cApply" FROM "RSessionMaster" WHERE "nSesid" = $1 LIMIT 1';

/** How long a session's lane (or the fact that it has none) is used before it is read again. */
const LANE_CACHE_MS = 60_000;
/** A failed lookup is retried after this long; meanwhile the session keeps its last verdict (none: accepted). */
const LANE_RETRY_MS = 5_000;
const LANE_CACHE_MAX = 2_000;
/**
 * A provenance read that has not settled after this long frees its session's slot, so a new read may start;
 * whatever the abandoned read answers later is ignored. Nothing ever waits for a read (the event is decided
 * from what is already known), so this only bounds how long one stuck query keeps the session from being re-read.
 */
const LANE_READ_ABANDON_MS = 60_000;
/** Reads in flight across all sessions; past it an unknown session simply stays unknown (accepted) for now. */
const LANE_READS_MAX = 64;

/** How often the viewer banner's lag figures are refreshed for rooms that asked for a venue session. */
const EDGE_STATUS_REFRESH_MS = 5_000;
/** Venue sessions whose banner state is remembered (watched rooms; sealed or unknown ones are dropped). */
const EDGE_WATCH_MAX = 2_000;

/** A provenance read that failed because the 2026-10-01 rt_edge columns are not there yet (Postgres 42703). */
const MISSING_COLUMN = /column .* does not exist|42703/i;

/** Client-supplied value for a log line: JSON-quoted (no raw newlines) and length-capped. */
const show = (value: unknown): string => {
  let text: string;
  try {
    text = JSON.stringify(value) ?? String(value);
  } catch {
    text = '[unserialisable]';
  }
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
};

@Injectable()
@WebSocketGateway({
  cors: {
    origin: true, // Configure according to your security requirements
    credentials: true,
  }
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private sessions = new Map<string, { sessionDate: string; currentPageData: any[]; pageNumber: number }>();
  logger = new Logger('socket');
  private readonly access: RealtimeSessionAccess;
  /** The embedded Eclipse ingest's route view (apply:'cut', feedSource 'E'); set by that service. */
  private ingestLaneLookup: IngestLaneLookup | null = null;
  /** Session -> the last settled lane verdict of the provenance read, and until when it is fresh. */
  private readonly laneCache = new Map<string, { lane: IngestLane | null; until: number }>();
  /** Session -> its provenance read in flight (at most one per session; the token tells a current read from an abandoned one). */
  private readonly laneReads = new Map<string, symbol>();
  /** Venue sessions a viewer asked for, with the banner figures last sent to their room. */
  private readonly edgeWatch = new Map<string, string>();
  /** Per venue session: the venue value viewers were last told and since when (`since` of edge-status). */
  private readonly venueSince = new Map<string, { venue: EdgeVenueState; since: number }>();
  private edgeStatusTimer: NodeJS.Timeout | null = null;
  constructor(private readonly streamDataService: StreamDataService, public savedataService: SavedataService, public sessionService: SessionService,
    private user: UsersService, private readonly issueService: IssueService, private syncService: SyncService, private feedData: FeedDataService,
    private annotTransferService: AnnotTransferService, private readonly db: DbService,
    // Venue-box state for the viewer banner, the rev of venue snapshots and admin alerts. Absent
    // without the edge module: nothing below then differs from before.
    @Optional() @Inject(EDGE_VIEWER_PORT) private readonly edge?: EdgeViewerPort,
    // Live mark sync (user decision 2026-10-05): MarkEventsService, which sends marks-changed to U rooms on
    // this server (by token, see mark-events.port.ts). Absent without MarkEventsModule: no notices, nothing
    // else differs.
    @Optional() @Inject(MARK_EVENTS_SINK) private readonly markEvents?: MarkEventsServerSink) {
    this.access = new RealtimeSessionAccess(this.db);
    // setInterval(() => {
    //   try {

    //     this.server.to(`U366`).emit('realtime-events', { type: 'issue-annot-added', data: {D:'A'} });
    //   } catch (error) {

    //   }
    // }, 1000);


  }

  onModuleDestroy(): void {
    if (this.edgeStatusTimer) clearInterval(this.edgeStatusTimer);
    this.edgeStatusTimer = null;
    this.edgeWatch.clear();
    this.venueSince.clear();
  }

  afterInit(server: Server) {
    this.syncService.server = this.server;
    // Same handoff pattern for AnnotTransferService — it emits 'realtime-events'
    // `{ type: 'SD' }` after a successful Python transfer so currently-connected
    // clients viewing the session auto-refresh their annotations.
    this.annotTransferService.server = this.server;
    // And for MarkEventsService: `marks-changed` to the U<user> rooms of the people who can see a changed mark.
    if (this.markEvents) this.markEvents.server = this.server;
    console.log('WebSocket server initialized');
  }

  async handleConnection(client: any, ...args: any[]) {
    const kind = this.kindOf(client);
    const claimed = client?.handshake?.query?.nUserid;
    if (kind === 'none') {
      wsWarnThrottled(this.logger, 'conn:none', `[ws-auth] socket ${client?.id} has no identity (WsAuthIoAdapter not installed?); not joining any room`);
      return;
    }
    if (kind === 'service') {
      // Ingest emitters join nothing and are not user connections.
      this.logger.log(`Service socket connected : ${client.id}`);
      return;
    }
    if (kind === 'anonymous') {
      wsWarnThrottled(this.logger, 'conn:anonymous', `[ws-auth] transition mode: unauthenticated socket connected claiming nUserid=${show(claimed ?? null)}`);
    } else if (claimed && !sameId(claimed, wsVerifiedUserId(client))) {
      wsWarnThrottled(this.logger, `conn:mismatch:${wsVerifiedUserId(client)}`, `[ws-auth] socket for user ${wsVerifiedUserId(client)} sent query nUserid=${show(claimed)}; using the token user`);
    }
    // Verified id for a user socket; the client's claim only for an anonymous (transition) socket.
    const nUserid = wsActingUserId(client, claimed);
    this.user.setUser(nUserid, { socketId: client.id, rooms: new Set() })
    console.log(`User connected : ${nUserid}`)

    // Auto-join the user room here instead of waiting for the client's
    // explicit `join-room` emit. Defence-in-depth for the network-drop
    // recovery flow:
    //
    //   - Each Socket.IO reconnect creates a NEW socket id, so server-side
    //     `client.rooms` from the previous socket is gone.
    //   - The client's connect handler in core/services/socket/socket.service.ts
    //     re-emits `join-room` for U${nUserid} (and tracked S${nSesid} rooms)
    //     to put the new socket back in those rooms — that's the load-bearing
    //     fix.
    //   - Auto-joining U${nUserid} HERE closes the small race window between
    //     the socket being marked connected (server starts broadcasting) and
    //     the client's join-room emit landing. Any user-targeted event
    //     (notifications, upload-messages, realtime-events to U${nUserid})
    //     that fires in that window would be dropped without this auto-join.
    //
    // Session rooms (S${nSesid}) are intentionally NOT auto-joined here:
    // the server has no reliable cross-socket record of which session a user
    // was viewing, and joining a stale session would leak future broadcasts
    // to the wrong audience. The client-side rejoin from realtimeRooms is
    // the right authority for session-room membership.
    if (nUserid) {
      try {
        client.join(`U${nUserid}`);
      } catch (err) {
        // join() on a freshly-connected socket should never throw, but log
        // defensively in case socket.io ever changes that contract — we
        // don't want a join failure to drop the entire connection setup.
        console.error(`handleConnection: failed to auto-join U${nUserid}:`, err);
      }

      let urs = await this.user.getUserSocket(nUserid) //client.id
      if (urs) this.server.to(urs).emit('upload-messages', 'Welcome to the chat of socket');
    }
    // this.user.userConnections.set(nUserid, { socketId: client.id, rooms: new Set() });
  }

  async handleDisconnect(client: any) {
    try {
      // Never log the whole handshake query: ws-auth accepts `query.token` as a credential channel,
      // so dumping it would write JWTs into the server log on every disconnect.
      console.log('DISCONNECT', { socket: client?.id, kind: client?.data?.kind, nUserid: wsVerifiedUserId(client) ?? show(client?.handshake?.query?.nUserid ?? null) }, client.userroom);
      let entries: any[][] = await this.user.getEntries();
      try {
        this.streamDataService.stopDemoStream(client.id);
      } catch (error) {

      }

      try {
        if (client?.userroom && client?.userroom?.nSesid) {
          this.sessionService.joiningLog({ nSesid: client?.userroom?.nSesid, nUserid: client?.userroom?.nUserid, cStatus: 'L', cSource: 'L' });
        }
      } catch (error) {

      }
      const entry: any = Array.from(entries).find(([key, value]) => value.socketId === client.id);
      if (entry) {
        const [nUserid, userConnection] = entry;
        console.log(`User disconnected : ${nUserid}`)
        userConnection.rooms.forEach(room => client.leave(room));
        this.user.removeUser(nUserid);
      }
    } catch (error) {
      console.log(`disconnect  : ${JSON.stringify(error)}`)
    }
  }

  async getRoomCount(room: string): Promise<number> {
    // this.server.in(room) returns a BroadcastOperator
    const socketIds = await this.server.in(room).allSockets();
    // allSockets() returns a Set<string> of socket-IDs
    return socketIds.size;
  }

  // ---------------------------------------------------------------------------
  // Ingest (venue app / feed-replay over socket.io; the embedded Eclipse TCP
  // ingest calls the ingest* methods in-process). Browsers never send these.
  // ---------------------------------------------------------------------------

  // The lane check (laneRefuses) is synchronous and never waits for the database: the live feed of a
  // legacy session goes out exactly as before, in arrival order, whatever the provenance read is doing.
  @SubscribeMessage('TCP-DATA')
  async handleTcpData(@MessageBody() msg: any, @ConnectedSocket() client: Socket) {
    if (!this.allowIngest(client, 'TCP-DATA', msg?.date)) return;
    if (this.laneRefuses('TCP-DATA', msg.date)) return;
    return this.ingestTcpData(msg);
  }

  @SubscribeMessage('annot-refresh-transfer')
  async handleAnnotTransferData(@MessageBody() msg: any, @ConnectedSocket() client: Socket) {
    if (!this.allowIngest(client, 'annot-refresh-transfer', msg?.nSesid)) return;
    return this.ingestAnnotRefresh(msg);
  }

  @SubscribeMessage('feed-refresh-data')
  async feedRefreshData(@MessageBody() msg: any, @ConnectedSocket() client: Socket) {
    if (!this.allowIngest(client, 'feed-refresh-data', msg?.nSesid)) return;
    if (this.laneRefuses('feed-refresh-data', msg.nSesid)) return;
    return this.ingestFeedRefresh(msg);
  }

  @SubscribeMessage('lost-data')
  async fetchLostData(@MessageBody() msg: any, @ConnectedSocket() client: Socket) {
    if (!this.allowIngest(client, 'lost-data', msg?.nSesid)) return;
    // lost-data writes ./data/dt_<nSesid>/page_<page>.json: the page must be a plain page number.
    if (!/^\d{1,6}$/.test(String(msg?.page ?? ''))) {
      wsWarnThrottled(this.logger, 'ingest:lost-data:page', `[ws-auth] refused lost-data with page=${show(msg?.page)}`);
      return;
    }
    if (this.laneRefuses('lost-data', msg.nSesid)) return;
    return this.ingestLostData(msg);
  }

  /** In-process entry point (Eclipse TCP ingest) and the body of the TCP-DATA handler. */
  async ingestTcpData(msg: any) {
    this.logger.log(`TCP Data for session ${msg.date} : ${msg.p}`);
    // await this.saveData(msg);
    // await this.savedataService.saveData(msg, this.sessions, 'data', msg.p, msg.l);

    // const count = await this.getRoomCount(`S${msg.date}`);
    // this.logger.verbose(`Room S${msg.date} has ${count} clients connected`);

    // Scrub leaked page-frame bytes before both storage and the live
    // broadcast (an unfixed upstream parser may still emit them).
    // DET-5: the sender's lines are never rewritten in place. An in-process parser hands over its
    // own tuples (line[1] is its live character buffer), so the scrubbed codes go into a copy of
    // the line, in a copy of the message; what is stored and what is broadcast is that copy.
    msg = this.scrubbedCopy(msg);

    this.feedData.feedReceive(msg);

    // this.savedataService.saveLiveFeedData(msg, this.sessions, 'data');

    // console.log('Sending data to room:', `S${msg.date}`);
    this.server.to(`S${msg.date}`).emit('message', msg);
  }

  /** `msg` with each line's codes scrubbed, without touching `msg` or its lines; `msg` itself when the scrub fails. */
  private scrubbedCopy(msg: any): any {
    try {
      if (!Array.isArray(msg?.d)) return msg;
      const lines = msg.d.map((line: any) => {
        if (!line || !Array.isArray(line[1])) return line;
        const copy = line.slice();
        copy[1] = this.feedData.sanitizeLineCodes(line[1]);
        return copy;
      });
      return { ...msg, d: lines };
    } catch (error) {
      return msg;
    }
  }

  /** In-process entry point (Eclipse TCP ingest) and the body of the annot-refresh-transfer handler. */
  async ingestAnnotRefresh(msg: any) {
    this.logger.log(`TCP Data for session ${msg.date} : ${msg.p}`);
    this.server.to(`S${msg.nSesid}`).emit('annot-refresh-transfer', msg);
  }

  /** In-process entry point (Eclipse TCP ingest) and the body of the feed-refresh-data handler. */
  async ingestFeedRefresh(msg: any) {
    console.log('TCP Refresh Data:');
    // await this.savedataService.saveRefresh(msg, this.sessions)

    this.feedData.refreshReceive(msg);

    // console.log('Sending data to room:', `S${msg.nSesid}`);
    this.server.to(`S${msg.nSesid}`).emit('feed-refresh-data', msg);
  }

  /** Body of the lost-data handler (venue app replaying pages it could not deliver). */
  async ingestLostData(msg: any) {
    try {
      console.log('RECEIVE LOST DATA:', msg.page, new Date());
      await this.savedataService.saveLostData(msg.data, msg.page, msg.nSesid);
      let newData = { ...msg };
      newData.data = JSON.stringify(newData.data);
      console.log('Sending lost data to room:', `S${msg.nSesid}`);
      this.server.to(`S${msg.nSesid}`).emit('previous-data', newData);


    } catch (error) {
      console.log('Error fetching lost data', error);
    }
  }

  // ---------------------------------------------------------------------------
  // Viewer events
  // ---------------------------------------------------------------------------

  @SubscribeMessage('fetch-data')
  async fetchData(client: Socket, data: any) {
    console.log('\n\n\n\n\n\n Message from client 2:', data);
    const nUserid = await this.readerFor(client, data, 'fetch-data');
    if (nUserid === false) return;
    const req = { ...data, nUserid };
    const res = await this.issueService.getAnnotationOfPages({ nSessionid: req.nSesid, nUserid, nCaseid: req.nCaseid, cTranscript: 'N' });
    // console.log('Annotation:', res);
    // return;
    /**/
    this.logger.fatal('\n\n\nASKING FOR PREVIOUS PAGES', req);

    // A venue session: its banner state first (offline / catching up / live, lag, pending pages).
    this.sendEdgeStatusTo(client, req.nSesid);

    // Live session first: the live flusher also writes data/dt_<nSesid>/ DURING
    // a session, so folder-existence no longer implies the session is closed —
    // memory is the freshest source while the session is live.
    if (this.feedData.checkSessionExists(req.nSesid)) {
      this.logger.warn('SESSION EXISTS')
      // D20: the snapshot of a venue session is tagged with the rev of the last applied round,
      // read before the pages. A cut-mode session's rev is the feed store's own; a legacy
      // session has none and its payload is exactly today's.
      const rev = this.edge?.appliedRev(req.nSesid);
      if (rev === undefined) await this.feedData.streamSessionData(client.id, req, res[0], res[1]);
      else await this.feedData.streamSessionData(client.id, req, res[0], res[1], { rev });
    } else {
      const folderPath = path.join('data', `dt_${req.nSesid}`);
      const folderExists = fs.existsSync(folderPath);
      if (folderExists) {
        this.logger.warn('FOLDER EXISTS: FETCHING FROM /data');
        await this.streamDataService.streamData('data', client.id, req, response => {
          // callback logic if needed
        }, res[0], res[1]);
      } else {
        // Nothing received yet (a live session before its first line) — the
        // viewer simply waits for the feed. Not an error.
        this.logger.warn(`No transcript lines yet for session ${req.nSesid}`)
      }
    }
    // The last word on this fetch: every page there was has been sent (none, for
    // a session with no line yet). Without it a viewer cannot tell "nothing so
    // far" from "still on its way", and draws the transcript page by page.
    this.server.to(client.id).emit('previous-data-end', { nSesid: req.nSesid, tab: req.tab });

    // if (this.feedData.checkSessionExists(data.nSesid)) {
    //   this.logger.warn('SESSION EXISTS')
    //   this.feedData.streamSessionData(client.id, data, res[0], res[1]);
    // } else {
    //   this.logger.warn('FETCHING FROM /data')
    //   this.streamDataService.streamData('data', client.id, data, response => {
    //   }, res[0], res[1])
    // }

    // let dt = await this.sessionService.getSessiondata({ nSesid: data.nSesid, cUnicuserid: '' })
    // // this.server.emit('session-detail', dt);
    // console.log('EMIT SESSION DETAIOL')
    // this.server.to(client.id).emit('session-detail', dt);
  }

  @SubscribeMessage('fetch-missing-page')
  async fetchMissingPage(client: Socket, data: any) {
    console.log('\n\n\n\n\n\n Message from client 2:', data);
    const nUserid = await this.readerFor(client, data, 'fetch-missing-page');
    if (nUserid === false) return;
    const req = { ...data, nUserid };
    const res = await this.issueService.getAnnotationOfPages({ nSessionid: req.nSesid, nUserid, nCaseid: req.nCaseid, cTranscript: 'N' });
    // console.log('Annotation:', res);
    // return;
    this.streamDataService.streamDataByPage('data', client.id, req, response => {
    }, res[0], res[1], req.pages)
    let dt = await this.sessionService.getSessiondata({ nSesid: req.nSesid, cUnicuserid: '' })
    // this.server.emit('session-detail', dt);
    console.log('EMIT SESSION DETAIOL')
    this.server.to(client.id).emit('session-detail', dt);
  }


  @SubscribeMessage('fetch-demo-data')
  async streamDemoData(client: Socket, data: any) {
    console.log('\n\n\n\n\n\n Message from client:', data);

    this.streamDataService.streamDemoData(client.id, data)

  }


  @SubscribeMessage('stop-demo-data')
  async stopDemoData(client: Socket, data: any) {
    this.streamDataService.stopDemoStream(client.id);
  }


  @SubscribeMessage('join-room')
  async handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    console.log('Joining Room:', data);
    const kind = this.kindOf(client);
    if (kind === 'user') return this.joinRoomAsUser(data, client);
    if (kind !== 'anonymous') {
      wsWarnThrottled(this.logger, `join:${kind}`, `[ws-auth] refused join-room from a ${kind} socket ${client?.id}`);
      return;
    }

    // Transition mode: unauthenticated socket, today's behaviour.
    wsWarnThrottled(this.logger, 'join:anonymous', `[ws-auth] transition mode: unauthenticated join-room ${show(data?.room)}`);
    const nUserid = wsActingUserId(client, data?.nUserid);
    // Check if the user is already in the room

    const rooms = Array.from(client.rooms);
    try {
      if (data?.nSesid) {
        const nSesid = data.nSesid;//data.room.replace(/\D/g, '')
        if (nSesid) {
          client["userroom"] = { nSesid, nUserid };
          this.sessionService.joiningLog({ nSesid: nSesid, nUserid, cStatus: 'J', cSource: 'L' });
        }
      }
    } catch (error) {
    }
    if (!rooms.includes(data?.room)) {
      client.join(data?.room);
      this.logger.warn(`ROOM Join ${data?.room}`);
    } else {
      this.logger.warn(`User already in the room ${data?.room}`);
    }
  }

  /**
   * A verified user may join only their own U room (already joined at connect), a session room they
   * can see (RSessionDetail / case team / global admin), or a legacy demo room. Anything else is a
   * logged no-op. The join log is written for the token user, never the payload nUserid.
   */
  private async joinRoomAsUser(data: any, client: Socket): Promise<void> {
    const me = wsVerifiedUserId(client);
    const name = roomNameOf(data);
    const room = parseRealtimeRoom(name);
    if (!me || !name || !room) {
      wsWarnThrottled(this.logger, `join:user:shape:${me}`, `[ws-auth] user ${me} join-room ignored: unknown room ${show(data?.room ?? data)}`);
      return;
    }

    if (room.kind === 'user') {
      if (!sameId(room.userId, me)) {
        wsWarnThrottled(this.logger, `join:user:other:${me}`, `[ws-auth] user ${me} tried to join ${show(name)}; ignored`);
        return;
      }
      client.join(`U${me}`);
      return;
    }

    if (room.kind === 'demo') {
      if (!client.rooms.has(name)) client.join(name);
      return;
    }

    const claimedSesid = data?.nSesid;
    if (claimedSesid !== undefined && claimedSesid !== null && claimedSesid !== '' && !sameId(String(claimedSesid), room.nSesid)) {
      wsWarnThrottled(this.logger, `join:user:mismatch:${me}`, `[ws-auth] user ${me} join-room ${show(name)} with nSesid=${show(claimedSesid)}; ignored`);
      return;
    }
    if (!(await this.access.canSeeSession(client, room.nSesid))) {
      wsWarnThrottled(this.logger, `join:user:denied:${me}`, `[ws-auth] user ${me} may not join ${name}; ignored`);
      return;
    }

    if (claimedSesid) {
      client["userroom"] = { nSesid: room.nSesid, nUserid: me };
      try {
        this.sessionService.joiningLog({ nSesid: room.nSesid, nUserid: me, cStatus: 'J', cSource: 'L' });
      } catch (error) {
      }
    }
    if (!client.rooms.has(name)) {
      client.join(name);
      this.logger.warn(`ROOM Join ${name}`);
    } else {
      this.logger.warn(`User already in the room ${name}`);
    }
  }


  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@MessageBody() room: any, @ConnectedSocket() client: Socket): Promise<void> {
    console.log('LEAVE')
    const kind = this.kindOf(client);
    // Clients send { room, nSesid, nUserid }; leave the named room, not the payload object.
    const name = roomNameOf(room);
    const nSesid = room && typeof room === 'object' ? room.nSesid : undefined;
    const nUserid = wsActingUserId(client, room?.nUserid);
    if (kind === 'anonymous') {
      wsWarnThrottled(this.logger, 'leave:anonymous', `[ws-auth] transition mode: unauthenticated leave-room ${show(name)}`);
    }

    try {
      // A user socket only logs leaving a session room it is actually in.
      const logIt = kind === 'user' ? isUuid(nSesid) && client.rooms.has(`S${nSesid}`) : !!nSesid;
      if (logIt && nUserid) {
        this.sessionService.joiningLog({ nSesid: nSesid, nUserid, cStatus: 'L', cSource: 'L' });
      }
    } catch (error) {
    }

    if (!name) return;
    client.leave(name);
    this.logger.fatal(`ROOM Leave ${name}`);
  }

  @SubscribeMessage('issue-annot-added')
  async issueDetailAdded(@MessageBody() msg: any, @ConnectedSocket() client: Socket) {
    console.log('ISSUE Data:', msg, new Date());
    // The target is the acting user: the token user for a user socket (a user cannot reach another
    // user's room), the claimed id for an anonymous socket, the named user for a service socket.
    const kind = this.kindOf(client);
    let nUserid: string | null = null;
    if (kind === 'service') nUserid = isUuid(msg?.nUserid) ? msg.nUserid : null;
    else if (kind === 'user' || kind === 'anonymous') nUserid = wsActingUserId(client, msg?.nUserid);
    if (kind === 'anonymous') {
      wsWarnThrottled(this.logger, 'issue-annot-added:anonymous', '[ws-auth] transition mode: unauthenticated issue-annot-added');
    }
    if (!nUserid) {
      wsWarnThrottled(this.logger, `issue-annot-added:${kind}`, `[ws-auth] issue-annot-added from a ${kind} socket has no acting user; ignored`);
      return;
    }
    try {
      if (msg.nIDid) {
        const mdl: getIssueAnnotationListBody = { nIDid: msg.nIDid, nCaseid: msg.nCaseid, nUserid, nSessionid: msg.nSessionid } as getIssueAnnotationListBody;
        const list = await this.issueService.getAnnotationOfPages(mdl);
        if (list?.length) {
          if (list[0]?.length) {

            console.log('Sending issue data to room:', `U${nUserid}`, list[0][0]);
            this.server.to(`U${nUserid}`).emit('realtime-events', { type: 'issue-annot-added', data: list[0][0] });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }

  }

  // ---------------------------------------------------------------------------
  // Access helpers
  // ---------------------------------------------------------------------------

  private kindOf(client: any): SocketKind {
    const kind = client?.data?.kind;
    if (kind === 'service' && isServiceSocket(client)) return 'service';
    if (kind === 'anonymous' && isAnonymousSocket(client)) return 'anonymous';
    if (kind === 'user' && wsVerifiedUserId(client)) return 'user';
    return 'none';
  }

  /**
   * Ingest events are for 'service' sockets. An 'anonymous' socket (transition mode only) is still
   * accepted with a warning so venue installs without the key keep feeding; a browser 'user' socket
   * is refused (no frontend emits these). The session id names a data/dt_<id> folder, so it must be
   * a UUID for everyone.
   */
  private allowIngest(client: any, event: IngestEvent, nSesid: unknown): boolean {
    const kind = this.kindOf(client);
    if (kind !== 'service' && kind !== 'anonymous') {
      wsWarnThrottled(this.logger, `ingest:${event}:${kind}`, `[ws-auth] refused ${event} from a ${kind} socket ${client?.id}`);
      return false;
    }
    if (!isUuid(nSesid)) {
      wsWarnThrottled(this.logger, `ingest:${event}:sesid`, `[ws-auth] refused ${event} with session id ${show(nSesid)}`);
      return false;
    }
    if (kind === 'anonymous') {
      wsWarnThrottled(this.logger, `ingest:${event}:anonymous`, `[ws-auth] transition mode: accepted ${event} from an unauthenticated socket (send REALTIME_SERVICE_KEY)`);
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Legacy ingest vs the cut / venue lanes (RT edge spec section 7; RC-2, D14)
  // ---------------------------------------------------------------------------

  /** The embedded Eclipse ingest registers its route view here (apply:'cut' and 'E' routes). */
  setIngestLaneLookup(lookup: IngestLaneLookup | null): void {
    this.ingestLaneLookup = lookup;
  }

  /** Forget what was read about a session's lane (its feed path changed: split, "use direct cloud"). */
  forgetIngestLane(nSesid: string): void {
    const id = String(nSesid ?? '').toLowerCase();
    this.laneCache.delete(id);
    // A read already in flight answered for the old path: its answer is ignored.
    this.laneReads.delete(id);
  }

  /**
   * True when a legacy socket ingest event must be refused because the session is positively known
   * to be cut-mode or venue-fed; the refusal raises a throttled admin alert. Everything else
   * (legacy 'H', NULL provenance, no row, a failed lookup, a read not answered yet) answers false:
   * today's behaviour. Always synchronous: it never waits for the database, so the live feed is never
   * held up by the read and accepted events keep their arrival order.
   */
  private laneRefuses(event: IngestEvent, nSesid: string): boolean {
    if (!LANE_GUARDED.has(event)) return false;
    return this.refuseForLane(event, nSesid, this.laneOf(nSesid));
  }

  private refuseForLane(event: IngestEvent, nSesid: string, lane: IngestLane | null): boolean {
    if (!lane) return false;
    const what = lane === 'edge' ? 'a venue-box session' : 'a cut-mode session';
    const message = `Refused legacy ${event} for ${what} ${nSesid}: its pages are written by ${lane === 'edge' ? 'the venue box' : 'the cloud cut lane'} only`;
    wsWarnThrottled(this.logger, `ingest:${event}:lane:${nSesid}`, `[rt-edge] ${message}`);
    // Not only a log line: admins are told (deduplicated per kind and session by the alert sink).
    this.adminAlert({ kind: 'LEGACY_INGEST_REFUSED', tier: 'P2', nSesid, message, data: { event, lane } });
    return true;
  }

  /**
   * Raise an admin alert (spec section 12): through the edge module when it is loaded (logged, audited,
   * sent to admins), otherwise as a throttled error-level log line. Never throws. The embedded Eclipse
   * ingest raises its own alerts here too.
   */
  adminAlert(alert: EdgeViewerAlert): void {
    try {
      if (this.edge) {
        this.edge.alert(alert);
        return;
      }
      wsWarnThrottled({ warn: (m: string) => this.logger.error(m) }, `alert:${alert.kind}:${alert.nSesid ?? ''}`, `[rt-edge alert ${alert.tier}] ${alert.kind}: ${alert.message}`);
    } catch (error) {
      /* an alert must never break the feed */
    }
  }

  /**
   * The session's lane, answered at once: the ingest's routes first, else the last settled provenance
   * verdict (none yet: unknown, null). When that verdict is missing or stale, one read is started in
   * the background; it updates the verdict for the events that come after it. Only a settled positive
   * verdict ('E' or cut) ever refuses, and a known 'E' / cut session keeps its verdict while it is
   * re-read and when a re-read fails.
   */
  private laneOf(nSesid: string): IngestLane | null {
    const id = String(nSesid).toLowerCase();
    try {
      const routed = this.ingestLaneLookup?.(id);
      if (routed === 'cut' || routed === 'edge') return routed;
    } catch (error) {
    }
    const cached = this.laneCache.get(id);
    if (!cached || cached.until <= Date.now()) this.startLaneRead(id);
    return cached ? cached.lane : null;
  }

  /** One provenance read for `id` in the background, unless one is already in flight (or too many are). */
  private startLaneRead(id: string): void {
    if (this.laneReads.has(id) || this.laneReads.size >= LANE_READS_MAX) return;
    const token = Symbol(id);
    this.laneReads.set(id, token);
    const abandon = setTimeout(() => {
      if (this.laneReads.get(id) !== token) return;
      this.laneReads.delete(id);
      wsWarnThrottled(this.logger, 'ingest:lane:stuck', `[rt-edge] the provenance read of ${id} has not answered in ${LANE_READ_ABANDON_MS / 1000} s; it is asked again (legacy ingest is accepted while a session is unknown)`);
    }, LANE_READ_ABANDON_MS);
    abandon.unref?.();
    const settle = (lane: IngestLane | null | undefined, ttlMs: number) => {
      clearTimeout(abandon);
      // Forgotten (feed path changed) or abandoned meanwhile: the answer is about the old state.
      if (this.laneReads.get(id) !== token) return;
      this.laneReads.delete(id);
      // undefined = the read failed: the last settled verdict stands (a known venue / cut session stays refused).
      this.rememberLane(id, lane === undefined ? this.laneCache.get(id)?.lane ?? null : lane, ttlMs);
    };
    let reading: Promise<IngestLane | null>;
    try {
      reading = this.readLane(id);
    } catch (error) {
      reading = Promise.reject(error);
    }
    reading.then(
      lane => settle(lane, LANE_CACHE_MS),
      (error: any) => {
        // A database without the rt_edge columns yet (code deployed before its migration) has no venue or
        // cut session: asked again only once a minute, so legacy feeds do not cost a failing query every 5 s.
        const missing = MISSING_COLUMN.test(String(error?.message ?? error));
        if (missing) wsWarnThrottled(this.logger, 'ingest:lane:schema', `[rt-edge] provenance columns missing (migration 2026-10-01_rt_edge not applied?): legacy ingest accepted for every session`);
        settle(missing ? null : undefined, missing ? LANE_CACHE_MS : LANE_RETRY_MS);
      },
    );
  }

  private rememberLane(id: string, lane: IngestLane | null, ttlMs: number): void {
    if (this.laneCache.size >= LANE_CACHE_MAX && !this.laneCache.has(id)) {
      const now = Date.now();
      for (const [key, value] of this.laneCache) {
        if (value.until <= now && !value.lane) this.laneCache.delete(key);
      }
      // Still full: drop the oldest entries, never a positive verdict while an unknown one can go.
      if (this.laneCache.size >= LANE_CACHE_MAX) {
        for (const [key, value] of this.laneCache) {
          if (!value.lane) this.laneCache.delete(key);
          if (this.laneCache.size < LANE_CACHE_MAX) break;
        }
      }
      if (this.laneCache.size >= LANE_CACHE_MAX) this.laneCache.delete(this.laneCache.keys().next().value as string);
    }
    this.laneCache.set(id, { lane, until: Date.now() + ttlMs });
  }

  /** Rejects when the read failed (the caller treats that as unknown). */
  private async readLane(id: string): Promise<IngestLane | null> {
    const res: any = await this.db.rowQuery(INGEST_PROVENANCE_SQL, [id]);
    if (!res?.success) throw new Error(String(res?.error ?? 'provenance read failed'));
    const row = Array.isArray(res.data) ? res.data[0] : undefined;
    const source = typeof row?.cFeedSource === 'string' ? row.cFeedSource.trim() : null;
    const apply = typeof row?.cApply === 'string' ? row.cApply.trim() : null;
    if (source === 'E') return 'edge';
    if (apply === 'C') return 'cut';
    return null;
  }

  // ---------------------------------------------------------------------------
  // Rev-tagged broadcasts for cut-mode and venue sessions (RT edge spec section 5.8)
  // ---------------------------------------------------------------------------

  /**
   * Broadcasts one cut to room S<nSesid> as the shared plan says (libs/edge-sync broadcast-plan.ts),
   * every emit carrying the cut's rev: a small append as `message{i, d, date, l, p, rev}`; any
   * rewrite or larger append as untagged `previous-data{..., rev, totalLines}` per changed page,
   * newest first and paced; a shrink adds `realtime-events{type:'feed-shrink'}`; more than 400
   * changed pages become one `realtime-events{type:'feed-resync'}`. Legacy sessions never come
   * through here, so their payloads keep today's shape (no rev).
   *
   * Never throws: the round is already in the store when this runs. A cut the plan cannot read (a
   * changed line outside its pages) becomes one `feed-resync`, so viewers refetch what the store holds.
   */
  broadcastCut(nSesid: string, cut: BroadcastCut): BroadcastPlan {
    let plan: BroadcastPlan;
    try {
      plan = planBroadcast(cut);
    } catch (error) {
      const id = String(cut?.nSesid ?? nSesid);
      const rev = Number.isSafeInteger(cut?.rev) ? cut.rev : 0;
      this.logger.error(`broadcast plan of ${id} rev ${rev} failed (${error?.message ?? error}); viewers resync instead`);
      plan = {
        kind: 'resync',
        nSesid: id,
        rev,
        steps: [{ atMs: 0, emits: [{ room: sessionRoom(id), event: 'realtime-events', payload: { type: 'feed-resync', nSesid: id, rev } }] }],
        emitCount: 1,
        pages: [],
      };
    }
    for (const step of plan.steps) {
      const send = () => {
        for (const e of step.emits) {
          try {
            this.server.to(e.room).emit(e.event, e.payload);
          } catch (error) {
            this.logger.warn(`broadcast of ${e.event} to ${e.room} failed: ${error?.message ?? error}`);
          }
        }
      };
      if (step.atMs <= 0) {
        send();
      } else {
        const timer = setTimeout(send, step.atMs);
        timer.unref?.();
      }
    }
    return plan;
  }

  /**
   * Broadcasts a round the venue box uploaded: the changed lines are found by comparing the round's
   * pages with the pages they replaced, so read `before` BEFORE the round is applied.
   */
  broadcastRound(
    round: { nSesid: string; rev: number; totalLines: number; pages: readonly RoundPage[]; shrinkCause?: string },
    before: { totalLines: number; page: (p: number) => readonly unknown[] | null | undefined },
    nLines: number,
  ): BroadcastPlan {
    return this.broadcastCut(round.nSesid, broadcastCutFromRound(round, before, nLines));
  }

  // ---------------------------------------------------------------------------
  // edge-status: the viewer banner of a venue session (RT edge spec section 12)
  // ---------------------------------------------------------------------------

  /**
   * Sends a venue session's status to its room (the caller owns the hysteresis). The payload is the
   * status as given plus the cloud-viewer names (venue, since, lastSyncAt, lagLines, lagSec,
   * catConnected; spec section 9, CONTRACTS.md 9.1), so "Venue box offline since 10:42 — transcript
   * up to 10:41:58" can be drawn from it alone. The room is watched from then on, so the lag keeps
   * following while the box is silent.
   */
  emitEdgeStatus(nSesid: string, status: EdgeViewerStatus): void {
    try {
      const payload = this.cloudStatus(nSesid, status);
      this.server.to(sessionRoom(nSesid)).emit('edge-status', payload);
      const id = String(nSesid).toLowerCase();
      if (status.state === 'sealed') this.unwatch(id);
      else this.watch(id, this.statusKey(payload));
    } catch (error) {
      this.logger.warn(`edge-status of ${nSesid} not sent: ${error?.message ?? error}`);
    }
  }

  /**
   * The edge module announces a state change (online, offline, catching up, sealed): send the session's
   * full cloud-viewer status, read from the venue-box state, to its room. False when there is no venue
   * state for it (no edge provider, or not a venue session), so the caller can fall back to its own emit.
   */
  announceEdgeStatus(nSesid: string): boolean {
    if (!this.edge) return false;
    try {
      const status = this.edge.status(nSesid);
      if (!status) return false;
      this.emitEdgeStatus(nSesid, status);
      return true;
    } catch (error) {
      this.logger.warn(`edge-status of ${nSesid} not announced: ${error?.message ?? error}`);
      return false;
    }
  }

  /**
   * A viewer that opens a venue session gets its current status at once (state changes go to the
   * room only when they happen), and the room is watched from then on so lag and pending pages
   * follow the box's reports. A legacy session has no status: nothing is sent.
   */
  private sendEdgeStatusTo(client: { id: string }, nSesid: string): void {
    if (!this.edge) return;
    try {
      const status = this.edge.status(nSesid);
      if (!status) return;
      const payload = this.cloudStatus(nSesid, status);
      this.server.to(client.id).emit('edge-status', payload);
      const id = String(nSesid).toLowerCase();
      if (status.state === 'sealed') this.unwatch(id);
      else if (!this.edgeWatch.has(id)) this.watch(id, this.statusKey(payload));
    } catch (error) {
      this.logger.warn(`edge-status of ${nSesid} not sent: ${error?.message ?? error}`);
    }
  }

  /**
   * Re-sends a watched session's status to its room when the figures a viewer sees changed: the
   * state, the CAT link, the pending pages, or the lag by a 5 s step (while the box is silent its lag
   * grows, so the banner keeps counting). A sealed or unknown session stops being watched. It also
   * repairs a state change the edge module announced without the cloud-viewer names.
   */
  refreshEdgeStatuses(): void {
    if (!this.edge) return;
    for (const [nSesid, last] of [...this.edgeWatch]) {
      try {
        const status = this.edge.status(nSesid);
        if (!status) {
          this.unwatch(nSesid);
          continue;
        }
        const payload = this.cloudStatus(nSesid, status);
        const key = this.statusKey(payload);
        if (key !== last) this.server.to(sessionRoom(nSesid)).emit('edge-status', payload);
        if (status.state === 'sealed') this.unwatch(nSesid);
        else this.edgeWatch.set(nSesid, key);
      } catch (error) {
        this.logger.warn(`edge-status of ${nSesid} not refreshed: ${error?.message ?? error}`);
      }
    }
    if (!this.edgeWatch.size && this.edgeStatusTimer) {
      clearInterval(this.edgeStatusTimer);
      this.edgeStatusTimer = null;
    }
  }

  /** The status with the cloud-viewer names; `since` = when viewers were first told the current venue value. */
  private cloudStatus(nSesid: string, status: EdgeViewerStatus): EdgeViewerStatus {
    const id = String(nSesid).toLowerCase();
    const venue = venueOf(status.state);
    const known = this.venueSince.get(id);
    let since: number;
    if (known && known.venue === venue) {
      since = known.since;
    } else {
      // An outage began at the last contact, not when the hysteresis (15 s) let it show.
      const lastSeen = venue === 'offline' ? lastContactMs(status) : null;
      since = lastSeen !== null && lastSeen <= status.atMs && (!known || lastSeen >= known.since) ? lastSeen : status.atMs;
      if (this.venueSince.size >= EDGE_WATCH_MAX && !known) this.venueSince.clear();
      this.venueSince.set(id, { venue, since });
    }
    return cloudEdgeStatus(status, since);
  }

  private watch(id: string, key: string): void {
    if (!this.edge) return; // nothing could refresh it
    if (this.edgeWatch.size >= EDGE_WATCH_MAX && !this.edgeWatch.has(id)) {
      wsWarnThrottled(this.logger, 'edge-status:watch-full', `[rt-edge] ${EDGE_WATCH_MAX} venue sessions watched; ${id} not refreshed`);
      return;
    }
    this.edgeWatch.set(id, key);
    if (!this.edgeStatusTimer) {
      this.edgeStatusTimer = setInterval(() => this.refreshEdgeStatuses(), EDGE_STATUS_REFRESH_MS);
      this.edgeStatusTimer.unref?.();
    }
  }

  private unwatch(id: string): void {
    this.edgeWatch.delete(id);
    this.venueSince.delete(id);
  }

  private statusKey(status: EdgeViewerStatus): string {
    const lagStep = typeof status.lagSec === 'number' ? Math.floor(status.lagSec / 5) : '-';
    return `${status.state}|${status.catConnected === true ? 'C' : '-'}|${status.pendingPages ?? '-'}|${lagStep}`;
  }

  /**
   * fetch-data / fetch-missing-page: the user to read annotations as, or false to refuse.
   * User sockets act as the token user and must be able to see the session; anonymous sockets
   * (transition) keep the client-sent nUserid; service sockets do not read feeds. The session id
   * names a data/dt_<id> folder, so it must be a UUID for everyone.
   */
  private async readerFor(client: any, data: any, event: string): Promise<string | null | false> {
    const kind = this.kindOf(client);
    const nSesid = data?.nSesid;
    if (kind !== 'user' && kind !== 'anonymous') {
      wsWarnThrottled(this.logger, `${event}:${kind}`, `[ws-auth] refused ${event} from a ${kind} socket ${client?.id}`);
      return false;
    }
    if (!isUuid(nSesid)) {
      wsWarnThrottled(this.logger, `${event}:sesid`, `[ws-auth] refused ${event} with session id ${show(nSesid)}`);
      return false;
    }
    if (kind === 'anonymous') {
      wsWarnThrottled(this.logger, `${event}:anonymous`, `[ws-auth] transition mode: unauthenticated ${event}`);
      return wsActingUserId(client, data?.nUserid);
    }
    const me = wsVerifiedUserId(client);
    if (!(await this.access.canSeeSession(client, nSesid))) {
      wsWarnThrottled(this.logger, `${event}:denied:${me}`, `[ws-auth] user ${me} may not read session ${nSesid}; ${event} ignored`);
      return false;
    }
    return me;
  }

}
