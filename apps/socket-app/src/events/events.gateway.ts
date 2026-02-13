import { SubscribeMessage, WebSocketGateway, MessageBody, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket } from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
// import { UserConnection } from '../interfaces/socket.interface';
import { UseGuards } from '@nestjs/common';
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

  constructor(private log: LogService, private user: UsersService, private upload: UploadService, private index: IndexService, private pagination: PaginationService,
    private batchfile: BatchfileService, private fileexport: ExportService, private db: DbService, private readonly redis: RedisDbService, private present: PresentService, private notification: NotificationService,
    private realtime: RealtimeService) { }

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


  async handleConnection(client: any, ...args: any[]) {
    const nUserid = client.handshake.query.nUserid as string;
    this.log.info(`User connected : ${nUserid}`, this.logApplication)
    this.user.setUser(nUserid, { socketId: client.id, rooms: new Set() })

    let urs = await this.user.getUserSocket(nUserid) //client.id

    this.db.executeRef('user_sync_update', { nMasterid: nUserid });
    // this.server.to(urs).emit('upload-messages', 'Welcome to the chat of socket');
    // this.user.userConnections.set(nUserid, { socketId: client.id, rooms: new Set() });
    // setInterval(() => {
    //   console.log('Sending message to user',urs);
    //   this.server.to(urs).emit('message', 'Welcome to the chat of socket');
    // }, 1000)
  }

  async handleDisconnect(client: any) {
    try {
      console.log('DISCONNECTED', client.id);
      let entries: any[][] = await this.user.getEntries();
      const entry: any = Array.from(entries).find(([key, value]) => value.socketId === client.id);
      if (entry) {
        const [nUserid, userConnection] = entry;
        this.log.info(`User disconnected : ${nUserid}`, this.logApplication)
        console.log('Disconnected', nUserid)
        userConnection.rooms.forEach(room => client.leave(room));

        /* try {
           const presentIds = await this.redis.getAllPresentationsByUser(nUserid);
 
           if (presentIds?.length) {
             presentIds.forEach(async (presentId) => {
 
               console.log(`FIND  USER ${nUserid} IN PRESENT ${presentId}`);
               const room = this.server.sockets.adapter.rooms.get(presentId);
               if (room && room.has(client.id)) {
               // Emit the event only if the user is part of the room
               console.log(`removeign ${nUserid} from ${presentId}`);
               this.server.to(presentId).emit('presentation', { event: 'USER-LEFT', data: { nUserid: nUserid } });
               }
 
               // this.server.to(presentId).emit('presentation', { event: 'USER-LEFT', data: { nUserid: nUserid } });
 
             })
           }
         } catch (error) {
 
         }*/




        this.user.removeUser(nUserid);
        this.redis.removeUser(nUserid);
      }
    } catch (error) {
      this.log.error(`disconnect  : ${JSON.stringify(error)}`, this.logApplication)
    }




    try {
      const socketid = client.id;
      const presentations = this.user.findPresentationsAndUsersBySocketId(socketid);
      // console.log('PRESENTATIONF FOR SOCKETID', presentations);
      presentations.forEach(e => {
        // console.log('REMOVING USER FROM PRESNTATION', e);
        this.server.to(`P${e.nPresentid}`).emit('presentation', { event: 'USER-LEFT', data: { nUserid: e.userid } });
      });
    } catch (error) {

    }
  }


  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket, callback: Function): void {
    this.log.info(`Message received : ${JSON.stringify(data)}`, this.logApplication)
    client.emit('message', data, () => {
      callback('Message processed');
    });
  }




  @SubscribeMessage('present-position')
  async handlePresentPositionMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    // console.log('present-position', data);
    this.present.savePosition(data);
  }



  @SubscribeMessage('present-compare')
  async handlePresentCompareMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    // console.log('present-compare', data);
    this.present.saveCompare(data);
  }



  @SubscribeMessage('present-compare-data')
  async handlePresentCompareDataMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    // console.log('present-compare-data', data);
    this.present.saveCompareData(data);
  }

  @SubscribeMessage('present-change-tab')
  async handlePresentDocChangeMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    // console.log('present-change-tab', data);
    this.present.saveCurrentTab(data);
  }


  @SubscribeMessage('join-room')
  async handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    const nUserid = client.handshake.query.nUserid as string;
    const userConnection = await this.user.getUser(nUserid); // this.user.userConnections.get(nUserid);
    if (userConnection) {
      client.join(data.room);
      userConnection.rooms.add(data.room);
      console.log('ROOM Join', data.room)
      this.server.emit('webrtc', { event: 'join-viewer', data: { nUserid: nUserid } });
      this.log.info(`Client ${nUserid} joined room ${data.room}`, this.logApplication)
    }
  }



  @SubscribeMessage('present-pause-user')
  async handlePauseUser(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    try {
      // console.log('EVENT FOR REMOVE USER FROM PRESENTATION')
      const socketid = this.user.findSocketIdByUserIdAndPresentation(data.nPresentid, data.nUserid);
      if (socketid) {
        // console.log('Removing user', socketid, data.nPresentid)
        this.server.sockets.sockets.get(socketid)?.leave(`P${data.nPresentid}`);
      }

    } catch (error) {
      console.error(error);
    }

  }

  @SubscribeMessage('join-present-room')
  async handlePresentJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    try {
      const nUserid = client.handshake.query.nUserid as string;
      const nPresentid = data.nPresentid;
      const isHost = client.handshake.query.isHost == 'true';
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



  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket): Promise<void> {
    const nUserid = client.handshake.query.nUserid as string;
    const userConnection = await this.user.getUser(nUserid); // this.user.userConnections.get(nUserid);
    if (userConnection) {
      client.leave(room);
      userConnection.rooms.delete(room);

      try {

        const nPresentid = client.handshake.query.nPresentid as string;
        if (nPresentid) {
          this.redis.removeUser(nUserid);
          this.user.deleteUserFromPresentation(nPresentid, nUserid);
        }
      } catch (error) {

      }

      this.log.info(`Client ${nUserid} left room ${room}`, this.logApplication)
    }
  }




  @SubscribeMessage('web-rtc')
  async handleWebRTCevents(@MessageBody() body: any, @ConnectedSocket() client: Socket): Promise<void> {
    console.log('web-rtc', body);
    try {
      if (['SCREEN-SHARE-STOP', 'SCREEN-SHARE-START'].includes(body.event)) {
        this.present.setupScreenSharing(body);
      }
    } catch (error) {

    }
    this.server.to(`U${body?.nToUserId}`).emit('webrtc', body);
  }



  @SubscribeMessage('join-factcomment-room')
  async handleFactSheetComment(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    try {
      const nUserid = client.handshake.query.room as string;
      client.join(data.room);
      console.log(`Client ${nUserid} joined factcomment room ${data.room}`)
      this.log.info(`Client ${nUserid} joined factcomment room ${data.room}`, this.logApplication);
    } catch (error) {
      console.log(error);
    }


  }



  @SubscribeMessage('leave-factcomment-room')
  async handleFactSheetCommentleave(@MessageBody() room: string, @ConnectedSocket() client: Socket): Promise<void> {
    const nUserid = client.handshake.query.nUserid as string;
    client.leave(room);
    console.log(`Client ${nUserid} left factcomment room ${room}`)
    this.log.info(`Client ${nUserid} left factcomment room ${room}`, this.logApplication)

  }


}
