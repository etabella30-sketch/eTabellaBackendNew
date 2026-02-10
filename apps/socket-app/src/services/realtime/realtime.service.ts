import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { UsersService } from '../users/users.service';

@Injectable()
export class RealtimeService {


    private server: Server;
    public setServer(server: Server) {
        this.server = server;
    }
    constructor(
        // @Inject('WEB_SOCKET_SERVER') private socket: Server, 
        private user: UsersService) {


    }


    async emitMsg(value: any, topic?: string) {
        this.server.to(`U${value.data.nMasterid}`).emit(topic ? topic : "realtime-transcript-messages", value);
    }


    async emitCommentMsg(value: any, topic?: string) {
        try {
            this.server.to(`FACT_${value.nFSid}`).emit(topic ? topic : "factsheet-comments", value);
        } catch (error) {
            console.error(error)
        }

    }
}
