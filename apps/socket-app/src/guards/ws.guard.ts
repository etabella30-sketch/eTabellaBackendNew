import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { ConfigService } from '@nestjs/config';
import { handshakeToken } from '@app/global/utility/ws-auth/ws-auth';

/**
 * Per-message check on every @SubscribeMessage handler of the socket-app gateway.
 *
 * The connection identity is set once by WsAuthIoAdapter (socket.data = { kind, userId, isAdmin })
 * and is never replaced here. What this guard adds per message is revocation: the handshake token
 * must still verify and still be bound to its browser in Redis, so a socket whose session was
 * signed out or replaced stops working without waiting for a reconnect.
 * - 'service' sockets are refused: socket-app has no ingest events (its backend input is Kafka).
 * - a socket with no token (an 'anonymous' transition socket) is refused, exactly as before.
 * - a socket whose identity was not set by the adapter (adapter not installed) gets it here from the
 *   token, added to socket.data rather than replacing it.
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private readonly redisDbService: RedisDbService,private config: ConfigService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient<Socket>();
        const kind = client?.data?.kind;

        if (kind === 'service') {
            throw new WsException('Forbidden');
        }

        // Same lookup order as the connection middleware: `auth.token` (where the web clients send
        // it, so it never lands in access logs), `query.token`, `Authorization: Bearer`, then the
        // `access_token` cookie.
        const token = handshakeToken((client?.handshake ?? {}) as any);

        if (!token) {
            throw new WsException('A token is required for authentication');
        }

        let decoded;
        try {
            decoded = jwt.verify(token, this.config.get('JWT_SECRET'));
        } catch (err) {
            throw new WsException('Invalid Token');
        }

        let user;
        try {
            const dataUSR = await this.redisDbService.getValue(`user/${decoded.userId}`);
            user = JSON.parse(dataUSR);
        } catch (error) {
            throw new WsException('Old Token');
        }
        if (!user || user.id !== decoded.broweserId) {
            throw new WsException('Old Token');
        }

        if (kind === 'user') {
            // The token is the one the socket connected with; its user must still be the socket's user.
            if (String(decoded.userId) !== String(client.data.userId)) {
                throw new WsException('Old Token');
            }
            return true;
        }

        if (!kind) {
            // No connection identity (WsAuthIoAdapter not installed): set it from the token, keeping
            // anything else already on socket.data.
            client.data = { ...(client.data || {}), kind: 'user', userId: String(decoded.userId), isAdmin: !!user.a };
            return true;
        }

        // 'anonymous' carries no token by definition; one that somehow has a token is refused rather
        // than silently upgraded mid-connection.
        throw new WsException('Unauthorized');
    }
}
