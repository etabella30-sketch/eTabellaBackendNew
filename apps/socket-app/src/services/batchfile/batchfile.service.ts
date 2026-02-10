import { Inject, Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { UsersService } from '../users/users.service';
import { SocketMessage } from '../../interfaces/socket.interface';


@Injectable()
export class BatchfileService {
    private server: Server;
    public setServer(server: Server) {
        this.server = server;
    }
    constructor(private user: UsersService) { }

    async emitMsg(value: SocketMessage) {
        this.server.to(`U${value.data.nMasterid}`).emit("batchfile-messages", value);
    }
}
