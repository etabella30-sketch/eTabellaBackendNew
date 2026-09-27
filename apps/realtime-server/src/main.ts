import { NestFactory } from '@nestjs/core';
import { RealtimeServerModule } from './realtime-server.module';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpErrorFilter } from '@app/global/middleware/exception';
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
import { ConfigService } from '@nestjs/config';
import { createKafkaOptions } from '@app/global/utility/kafka/kafka.config';
import * as bodyParser from 'body-parser';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { WsAuthIoAdapter, wsAuthEnforced } from '@app/global/utility/ws-auth/ws-auth';
import { installHttpSurfaceGuards } from './middleware/realtime-http-surface';


async function bootstrap() {
  const app = await NestFactory.create(RealtimeServerModule);

  // First handlers on the Express stack, ahead of Nest's middleware/routes and ServeStatic (all
  // registered later, in app.init()): refuse HEAD, which skipped the method-scoped auth middleware
  // while the GET handler still ran, and serve static files only from the allowlist in
  // middleware/realtime-http-surface.ts (PUBLIC_STATIC_PREFIXES: /realtime-transcripts/exports/).
  // Every other path into the assets folder (raw transcripts, uploaded session files, migrations,
  // scripts, ...) answers 404.
  installHttpSurfaceGuards(app);

  // Socket.io connection-time auth (libs/global ws-auth). Installed before anything can create a
  // socket server: gateways are bound in app.init() (from app.listen below); the Kafka hybrid
  // microservice is created already-initialised, so it never binds gateways itself.
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

  // Increase the JSON payload size limit
  app.use(bodyParser.json({ limit: '50mb' })); // Set the limit according to your needs
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // For URL-encoded bodies

  app.connectMicroservice(createKafkaOptions('realtime-group'));
  
  await app.startAllMicroservices();
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  // Enable compression middleware
  app.use(compression());
  
  const config = new DocumentBuilder()
    .setTitle('Etabella realtime server')
    .setDescription('API description')
    // .addServer(process.env.NODE_ENV === 'production' ? '/realtimeapi' : '')
    .setVersion('1.0')
    // .addTag('Alpha')
    // .addBearerAuth(
    //   { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    //   'JWT', // This is the name used to reference the Security Scheme in the Swagger UI.
    // )
    .build();


  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip out properties that do not have any decorators
    forbidNonWhitelisted: true, // Throw an error when non-whitelisted values are provided
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
  }));
  
  app.useGlobalFilters(new HttpErrorFilter());

  // Access the ConfigService from the app's container
  const configService = app.get(ConfigService);
  
  await app.listen(configService.get('PORT_REALTIME_SERVERAPI'));
  
}
bootstrap();