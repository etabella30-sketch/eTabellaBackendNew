import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { createKafkaOptions } from '@app/global/utility/kafka/kafka.config';
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
import { ConfigService } from '@nestjs/config';
import { IndexModule } from './indexapi.module';


async function bootstrap() {
  const app = await NestFactory.create(IndexModule);

  app.connectMicroservice(createKafkaOptions('indexapi-group'));

  await app.startAllMicroservices();

  app.use(cookieParser());

  // Enable CORS
  const allowedOrigins = app.get(ConfigService).get<string>('ALLOWED_ORIGINS')?.split(',') || ['*'];
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  // Enable compression middleware
  app.use(compression());

  const config = new DocumentBuilder()
    .setTitle('Etabella Indexing API')
    .setDescription('API description')
    .setVersion('1.0')
    .addServer(process.env.NODE_ENV === 'production' ? '/indexapi' : '')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT', // This is the name used to reference the Security Scheme in the Swagger UI.
    )
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



  try {
    // Add process listeners for unexpected errors
    process.on('uncaughtException', (error) => {
      console.log(`Uncaught Exception: ${error.message}`, error.stack, 'Bootstrap');
      // Optionally, perform cleanup or send alerts
      process.exit(1); // Exit the process to avoid undefined behavior
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.log(
        `Unhandled Rejection: ${reason}`,
        `Promise: ${promise}`,
        'Bootstrap',
      );
      // Optionally log or handle the rejection
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Cleaning up...');
      // Perform necessary cleanup and shut down the app
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      // Perform necessary cleanup and shut down the app
      process.exit(0);
    });

  } catch (error) {
    console.log(error);
  }




  await app.listen(configService.get('PORT_INDEXINGAPI'));
}
bootstrap();
