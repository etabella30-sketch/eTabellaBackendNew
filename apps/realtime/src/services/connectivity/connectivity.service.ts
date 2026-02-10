import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server } from 'socket.io';
import { io, Socket } from 'socket.io-client';

@Injectable()
export class ConnectivityService {
  serverUrl: string = `${this.config.get('LIVE_SERVER')}`;
  online: boolean = false;
  socket: Socket;
  constructor(@Inject('WEB_SOCKET_SERVER') private ios: Server, private config: ConfigService) {

    this.connect()

  }



  connect() {
    /*if (this.online) return;
    this.online = false;
    this.socket = io(this.serverUrl, {
      reconnection: true
    });
    this.socket.on('connect', () => {
      this.online = true;
    });
    this.socket.on('disconnect', () => {
      this.online = false;
    });
    this.socket.on('connect_error', (error) => {
      this.online = false;
    })*/

  }



  

}
