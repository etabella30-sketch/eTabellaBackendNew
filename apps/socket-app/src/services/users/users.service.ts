import { Injectable } from '@nestjs/common';
import { SocketMessage, UserConnection } from '../../interfaces/socket.interface';
import { Server } from 'socket.io';

@Injectable()
export class UsersService {

    private server: Server;
    public setServer(server: Server) {
        this.server = server;
    }
    private userConnections: Map<string, UserConnection> = new Map();


    private presentationMap = new Map<string, Map<string, { socketid: string }>>();

    async setUser(nUserid: string, obj: UserConnection) {
        this.userConnections.set(nUserid.toString(), obj);
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

    async emitMsg(value: SocketMessage) {
        debugger;

        this.server.to(`U${value.data.nMasterid}`).emit("LOGIN-VERIFY", value);


    }













    // Add user to a presentation
    addUserToPresentation(nPresentid: string, userid: string, socketid: string): void {
        if (!this.presentationMap.has(nPresentid)) {
            this.presentationMap.set(nPresentid, new Map());
        }
        const userMap = this.presentationMap.get(nPresentid);
        if (userMap) {
            userMap.set(userid, { socketid }); // Store an object with socketid
        }
    }

    // Find presentations and users by socket ID
    findPresentationsAndUsersBySocketId(socketid: string): { nPresentid: string, userid: string }[] {
        const result: { nPresentid: string, userid: string }[] = [];

        for (const [nPresentid, userMap] of this.presentationMap.entries()) {
            for (const [userid, data] of userMap.entries()) {
                if (data.socketid === socketid) {
                    result.push({ nPresentid, userid });
                }
            }
        }

        return result; // Returns an array of matches
    }

    // Delete user from a presentation
    deleteUserFromPresentation(nPresentid: string, userid: string): void {
        const userMap = this.presentationMap.get(nPresentid);
        if (userMap) {
            userMap.delete(userid);
            if (userMap.size === 0) {
                this.presentationMap.delete(nPresentid); // Cleanup if no users are left in the presentation
            }
        }
    }


    // Find socket ID by user ID and presentation ID
    findSocketIdByUserIdAndPresentation(nPresentid: string, userid: string): string | null {
        const userMap = this.presentationMap.get(nPresentid);
        if (userMap) {
            const data = userMap.get(userid);
            if (data) {
                return data.socketid;
            }
        }
        return null;
    }
}
