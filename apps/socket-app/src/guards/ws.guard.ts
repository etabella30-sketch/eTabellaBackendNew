import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private readonly redisDbService: RedisDbService,private config: ConfigService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient<Socket>();
        let token = client.handshake.query.token as string; // First, try to get from query
        
        // If not found in query, try to get from headers
        if (!token) {
            const authHeader = client.handshake.headers.authorization;
            // Check if it's an array and extract the first element
            if (Array.isArray(authHeader)) {
                token = authHeader[0];
            } else {
                token = authHeader;
            }
            // Extract the token if it's a bearer token
            if (token && token.startsWith('Bearer ')) {
                token = token.split(' ')[1];
            }
        }

        if (!token) {
            throw new WsException('A token is required for authentication');
        }

        let decoded;
        try {
            decoded = jwt.verify(token, this.config.get('JWT_SECRET'));
        } catch (err) {
            throw new WsException('Invalid Token');
        }

        try {
            const dataUSR = await this.redisDbService.getValue(`user/${decoded.userId}`);
            const user = JSON.parse(dataUSR);

            if (user.id !== decoded.broweserId) {
                throw new WsException('Old Token');
            }
            client.data = { userId: decoded.userId, isAdmin: user.a || false }; // Storing user data in socket for further use
        } catch (error) {
            throw new WsException('Old Token');
        }
        
        return true;
    }
}
