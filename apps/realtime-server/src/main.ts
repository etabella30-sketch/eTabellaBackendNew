import { NestFactory } from '@nestjs/core';
import { RealtimeServerModule } from './realtime-server.module';
import * as compression from 'compression';
import * as dotenv from 'dotenv';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpErrorFilter } from '@app/global/middleware/exception';
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
import { ConfigService } from '@nestjs/config';
import { createKafkaOptions } from '@app/global/utility/kafka/kafka.config';
import * as bodyParser from 'body-parser';


async function bootstrap() {
  const app = await NestFactory.create(RealtimeServerModule);
  // Increase the JSON payload size limit
  app.use(bodyParser.json({ limit: '50mb' })); // Set the limit according to your needs
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // For URL-encoded bodies

  app.connectMicroservice(createKafkaOptions('realtime-group'));
  
  await app.startAllMicroservices();
  // Enable CORS
  app.enableCors({
    origin: '*', // Be more specific for production environments
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
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