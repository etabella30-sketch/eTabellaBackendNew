import { Injectable } from '@nestjs/common';
import { SocketMessage } from '../../interfaces/socket.interface';
import { Server } from 'socket.io';

@Injectable()
export class UsersService {

    private server: Server;
    public setServer(server: Server) {
        this.server = server;
    }

    /**
     * userId (lower-cased) -> ids of that user's open sockets. A user can hold several sockets at once
     * (Outputs + RT Production in the new app, several tabs, the legacy app), so one socket closing must
     * not forget the others.
     */
    private userConnections: Map<string, Set<string>> = new Map();

    /** nPresentid (lower-cased) -> userId (lower-cased) -> the socket that joined, plus the id as given. */
    private presentationMap = new Map<string, Map<string, { socketid: string, userid: string }>>();

    private key(id: string): string {
        return String(id).toLowerCase();
    }

    addConnection(nUserid: string, socketId: string): void {
        if (!nUserid || !socketId) return;
        const k = this.key(nUserid);
        let sockets = this.userConnections.get(k);
        if (!sockets) {
            sockets = new Set<string>();
            this.userConnections.set(k, sockets);
        }
        sockets.add(socketId);
    }

    /** Forgets one socket of a user. Returns true when that was the user's last open socket. */
    removeConnection(nUserid: string, socketId: string): boolean {
        if (!nUserid) return false;
        const k = this.key(nUserid);
        const sockets = this.userConnections.get(k);
        if (!sockets) return false;
        sockets.delete(socketId);
        if (sockets.size === 0) {
            this.userConnections.delete(k);
            return true;
        }
        return false;
    }

    /** True when the user has any open socket, or (with socketId) when that socket belongs to the user. */
    hasConnection(nUserid: string, socketId?: string): boolean {
        if (!nUserid) return false;
        const sockets = this.userConnections.get(this.key(nUserid));
        if (!sockets) return false;
        return socketId ? sockets.has(socketId) : sockets.size > 0;
    }

    getSocketIds(nUserid: string): string[] {
        if (!nUserid) return [];
        return Array.from(this.userConnections.get(this.key(nUserid)) ?? []);
    }

    /** The user's most recently connected socket id, or null. */
    async getUserSocket(nUserid: string): Promise<any> {
        const ids = this.getSocketIds(nUserid);
        if (!ids.length) {
            console.log('User not found')
            return null;
        }
        return ids[ids.length - 1];
    }

    async emitMsg(value: SocketMessage) {
        this.server.to(`U${value.data.nMasterid}`).emit("LOGIN-VERIFY", {
            data: {
                cBroweserid: value.data.cBroweserid,
            },
        });
    }


    // Add user to a presentation
    addUserToPresentation(nPresentid: string, userid: string, socketid: string): void {
        const pk = this.key(nPresentid);
        if (!this.presentationMap.has(pk)) {
            this.presentationMap.set(pk, new Map());
        }
        const userMap = this.presentationMap.get(pk);
        if (userMap) {
            userMap.set(this.key(userid), { socketid, userid: String(userid) }); // Store an object with socketid
        }
    }

    // Find presentations and users by socket ID
    findPresentationsAndUsersBySocketId(socketid: string): { nPresentid: string, userid: string }[] {
        const result: { nPresentid: string, userid: string }[] = [];

        for (const [nPresentid, userMap] of this.presentationMap.entries()) {
            for (const data of userMap.values()) {
                if (data.socketid === socketid) {
                    result.push({ nPresentid, userid: data.userid });
                }
            }
        }

        return result; // Returns an array of matches
    }

    /**
     * Delete user from a presentation. With socketid, only when the entry still belongs to that socket
     * (a later join from another tab of the same user replaced it).
     */
    deleteUserFromPresentation(nPresentid: string, userid: string, socketid?: string): void {
        const pk = this.key(nPresentid);
        const userMap = this.presentationMap.get(pk);
        if (userMap) {
            const uk = this.key(userid);
            if (socketid && userMap.get(uk)?.socketid !== socketid) return;
            userMap.delete(uk);
            if (userMap.size === 0) {
                this.presentationMap.delete(pk); // Cleanup if no users are left in the presentation
            }
        }
    }


    // Find socket ID by user ID and presentation ID
    findSocketIdByUserIdAndPresentation(nPresentid: string, userid: string): string | null {
        if (!nPresentid || !userid) return null;
        const userMap = this.presentationMap.get(this.key(nPresentid));
        if (userMap) {
            const data = userMap.get(this.key(userid));
            if (data) {
                return data.socketid;
            }
        }
        return null;
    }
}
