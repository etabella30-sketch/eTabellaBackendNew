import { NestFactory } from '@nestjs/core';
import { CoreapiModule } from './coreapi.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { createKafkaOptions } from '@app/global/utility/kafka/kafka.config';
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';



async function bootstrap() {
  const app = await NestFactory.create(CoreapiModule);

  app.connectMicroservice(createKafkaOptions('coreapi-group'));

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

  // Increase the JSON payload limit
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  // Enable compression middleware
  app.use(compression());

  const config = new DocumentBuilder()
    .setTitle('Etabella Core API')
    .setDescription('API description')
    .setVersion('1.0')
    // .addTag('Alpha')
    .addServer(process.env.NODE_ENV === 'production' ? '/coreapi' : '')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT', // This is the name used to reference the Security Scheme in the Swagger UI.
    )
    .build();

  // Add the `/authapi` prefix in Swagger only for production environment
  if (process.env.NODE_ENV === 'production') {
    console.log('PRODUCTION MODE')
    // config.addServer('/authapi');
  }
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
  
  await app.listen(configService.get('PORT_COREAPI'));
}
bootstrap();
