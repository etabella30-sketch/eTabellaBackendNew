import { Inject, Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { UsersService } from '../users/users.service';
import { SocketMessage } from '../../interfaces/socket.interface';

@Injectable()
export class ExportService {
    private server: Server;
    public setServer(server: Server) {
        this.server = server;
    }
    constructor(
        // @Inject('WEB_SOCKET_SERVER') private socket: Server, 
        private user: UsersService) {

    }


    async emitMsg(value: SocketMessage) {
        this.server.to(`U${value.data.nMasterid}`).emit("export-messages", value);
        /* let User = await this.user.getUserSocket(value.data.nMasterid);
         if (User) {
             console.log('Sending message to user', User, value);
             this.server.to(User).emit("index-messages", value);
             // this.socket[User].to("room").emit("upload-messages", value);
             // this.socket["server"].to(User).emit("upload-messages", value);
             // this.socket["server"].emit("upload-messages1", value);
         } else {
             console.log('Enable to send user not found', value)
             //error to send user not found
         }*/

    }

}
