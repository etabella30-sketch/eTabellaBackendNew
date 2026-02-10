import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export interface UserConnection {
    socketId: string;
    rooms: Set<string>;
  }

export interface SocketMessage {
  event?: string;
  data: {
    
    nMasterid: string;
    [key: string]: any;
  }
}