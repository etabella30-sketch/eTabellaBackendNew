import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { UsersService } from '../users/users.service';

/** The joined `U<userId>` rooms of the given users, whatever the case their token wrote the id in. */
export function userRoomsFor(server: Pick<Server, 'sockets'> | undefined, recipients: unknown): string[] {
    if (!Array.isArray(recipients) || !recipients.length) return [];
    const wanted = new Set(recipients.filter((id): id is string => typeof id === 'string' && !!id.trim()).map(id => `u${id.trim().toLowerCase()}`));
    if (!wanted.size) return [];
    const joined: Iterable<string> = server?.sockets?.adapter?.rooms?.keys?.() ?? [];
    const rooms: string[] = [];
    for (const room of joined) {
        if (typeof room === 'string' && room.startsWith('U') && wanted.has(room.toLowerCase())) rooms.push(room);
    }
    return rooms;
}

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
        const event = value?.event;
        const status = value?.data?.data?.status;

        // PUBLISH-TRANSCRIPT 'S' (success) fires once the local Electron publisher
        // has finished generating the per-user final transcripts. Every user who
        // currently has the draft open in <individual-doc> needs to see the
        // "Final transcript now available" modal — not just the admin who clicked
        // publish. The previous routing (`to(\`U${nMasterid}\`)`) only delivered
        // the event to the admin's own user-room, so other viewers never received
        // the modal.
        //
        // The frontend listener (individual-doc.component.ts) already gates the
        // popup on having an open session document with a non-null nSesid, so
        // broadcasting to every connected socket is safe — clients without a
        // matching open doc simply drop the event.
        //
        // We keep 'P' (in-progress) and 'F' (failure) payloads routed to the
        // admin's user-room so the publish-progress bar in the transcript-table
        // view doesn't flicker on every other user's screen.
        if (event === 'PUBLISH-TRANSCRIPT' && status === 'S') {
            this.server.emit(topic ? topic : "realtime-transcript-messages", value);
            return;
        }

        this.server.to(`U${value.data.nMasterid}`).emit(topic ? topic : "realtime-transcript-messages", value);
    }


    /**
     * A new comment goes to the fact's room (viewers with its thread open) and to the own room of
     * each viewer coreapi named in `recipients`, so a Fact can show a "new comment" badge to
     * someone who has not opened its thread. One `to([...])` call: a socket in both rooms hears
     * it once. Room names are exact, and a user's room is `U` + the id in their token, so a
     * recipient id is matched to the joined rooms without regard to case.
     */
    async emitCommentMsg(value: any, topic?: string) {
        try {
            const rooms = [`FACT_${value.nFSid}`, ...userRoomsFor(this.server, value?.recipients)];
            this.server.to(rooms).emit(topic ? topic : "factsheet-comments", value);
        } catch (error) {
            console.error(error)
        }

    }
}
