import { Injectable, Logger } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SavedataService } from '@app/global/utility/savedata/savedata.service';
import { StreamDataService } from '@app/global/utility/stream-data/stream-data.service';
import { DbService } from '@app/global/db/pg/db.service';
import { isAnonymousSocket, isServiceSocket, wsActingUserId, wsVerifiedUserId, wsWarnThrottled } from '@app/global/utility/ws-auth/ws-auth';
import { SessionService } from '../services/session/session.service';
import { IssueService } from '../services/issue/issue.service';
import { UsersService } from '../services/users/users.service';
import { getIssueAnnotationListBody } from '../interfaces/issue.interface';
import { SyncService } from '../services/sync/sync.service';
import { FeedDataService } from '../services/feed-data/feed-data.service';
import { AnnotTransferService } from '../services/annot-transfer/annot-transfer.service';
import { isUuid } from '../services/utility/safe-path';
import { RealtimeSessionAccess, parseRealtimeRoom, roomNameOf, sameId } from './realtime-socket-access';
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
  constructor(private readonly streamDataService: StreamDataService, public savedataService: SavedataService, public sessionService: SessionService,
    private user: UsersService, private readonly issueService: IssueService, private syncService: SyncService, private feedData: FeedDataService,
    private annotTransferService: AnnotTransferService, private readonly db: DbService) {
    this.access = new RealtimeSessionAccess(this.db);
    // setInterval(() => {
    //   try {

    //     this.server.to(`U366`).emit('realtime-events', { type: 'issue-annot-added', data: {D:'A'} });
    //   } catch (error) {

    //   }
    // }, 1000);


  }

  afterInit(server: Server) {
    this.syncService.server = this.server;
    // Same handoff pattern for AnnotTransferService — it emits 'realtime-events'
    // `{ type: 'SD' }` after a successful Python transfer so currently-connected
    // clients viewing the session auto-refresh their annotations.
    this.annotTransferService.server = this.server;
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

  @SubscribeMessage('TCP-DATA')
  async handleTcpData(@MessageBody() msg: any, @ConnectedSocket() client: Socket) {
    if (!this.allowIngest(client, 'TCP-DATA', msg?.date)) return;
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
    try {
      if (Array.isArray(msg?.d)) {
        for (const line of msg.d) {
          if (line && Array.isArray(line[1])) line[1] = this.feedData.sanitizeLineCodes(line[1]);
        }
      }
    } catch (error) {
    }

    this.feedData.feedReceive(msg);

    // this.savedataService.saveLiveFeedData(msg, this.sessions, 'data');

    // console.log('Sending data to room:', `S${msg.date}`);
    this.server.to(`S${msg.date}`).emit('message', msg);
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


    // Live session first: the live flusher also writes data/dt_<nSesid>/ DURING
    // a session, so folder-existence no longer implies the session is closed —
    // memory is the freshest source while the session is live.
    if (this.feedData.checkSessionExists(req.nSesid)) {
      this.logger.warn('SESSION EXISTS')
      this.feedData.streamSessionData(client.id, req, res[0], res[1]);
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
