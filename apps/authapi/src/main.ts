import { NestFactory } from '@nestjs/core';
import { AuthapiModule } from './authapi.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { createKafkaOptions } from '@app/global/utility/kafka/kafka.config';
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // const app = await NestFactory.create(AuthapiModule);
  // await app.listen(3000);


  const app = await NestFactory.create(AuthapiModule);


  app.connectMicroservice(createKafkaOptions('auth-group'));
  await app.startAllMicroservices();

  app.use(cookieParser());

  // Enable CORS
  const configService = app.get(ConfigService);
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') || ['*'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Etabella Auth API')
    .setDescription('API description')
    .setVersion('1.0')
    .addServer(process.env.NODE_ENV === 'production' ? '/authapi' : '')
    // .addServer('/authapi')
    // .addTag('Alpha')
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


  await app.listen(configService.get('PORT_AUTHAPI'));

}
bootstrap();
