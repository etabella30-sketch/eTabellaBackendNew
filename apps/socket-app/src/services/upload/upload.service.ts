import { Inject, Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { UsersService } from '../users/users.service';
import { SocketMessage } from '../../interfaces/socket.interface';

@Injectable()
export class UploadService {
    private server: Server;
    public setServer(server: Server) {
        this.server = server;
    }
    constructor(
        // @Inject('WEB_SOCKET_SERVER') private socket: Server, 
        private user: UsersService) {


    }


    async emitMsg(value: SocketMessage, topic?: string) {

        const users = value?.data?.users || [];

        if (users?.length) {
            users.forEach(userId => {
                this.server.to(`U${userId}`).emit(topic ? topic : "upload-messages", value);
            });
        } else {
            this.server.to(`U${value.data.nMasterid}`).emit(topic ? topic : "upload-messages", value);
        }

        /*   let User = await this.user.getUserSocket(value.data.nMasterid);
           if (User) {
               console.log('Sending message to user', User, value);
               this.server.to(User).emit(topic ? topic : "upload-messages", value);
           } else {
               console.log('Enable to send user not found', value)
           }
   */
    }




}
