import { Inject, Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Server } from 'socket.io';
import { io, Socket } from 'socket.io-client';
import { SessionService } from '../session/session.service';
import { UtilityService } from '../utility/utility.service';
import { StreamDataService } from '@app/global/utility/stream-data/stream-data.service';
import { LogService } from '@app/global/utility/log/log.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class SocketService implements OnApplicationBootstrap, OnApplicationShutdown {
  public sockets: Map<string, Socket> = new Map();
  private reconnectionDelays: Map<string, number> = new Map(); // Store reconnection delays per URL
  private connectedUrls: Set<string> = new Set(); // To keep track of connected URLs

  public curremtSocket;
  private allservers: Set<string> = new Set();
  reconnectingServer: any = [];
  private readonly logApplication: string = 'realtime';

  @OnEvent('socket.server.connect')
  handleUserCreatedEvent(payload: any) {
    console.log('User created event received:', payload);
    this.fetchAllServerDetail(payload.nCaseid);
  }
  constructor(@Inject('WEB_SOCKET_SERVER') private ios: Server, private sessionServers: SessionService, private utility: UtilityService, private streamService: StreamDataService, private log: LogService) { }

  onApplicationBootstrap() {
    // Optionally pre-configure or initiate connections here

    // this.connectToWebSocket('http://localhost:5005');
    // this.fetchAllServerDetail()
  }

  async fetchAllServerDetail(nCaseid: string) {
    if (!nCaseid) {
      console.error('Case Id not found for fetchAllServerDetail')
      return
    }
    let data = await this.sessionServers.getSessionsServers(nCaseid)
    // console.log('\n\r\n\r Allserver', data)
    if (data && data.length > 0) {
      for (let x of data) {
        if (x.cUrl && x.nPort)
          this.connectToWebSocket(`http://${x.cUrl}:${x.nPort}`);
        // this.connectToWebSocket(x.cServerUrl);

      }

    }
  }

  isSocketalreadyConnected(serverUrl: string): boolean {
    return this.allservers.has(serverUrl);
  }

  connectToWebSocket(serverUrl: string, options?: any, attemptReconnect: boolean = true) {
    try {

      this.log.info(`Socket Connecting to ${serverUrl}`, `${this.logApplication}/socket`);
      // console.log('\n\r\n\ Socket url', serverUrl, this.connectedUrls)
      if (this.isSocketalreadyConnected(serverUrl)) {
        try {
          let connectedSockt = this.sockets.get(serverUrl);
          if (connectedSockt.connected) {
            // console.log(`socket url ${serverUrl} already connected`);
            this.log.info(`socket url ${serverUrl} already connected`, `${this.logApplication}/socket`);
            return;  // Return existing job ID if already scheduled
          }
        } catch (error) {

        }
      }

      this.allservers.add(serverUrl);
      // return;
      const socket = io(serverUrl, {
        reconnection: false, // Disable automatic reconnection
        ...options
      });

      socket.on('connect', () => {
        this.log.info(`Connected to WebSocket server at ${serverUrl}`, `${this.logApplication}/socket`);

        console.log(`Connected to WebSocket server at ${serverUrl}`);

        this.streamFailedData(socket);
        this.connectedUrls.add(serverUrl); // Store the connected server URL
        this.reconnectionDelays.set(serverUrl, 3000); // Reset delay to initial value on successful connection
        this.sendConnectToServer()
      });

      socket.on('disconnect', () => {
        console.log(`Disconnected from WebSocket server at ${serverUrl}`);
        this.log.info(`Disconnected from WebSocket server at ${serverUrl}`, `${this.logApplication}/socket`);

        this.allservers.delete(serverUrl);
        this.connectedUrls.delete(serverUrl);
        // if (attemptReconnect) {

        this.handleReconnect(serverUrl, options);
        // }
      });

      socket.on('connect_error', (error) => {
        this.log.error(`connect_error at ${error?.message}`, `${this.logApplication}/socket`);
        // console.error(`Connection Error at ${serverUrl}:`);
        this.allservers.delete(serverUrl);
        // if (attemptReconnect) {
        this.handleReconnect(serverUrl, options);
        // }
      });

      this.sockets.set(serverUrl, socket);
      this.curremtSocket = socket;
    } catch (error) {

    }

  }



  private handleReconnect(serverUrl: string, options: any) {
    let delay = 3000; // Get current delay, default to 5000ms
    try {
      let idd = this.reconnectingServer.findIndex(x => x.url == serverUrl);
      if (idd > -1) {
        clearTimeout(this.reconnectingServer[idd].timer);
        this.reconnectingServer.splice(idd, 1);
      }
    } catch (error) {

    }




    let timer = setTimeout(() => {
      this.log.info(`Attempting to reconnect to ${serverUrl}`, `${this.logApplication}/socket`);
      // console.log(`Attempting to reconnect to ${serverUrl}...`);
      this.connectToWebSocket(serverUrl, options);
    }, delay);
    this.reconnectingServer.push({ url: serverUrl, timer: timer });
    // Optionally increase delay for next reconnection attempt
    delay = Math.min(delay * 2, 30000); // Cap the delay to a maximum, e.g., 30 seconds
    this.reconnectionDelays.set(serverUrl, delay);
  }

  sendMessage(serverUrl: string, event: string, message: any) {
    const socket = this.sockets.get(serverUrl);
    if (socket && socket.connected) {
      socket.emit(event, message);
    } else {
      console.log(`No connection to ${serverUrl} or socket is disconnected.`);
    }
  }

  onApplicationShutdown(signal: string) {
    this.sockets.forEach((socket, url) => {
      // console.log(`Closing connection to ${url}`);
      socket.close();
    });
  }

  sendConnectToServer() {
    let data = Array.from(this.connectedUrls);
    this.ios["server"].emit('live-servers', { msg: 1, urls: data });
  }

  getConnectedServers() {
    let data = Array.from(this.connectedUrls);
    return { msg: 1, urls: data }
  }

  async streamFailedData(socket) {
    try {
      if (this.sessionServers.currentSessionid) {
        let failedSessions = this.utility.getFaildSession();
        if (failedSessions.length) {
          let obj = failedSessions.find(x => x.nSesid == this.sessionServers.currentSessionid);
          if (obj && obj.d.length) {
            // console.log('Sending failed data to server', obj.d);
            let res = await this.streamService.sendFailedSessions(socket, obj.d, this.sessionServers.currentSessionid);
            if (res) {
              try {
                // console.log('Failed data sent successfully');
                failedSessions = failedSessions.filter(x => x.nSesid != this.sessionServers.currentSessionid);

                // console.log('Setting Remain failed data', failedSessions);
                this.utility.setFaildSession(failedSessions, this.sessionServers.currentSessionid);
              } catch (error) {
              }
            }
          }
        }
      }
    } catch (error) {
    }
  }


}
