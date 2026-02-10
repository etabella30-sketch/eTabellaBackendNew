import { Injectable } from '@nestjs/common';
import { UserConnection } from '../../interfaces/session.interface';

@Injectable()
export class UsersService {

    private userConnections: Map<string, UserConnection> = new Map();



    async setUser(nUserid: string, obj: UserConnection) {
        if (nUserid) {
            this.userConnections.set(nUserid.toString(), obj);
        }
    }

    async getUser(nUserid: string): Promise<any> {
        if (nUserid) {
            return this.userConnections.get(nUserid.toString())
        } else {
            console.log('User not found')
            return null;
        }

    }

    async getUserSocket(nUserid: string): Promise<any> {
        if (nUserid) {
            let urs = this.userConnections.get(nUserid.toString())
            return urs ? urs.socketId : null;
        } else {
            console.log('User not found')
            return null;
        }
    }



    async removeUser(nUserid: string): Promise<any> {
        this.userConnections.delete(nUserid.toString());
    }

    async getEntries(): Promise<any> {
        return this.userConnections.entries();
    }


}
