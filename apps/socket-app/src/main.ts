import { NestFactory } from '@nestjs/core';
import { SocketAppModule } from './socket-app.module';
import { ValidationPipe } from '@nestjs/common';
import { createKafkaOptions } from '@app/global/utility/kafka/kafka.config';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
import { ConfigService } from '@nestjs/config';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { WsAuthIoAdapter, wsAuthEnforced } from '@app/global/utility/ws-auth/ws-auth';
import { installHttpSurfaceGuards } from '@app/global/utility/http-surface/http-surface';


async function bootstrap() {
  const app = await NestFactory.create(SocketAppModule);

  // First handler on the Express stack, ahead of Nest's middleware and routes (registered later, in
  // app.init()): refuse HEAD, which would skip any route-scoped middleware while the GET handler
  // still ran. Socket.io requests never reach Express, so the gateways are unaffected.
  installHttpSurfaceGuards(app);

  // Socket.io connection-time auth (libs/global ws-auth), for the gateway on /socketservice/socket.io
  // and the shared AppGateway on /socket.io alike. Installed before anything can create a socket
  // server: gateways are bound in app.init() (from app.listen below), and the Kafka hybrid
  // microservice is created already initialised, so it never binds gateways itself.
  // WS_AUTH_ENFORCE unset/false = transition (credential-less sockets allowed as 'anonymous').
  const wsConfig = app.get(ConfigService);
  const wsRedis = app.get(RedisDbService);
  app.useWebSocketAdapter(new WsAuthIoAdapter(
    app,
    () => ({
      jwtSecret: wsConfig.get('JWT_SECRET'),
      serviceKey: wsConfig.get('REALTIME_SERVICE_KEY'),
      getValue: (key: string) => wsRedis.getValue(key),
    }),
    () => wsAuthEnforced(wsConfig),
  ));


  app.connectMicroservice(createKafkaOptions('socket-group'));
  
  await app.startAllMicroservices();
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip out properties that do not have any decorators
    forbidNonWhitelisted: true, // Throw an error when non-whitelisted values are provided
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
  }));


  // Access the ConfigService from the app's container
  const configService = app.get(ConfigService);
  
  await app.listen(configService.get('PORT_SOCKETAPI'));
}
bootstrap();