import { NestFactory } from '@nestjs/core';
import { SocketAppModule } from './socket-app.module';
import { ValidationPipe } from '@nestjs/common';
import { createKafkaOptions } from '@app/global/utility/kafka/kafka.config';
import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
import { ConfigService } from '@nestjs/config';


async function bootstrap() {
  const app = await NestFactory.create(SocketAppModule);


  app.connectMicroservice(createKafkaOptions('socket-group'));
  
  await app.startAllMicroservices();
  // Enable CORS
  app.enableCors({
    origin: '*', // Be more specific for production environments
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
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