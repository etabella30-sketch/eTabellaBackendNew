import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TcpService } from '../tcp/tcp.service';
import { SocketService } from '../socket/socket.service';
import { StreamDataService } from '@app/global/utility/stream-data/stream-data.service';
import { SessionService } from '../session/session.service';
import { ConfigService } from '@nestjs/config';
import { BridgeParseService } from '../bridge-parse/bridge-parse.service';
import { IssueService } from '../services/issue/issue.service';
import { VerifyTabsService } from '../services/verify-tabs/verify-tabs.service';
import { ParseDataService } from '../parse-data/parse-data.service';
import { TransferHealthService } from '../services/transfer-health/transfer-health.service';


@WebSocketGateway({
  cors: {
    origin: '*',  // Configure according to your security requirements
  },
  path: '/realtimelocalsocket/',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private config: ConfigService, private tcpService: TcpService, private bridgeParseService: BridgeParseService, private issue: IssueService,
    private socketService: SocketService, private readonly sessionService: SessionService, private readonly streamDataService: StreamDataService,
    private readonly verifytab: VerifyTabsService, private parseCaseViewData: ParseDataService, private trasnferHealthService: TransferHealthService) { }

  afterInit(server: Server) {
    this.tcpService.setServer(server);
    this.bridgeParseService.setServer(server);
    this.sessionService.setServer(server);
    this.trasnferHealthService.setServer(server);
    this.parseCaseViewData.setServer(server);
  }


  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);


    try {
      if (client?.userroom && client?.userroom?.nSesid) {
        this.issue.joiningLog({ nSesid: client?.userroom?.nSesid, nUserid: (client?.userroom?.nUserid), cStatus: 'L', cSource: 'O' });
      }
    } catch (error) {

    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string): void {
    // console.log('Message received:', data);
    this.server.emit('message', data); // echo the message to all clients
  }

  @SubscribeMessage('reinilize-sockets')
  handleSocketReinilize(@MessageBody() data: any): void {
    // console.log('reinilize-sockets:', data);
    this.socketService.fetchAllServerDetail(data?.nCaseid); // echo the message to all clients
  }


  @SubscribeMessage('get-live-servers')
  handleLiveMessagea(@MessageBody() data: string): void {
    // console.log('GET-live-servers:', data);
    this.socketService.sendConnectToServer(); // echo the message to all clients
  }

  // @SubscribeMessage('fetch-data')
  // fetchData(client: Socket, data: any) {
  //   console.log('\n\n\n\n\n fetch-data called Message from client:', data,'\n\n\n\n');
  //   this.streamDataService.streamData('localdata', client.id, data, response => {
  //   })
  // }

  @SubscribeMessage('fetch-data')
  async fetchData(client: Socket, data: any) {
    debugger;
    try {
      // console.log('FETCH-DATA:', data);
      // console.log('\n\n\n\n\n\n Message from client 2:', data);

      // const res = await this.issueService.getAnnotationOfPages({ nSessionid: data.nSesid, nUserid: data.nUserid, nCaseid: data.nCaseid, cTranscript: 'N' });
      // const url = this.config.get('LIVE_SERVER') + '/issue/getannotationofpages'
      //  console.log('URL:', url)
      // const res = await this.sessionService.makePostRequest(url, { nSessionid: data.nSesid, nUserid: data.nUserid, nCaseid: data.nCaseid, cTranscript: 'N' });
      // console.log('Annotation:', res);
      //    this.streamDataService.streamData('localdata', client.id, data, response => {
      //  })
      // console.log('Annotation:', res);
      // this.streamDataService.streamData('localdata', client.id, data, response => {
      // }, res[0], res[1])

      // this.streamDataService.streamData('localdata', client.id, data, response => {
      // }, [], [])


      // this.io["server"].to(userId).emit('previous-data', { msg: 1, page: pgNo, data: recData, totalPages: files.length, nSesid: data.nSesid, a: aDATA, h: hDATA, tab: data.tab });




      // console.log('\n\n\n\n\n\n Message from client 2:', data);
      const res = await this.issue.etRealtimeGetIssueAnnotationHighlight({ nSessionid: data.nSesid, nUserid: data.nUserid, nCaseid: data.nCaseid, cTranscript: 'N' });
      try {
        // console.log('Annotation:', res);
        if (res?.ref1?.length) {
          res?.ref1.map(a => a.cordinates = JSON.parse(a.cordinates))
        }


        if (res?.ref2?.length) {
          res?.ref2.map(a => a.cordinates = JSON.parse(a.cordinates))
        }
      } catch (error) {

      }

      // const isExists = await this.issue.isFeedExistForSession(data.nSesid);
      if (data.cProtocol == 'B' && this.sessionService.currentSessionid == data.nSesid && this.sessionService.CurrentJob?.lineBuffer?.length) { //isExists
        this.bridgeParseService.fetchPreviousData(client.id, data, res?.ref1, res?.ref2);
      } else {
        this.streamDataService.streamData('localdata', client.id, data, response => {
        }, res?.ref1, res?.ref2);
      }


      try {
        /* if (data.cProtocol == 'C') {
           let url1 = this.config.get('LIVE_SERVER') + '/session/sessiondata'
           let param = { nSesid: data.nSesid, cUnicuserid: '' }
           //  console.log('URL:', url1, 'Param:', param)
           //let dt = await this.sessionService.getSessiondata({ nSesid: data.nSesid, cUnicuserid: '' })
           let dt = this.sessionService.makeGetRequest(url1, param)
           // console.log('Session Data:', dt)   
           this.server.emit('session-detail', dt);
           // console.log('EMIT SESSION DETAIOL')
           this.server.to(client.id).emit('session-detail', dt);
         }*/
      } catch (error) {

      }

    } catch (error) {

    }

  }

  @SubscribeMessage('refresh-data')
  refreshData(client: Socket, data: any) {
    console.log('Message from client on refresh-data:', data);

    this.sessionService.loadActiveSessionDetail(data.nCaseid)
    /* this.sessionService.reInitSessions(3)
     try {
       if (this.sessionService.currentSessionid) {
         if (!this.verifytab.caseTabs?.length) {
           this.verifytab.clearTabs();
           this.verifytab.getAllCaseTabs(this.sessionService.currentSessionid);
         }
       }
     } catch (error) {
 
     }*/
  }



  @SubscribeMessage('refresh-status-tcp')
  refreshTcpConnectionStatus(client: Socket, data: any) {
    // console.log('Message from client:', data);
    this.tcpService.emitConnectionStatus(this.tcpService.current_status);
  }


  @SubscribeMessage('join-room')
  async handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket): Promise<void> {
    console.log('Joining Room:', data);
    const nUserid = client.handshake.query.nUserid as string;
    // Check if the user is already in the room
    const rooms = Array.from(client.rooms);
    try {
      if (data.room.includes('S')) {
        const nSesid = data?.nSesid // parseInt(data.room.replace(/\D/g, ''))
        if (nSesid) {
          client["userroom"] = { nSesid, nUserid: (data.nUserid) };
          this.issue.joiningLog({ nSesid: nSesid, nUserid: (data.nUserid), cStatus: 'J', cSource: 'O' });
        }
      }
    } catch (error) {
    }
    if (!rooms.includes(data.room)) {
      client.join(data.room);
      console.log('ROOM Join', data.room);
    } else {
      console.log('User already in the room', data.room);
    }
  }


  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@MessageBody() room: any, @ConnectedSocket() client: Socket): Promise<void> {
    const nUserid = client.handshake.query.nUserid as string;


    try {
      if (room.room.includes('S')) {
        const nSesid = room?.nSesid // parseInt(room.room.replace(/\D/g, ''))
        if (nSesid) {
          this.issue.joiningLog({ nSesid: nSesid, nUserid: (room.nUserid), cStatus: 'L', cSource: 'O' });
        }
      }
    } catch (error) {
    }

    client.leave(room);
    console.log('ROOM Leave', room)
  }


}
