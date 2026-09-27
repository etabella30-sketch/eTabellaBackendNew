import { SubscribeMessage, WebSocketGateway, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
// import { UserConnection } from '../interfaces/socket.interface';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../guards/ws.guard';
import { LogService } from '@app/global/utility/log/log.service';
import { UsersService } from '../services/users/users.service';
import { UploadService } from '../services/upload/upload.service';
import { IndexService } from '../services/index/index.service';
import { PaginationService } from '../services/pagination/pagination.service';
import { BatchfileService } from '../services/batchfile/batchfile.service';
import { ExportService } from '../services/export/export.service';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { PresentService } from '../services/present/present.service';
import { NotificationService } from '../services/notification/notification.service';
import { RealtimeService } from '../services/realtime/realtime.service';
import { isAnonymousSocket, isServiceSocket, wsActingUserId, wsVerifiedUserId, wsWarnThrottled } from '@app/global/utility/ws-auth/ws-auth';
import { SocketRoomAccess, cachedPresentRole, factIdOfRoom, factRoom, isUuid, presentIdOfRoom, presentRoom, roomNameOf, sameId, userIdOfRoom } from './socket-room-access';

type SocketKind = 'user' | 'anonymous' | 'service' | 'none';

/**
 * Identity: WsAuthIoAdapter (main.ts) authenticates every socket at connect and sets
 * socket.data = { kind, userId, isAdmin }. Handlers act as the verified user and ignore any user id
 * the client sends. 'anonymous' sockets exist only while WS_AUTH_ENFORCE is not 'true' and keep the
 * old behaviour with a throttled warning (WsJwtGuard still refuses their messages, as it always did,
 * since they carry no token). 'service' sockets have nothing to do here: socket-app's backend input
 * is Kafka.
 */
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  path: '/socketservice/socket.io'
})
@UseGuards(WsJwtGuard)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logApplication: string = 'socket';
  private readonly logger = new Logger('socket-app');
  private readonly access: SocketRoomAccess;

  constructor(private log: LogService, private user: UsersService, private upload: UploadService, private index: IndexService, private pagination: PaginationService,
    private batchfile: BatchfileService, private fileexport: ExportService, private db: DbService, private readonly redis: RedisDbService, private present: PresentService, private notification: NotificationService,
    private realtime: RealtimeService) {
    this.access = new SocketRoomAccess(db, (msg) => this.logger.error(`[ws-auth] ${msg}`));
  }

  afterInit(server: Server) {
    this.upload.setServer(server);
    this.index.setServer(server);
    this.user.setServer(server);
    this.pagination.setServer(server);
    this.batchfile.setServer(server);
    this.fileexport.setServer(server);
    this.present.setServer(server);
    this.notification.setServer(server);
    this.realtime.setServer(server);
  }

  private kindOf(client: any): SocketKind {
    if (wsVerifiedUserId(client)) return 'user';
    if (isServiceSocket(client)) return 'service';
    if (isAnonymousSocket(client)) return 'anonymous';
    return 'none';
  }

  /** Logs (throttled) and returns false for a socket that may not use `event` at all. */
  private refuseNonUser(client: any, kind: SocketKind, event: string): false {
    wsWarnThrottled(this.logger, `${event}:${kind}`, `[ws-auth] refused ${event} from a ${kind} socket ${client?.id}`);
    return false;
  }

  private warnAnonymous(event: string, detail: string): void {
    wsWarnThrottled(this.logger, `${event}:anonymous`, `[ws-auth] transition mode: unauthenticated ${event} ${detail}`);
  }


  async handleConnection(client: any, ...args: any[]) {
    const kind = this.kindOf(client);
    const claimed = client?.handshake?.query?.nUserid;
    if (kind === 'service') {
      this.log.info(`Service socket connected : ${client.id}`, this.logApplication);
      return;
    }
    if (kind === 'none') {
      wsWarnThrottled(this.logger, 'conn:none', `[ws-auth] socket ${client?.id} has no identity (WsAuthIoAdapter not installed?); not registering it`);
      return;
    }
    if (kind === 'anonymous') {
      this.warnAnonymous('connection', `claiming nUserid=${claimed ?? '(none)'}`);
    } else if (claimed && !sameId(String(claimed), wsVerifiedUserId(client))) {
      wsWarnThrottled(this.logger, `conn:mismatch:${wsVerifiedUserId(client)}`, `[ws-auth] socket for user ${wsVerifiedUserId(client)} sent query nUserid=${claimed}; using the token user`);
    }

    // The verified id for a user socket; the client's claim only for an anonymous (transition) socket.
    const nUserid = wsActingUserId(client, claimed);
    if (!nUserid) return;
    this.log.info(`User connected : ${nUserid}`, this.logApplication)
    this.user.addConnection(nUserid, client.id);

    // A verified user is put in their own room here; the explicit join-room the clients still send
    // is then an idempotent no-op.
    if (kind === 'user') client.join(`U${nUserid}`);

    if (isUuid(nUserid)) this.db.executeRef('user_sync_update', { nMasterid: nUserid });
  }

  async handleDisconnect(client: any) {
    console.log('DISCONNECTED', client.id);

    // Presentations this socket had joined: tell the room, and drop this socket's entry and presence.
    // (An entry that another socket of the same user took over since is not this socket's.)
    try {
      const presentations = this.user.findPresentationsAndUsersBySocketId(client.id);
      presentations.forEach(e => {
        this.server.to(`P${e.nPresentid}`).emit('presentation', { event: 'USER-LEFT', data: { nUserid: e.userid } });
        this.user.deleteUserFromPresentation(e.nPresentid, e.userid, client.id);
        this.redis.removeUser(e.userid, `P${e.nPresentid}`)?.catch?.(() => undefined);
      });
    } catch (error) {

    }

    try {
      const kind = this.kindOf(client);
      if (kind !== 'user' && kind !== 'anonymous') return;
      const nUserid = wsActingUserId(client, client?.handshake?.query?.nUserid);
      if (!nUserid || !this.user.hasConnection(nUserid, client.id)) return;
      this.log.info(`User disconnected : ${nUserid}`, this.logApplication)
      console.log('Disconnected', nUserid)
      // Only the user's LAST socket closing clears their presentation presence everywhere; another
      // tab / socket of the same user keeps working.
      if (this.user.removeConnection(nUserid, client.id)) {
        this.redis.removeUser(nUserid)?.catch?.(() => undefined);
      }
    } catch (error) {
      this.log.error(`disconnect  : ${JSON.stringify(error)}`, this.logApplication)
    }
  }


  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket, callback: Function): void {
    this.log.info(`Message received : ${JSON.stringify(data)}`, this.logApplication)
    client.emit('message', data, () => {
      callback('Message processed');
    });
  }


  /**
   * present-position / -compare / -compare-data / -change-tab drive every viewer's screen. Both
   * frontends send them only from the presentation's host (presentDetail.isHost), so a verified user
   * must be the host; the presentation id is normalised to the room form.
   */
  private async hostPresentPayload(data: any, client: Socket, event: string): Promise<any | null> {
    const kind = this.kindOf(client);
    if (kind === 'anonymous') {
      this.warnAnonymous(event, `for presentation ${JSON.stringify(data?.nPresentid)}`);
      return data;
    }
    if (kind !== 'user') return this.refuseNonUser(client, kind, event) || null;
    const me = wsVerifiedUserId(client);
    if (!isUuid(data?.nPresentid) || (await this.access.presentRole(client, data.nPresentid)) !== 'host') {
      wsWarnThrottled(this.logger, `${event}:denied:${me}`, `[ws-auth] user ${me} is not the host of presentation ${JSON.stringify(data?.nPresentid)}; ${event} ignored`);
      return null;
    }
    return { ...data, nPresentid: data.nPresentid.toLowerCase() };
  }

  @SubscribeMessage('present-position')
  async handlePresentPositionMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    // console.log('present-position', data);
    const payload = await this.hostPresentPayload(data, client, 'present-position');
    if (payload) this.present.savePosition(payload);
  }



  @SubscribeMessage('present-compare')
  async handlePresentCompareMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    // console.log('present-compare', data);
    const payload = await this.hostPresentPayload(data, client, 'present-compare');
    if (payload) this.present.saveCompare(payload);
  }



  @SubscribeMessage('present-compare-data')
  async handlePresentCompareDataMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    // console.log('present-compare-data', data);
    const payload = await this.hostPresentPayload(data, client, 'present-compare-data');
    if (payload) this.present.saveCompareData(payload);
  }

  @SubscribeMessage('present-change-tab')
  async handlePresentDocChangeMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    // console.log('present-change-tab', data);
    const payload = await this.hostPresentPayload(data, client, 'present-change-tab');
    if (payload) this.present.saveCurrentTab(payload);
  }


  /**
   * The only room either frontend joins through join-room on this server is the user's own
   * `U<nUserid>` (legacy SocketService.connect, new OutputsSocketService / RtProductionSocketService).
   * Presentation and fact-comment rooms have their own events. A verified user may join only their
   * own U room (already joined at connect); anything else is a logged no-op.
   */
  @SubscribeMessage('join-room')
  async handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    const kind = this.kindOf(client);
    if (kind === 'user') {
      const me = wsVerifiedUserId(client);
      const name = roomNameOf(data);
      if (!sameId(userIdOfRoom(name), me)) {
        wsWarnThrottled(this.logger, `join-room:denied:${me}`, `[ws-auth] user ${me} may not join ${JSON.stringify(name)}; ignored`);
        return;
      }
      client.join(`U${me}`);
      // No 'webrtc' join-viewer broadcast: it sent every joining user's id to every socket, and no
      // client handles that event (legacy screen-share/viewer only act on the relayed web-rtc events).
      this.log.info(`Client ${me} joined room U${me}`, this.logApplication)
      return;
    }
    if (kind !== 'anonymous') {
      this.refuseNonUser(client, kind, 'join-room');
      return;
    }

    // Transition mode: unauthenticated socket, today's behaviour.
    this.warnAnonymous('join-room', JSON.stringify(data?.room));
    const nUserid = wsActingUserId(client, client.handshake.query.nUserid);
    if (nUserid && this.user.hasConnection(nUserid, client.id)) {
      client.join(data.room);
      console.log('ROOM Join', data.room)
      this.log.info(`Client ${nUserid} joined room ${data.room}`, this.logApplication)
    }
  }



  /** Takes a user out of the presentation room: the presentation's host only. */
  @SubscribeMessage('present-pause-user')
  async handlePauseUser(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    try {
      const kind = this.kindOf(client);
      if (kind === 'anonymous') {
        this.warnAnonymous('present-pause-user', `for presentation ${JSON.stringify(data?.nPresentid)}`);
      } else if (kind !== 'user') {
        this.refuseNonUser(client, kind, 'present-pause-user');
        return;
      } else {
        const me = wsVerifiedUserId(client);
        if (!isUuid(data?.nPresentid) || !isUuid(data?.nUserid) || (await this.access.presentRole(client, data.nPresentid)) !== 'host') {
          wsWarnThrottled(this.logger, `present-pause-user:denied:${me}`, `[ws-auth] user ${me} is not the host of presentation ${JSON.stringify(data?.nPresentid)}; present-pause-user ignored`);
          return;
        }
      }
      // console.log('EVENT FOR REMOVE USER FROM PRESENTATION')
      const nPresentid = kind === 'user' ? String(data.nPresentid).toLowerCase() : data.nPresentid;
      const socketid = this.user.findSocketIdByUserIdAndPresentation(nPresentid, data.nUserid);
      if (kind === 'user') {
        // Every socket of the paused user leaves, not only the one that joined last (another tab of theirs
        // may be in the room too), and must re-check membership (PMUser.cStatus is now 'I') on its next join.
        const ids = new Set<string>(this.user.getSocketIds(data.nUserid));
        if (socketid) ids.add(socketid);
        for (const id of ids) {
          const paused = this.server.sockets.sockets.get(id);
          paused?.leave(presentRoom(nPresentid));
          this.access.forgetPresentMember(paused as any, nPresentid);
        }
        return;
      }
      if (socketid) {
        // console.log('Removing user', socketid, data.nPresentid)
        this.server.sockets.sockets.get(socketid)?.leave(`P${nPresentid}`);
      }

    } catch (error) {
      console.error(error);
    }

  }

  /**
   * Presentation room `P<nPresentid>`: the host (PresentationMaster.nCreateid) or a member
   * (present."PMUser"). Presence and USER-JOINED carry the verified user, never the payload's nUserid.
   */
  @SubscribeMessage('join-present-room')
  async handlePresentJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    try {
      const kind = this.kindOf(client);
      if (kind === 'user') {
        // web-rtc from this socket waits for the join, so a viewer's first signalling message is not
        // dropped for arriving while the membership lookup is still running.
        const pending = this.joinPresentationAsUser(data, client);
        client.data.presentJoin = pending;
        await pending;
        return;
      }
      if (kind !== 'anonymous') {
        this.refuseNonUser(client, kind, 'join-present-room');
        return;
      }

      // Transition mode: unauthenticated socket, today's behaviour.
      this.warnAnonymous('join-present-room', JSON.stringify(data?.room));
      const nUserid = wsActingUserId(client, client.handshake.query.nUserid);
      const nPresentid = data.nPresentid;
      await this.redis.addUser(data.room, nUserid, client.id);

      this.server.to(data.room).emit('presentation', { event: 'USER-JOINED', data: { nUserid: nUserid } });

      client.join(data.room);
      console.log('PRESENT ROOM Join', data.room, data)
      this.user.addUserToPresentation(nPresentid, nUserid, client.id);

      this.log.info(`Client ${nUserid} joined room ${data.room}`, this.logApplication);
    } catch (error) {
      console.log(error);
    }


  }

  private async joinPresentationAsUser(data: any, client: Socket): Promise<void> {
    const me = wsVerifiedUserId(client);
    const fromRoom = presentIdOfRoom(roomNameOf(data));
    const nPresentid = isUuid(data?.nPresentid) ? data.nPresentid.toLowerCase() : fromRoom;
    if (!nPresentid || (fromRoom && fromRoom !== nPresentid)) {
      wsWarnThrottled(this.logger, `join-present-room:shape:${me}`, `[ws-auth] user ${me} join-present-room ignored: room ${JSON.stringify(data?.room)} / nPresentid ${JSON.stringify(data?.nPresentid)}`);
      return;
    }
    if (!(await this.access.presentRole(client, nPresentid))) {
      wsWarnThrottled(this.logger, `join-present-room:denied:${me}:${nPresentid}`, `[ws-auth] user ${me} is neither host nor member of presentation ${nPresentid}; ignored`);
      return;
    }
    const room = presentRoom(nPresentid);
    await this.redis.addUser(room, me, client.id);

    this.server.to(room).emit('presentation', { event: 'USER-JOINED', data: { nUserid: me } });

    client.join(room);
    console.log('PRESENT ROOM Join', room)
    this.user.addUserToPresentation(nPresentid, me, client.id);

    this.log.info(`Client ${me} joined room ${room}`, this.logApplication);
  }



  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@MessageBody() room: any, @ConnectedSocket() client: Socket): Promise<void> {
    const kind = this.kindOf(client);
    if (kind === 'user') {
      // Leaving only ever removes this socket; a presentation room also drops this user's presence there.
      const me = wsVerifiedUserId(client);
      const name = roomNameOf(room);
      if (!name) return;
      const nPresentid = presentIdOfRoom(name);
      const target = nPresentid ? presentRoom(nPresentid) : name;
      client.leave(target);
      if (nPresentid) {
        this.redis.removeUser(me, target)?.catch?.(() => undefined);
        this.user.deleteUserFromPresentation(nPresentid, me, client.id);
      }
      this.log.info(`Client ${me} left room ${target}`, this.logApplication)
      return;
    }
    if (kind !== 'anonymous') {
      this.refuseNonUser(client, kind, 'leaveRoom');
      return;
    }

    // Transition mode: unauthenticated socket, today's behaviour.
    this.warnAnonymous('leaveRoom', JSON.stringify(room));
    const nUserid = wsActingUserId(client, client.handshake.query.nUserid);
    if (nUserid && this.user.hasConnection(nUserid, client.id)) {
      client.leave(roomNameOf(room) ?? room);

      try {

        const nPresentid = client.handshake.query.nPresentid as string;
        if (nPresentid) {
          this.redis.removeUser(nUserid);
          this.user.deleteUserFromPresentation(nPresentid, nUserid);
        }
      } catch (error) {

      }

      this.log.info(`Client ${nUserid} left room ${JSON.stringify(room)}`, this.logApplication)
    }
  }




  /**
   * Screen-share signalling between a presentation's host and one of its users. A verified sender's
   * message is relayed to `U<nToUserId>` only when sender and target currently share a `P` room on
   * this server and one of the two is that presentation's host (the legacy app signals only viewer ->
   * presenter and presenter -> viewers), and the sender fields it already carries (`data.from`,
   * `data.nUserid`) are set to the verified user.
   */
  @SubscribeMessage('web-rtc')
  async handleWebRTCevents(@MessageBody() body: any, @ConnectedSocket() client: Socket): Promise<void> {
    console.log('web-rtc', body?.event);
    const kind = this.kindOf(client);
    let payload = body;
    if (kind === 'anonymous') {
      this.warnAnonymous('web-rtc', `${body?.event} to ${JSON.stringify(body?.nToUserId)}`);
    } else if (kind !== 'user') {
      this.refuseNonUser(client, kind, 'web-rtc');
      return;
    } else {
      const me = wsVerifiedUserId(client);
      const to = body?.nToUserId;
      if (!isUuid(to)) {
        wsWarnThrottled(this.logger, `web-rtc:shape:${me}`, `[ws-auth] user ${me} web-rtc ignored: nToUserId ${JSON.stringify(to)}`);
        return;
      }
      try {
        await client.data?.presentJoin;
      } catch {
        // the join logs its own failure
      }
      if (!(await this.sharesPresentation(client, to))) {
        wsWarnThrottled(this.logger, `web-rtc:denied:${me}`, `[ws-auth] user ${me} shares no presentation with ${to} that either of them hosts; web-rtc ${body?.event} dropped`);
        return;
      }
      payload = this.stampSender(body, me);
    }
    try {
      if (['SCREEN-SHARE-STOP', 'SCREEN-SHARE-START'].includes(payload?.event)) {
        this.present.setupScreenSharing(payload);
      }
    } catch (error) {

    }
    this.server.to(`U${payload?.nToUserId}`).emit('webrtc', payload);
  }

  /**
   * True when a socket of user `toUserId` is in one of the presentation rooms `client` is in, and the
   * sender or that target socket is the presentation's host, so two viewers cannot spoof the
   * presenter's screen-share messages to each other. Roles are the ones cached when each socket
   * joined the room.
   */
  private async sharesPresentation(client: Socket, toUserId: string): Promise<boolean> {
    const mine = Array.from(client.rooms ?? []).filter((r) => !!presentIdOfRoom(r));
    if (!mine.length) return false;
    try {
      const targets = await this.server.in(`U${toUserId}`).fetchSockets();
      return targets.some((s) => mine.some((r) => {
        if (!s.rooms?.has(r)) return false;
        const nPresentid = presentIdOfRoom(r);
        return cachedPresentRole(client, nPresentid) === 'host' || cachedPresentRole(s as any, nPresentid) === 'host';
      }));
    } catch (error) {
      this.logger.error(`[ws-auth] web-rtc target lookup failed: ${(error as any)?.message ?? error}`);
      return false;
    }
  }

  /** Replaces the sender ids the payload already carries with the verified user; adds none. */
  private stampSender(body: any, me: string): any {
    const data = body?.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return body;
    const next = { ...data };
    if (Object.prototype.hasOwnProperty.call(next, 'from')) next.from = me;
    if (Object.prototype.hasOwnProperty.call(next, 'nUserid')) next.nUserid = me;
    return { ...body, data: next };
  }



  /** Fact comment room `FACT_<nFSid>`: users who may view the fact (et_fact_permissions bCanView). */
  @SubscribeMessage('join-factcomment-room')
  async handleFactSheetComment(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    try {
      const kind = this.kindOf(client);
      if (kind === 'user') {
        const me = wsVerifiedUserId(client);
        const nFSid = factIdOfRoom(roomNameOf(data));
        if (!nFSid || !(await this.access.canViewFact(client, nFSid))) {
          wsWarnThrottled(this.logger, `join-factcomment-room:denied:${me}`, `[ws-auth] user ${me} may not join ${JSON.stringify(data?.room)}; ignored`);
          return;
        }
        const room = factRoom(nFSid);
        client.join(room);
        this.log.info(`Client ${me} joined factcomment room ${room}`, this.logApplication);
        return;
      }
      if (kind !== 'anonymous') {
        this.refuseNonUser(client, kind, 'join-factcomment-room');
        return;
      }

      // Transition mode: unauthenticated socket, today's behaviour.
      this.warnAnonymous('join-factcomment-room', JSON.stringify(data?.room));
      const nUserid = client.handshake.query.room as string;
      client.join(data.room);
      console.log(`Client ${nUserid} joined factcomment room ${data.room}`)
      this.log.info(`Client ${nUserid} joined factcomment room ${data.room}`, this.logApplication);
    } catch (error) {
      console.log(error);
    }


  }



  @SubscribeMessage('leave-factcomment-room')
  async handleFactSheetCommentleave(@MessageBody() room: any, @ConnectedSocket() client: Socket): Promise<void> {
    const kind = this.kindOf(client);
    if (kind !== 'user' && kind !== 'anonymous') {
      this.refuseNonUser(client, kind, 'leave-factcomment-room');
      return;
    }
    // The legacy app sends { room }; older callers a bare string. Leaving only ever removes this socket.
    const name = roomNameOf(room);
    if (!name) return;
    const nFSid = factIdOfRoom(name);
    const target = nFSid ? factRoom(nFSid) : name;
    client.leave(target);
    const nUserid = wsActingUserId(client, client.handshake.query.nUserid);
    console.log(`Client ${nUserid} left factcomment room ${target}`)
    this.log.info(`Client ${nUserid} left factcomment room ${target}`, this.logApplication)

  }


}
