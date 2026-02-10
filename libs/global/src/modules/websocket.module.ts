// Define a provider for the WebSocket server in a suitable module, e.g., WebSocketModule

import { Module } from '@nestjs/common';
import { WebSocketServer, WebSocketGateway } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class AppGateway {
    @WebSocketServer()
    public server: Server;
}

@Module({
    providers: [
        AppGateway,
        {
            provide: 'WEB_SOCKET_SERVER',
            useExisting: AppGateway
        }
    ],
    exports: ['WEB_SOCKET_SERVER', AppGateway] // Exporting the provider
})
export class WebSocketModule {}
