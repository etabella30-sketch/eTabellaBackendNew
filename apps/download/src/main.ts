import { NestFactory } from '@nestjs/core';
import { DownloadModule } from './download.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { createKafkaOptions } from '@app/global/utility/kafka/kafka.config';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { HttpErrorFilter } from '@app/global/middleware/exception';

dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });

async function bootstrap() {
  const app = await NestFactory.create(DownloadModule);


  // Access the ConfigService from the app's container
  const configService = app.get(ConfigService);

  app.connectMicroservice(createKafkaOptions('download-group'));

  await app.startAllMicroservices();

  // console.log('GETTING CONFIG')
  // const kafkaHost = configService.get('KAFKA_HOST');
  // console.log('KAFKA HOST', kafkaHost)
  // const kafkaConfig = createKafkaOptions('downloadapi-group');
  // console.log('KAGKA CONFIG', kafkaConfig)
  // app.connectMicroservice(kafkaConfig);

  // await app.startAllMicroservices();

  app.use(cookieParser());

  // Enable CORS
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS')?.split(',') || ['*'];
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
    .addServer(process.env.NODE_ENV === 'production' ? '/download' : '')
    // .addTag('Alpha')
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


  await app.listen(configService.get('PORT_DOWNLOAD'));

}
bootstrap();
