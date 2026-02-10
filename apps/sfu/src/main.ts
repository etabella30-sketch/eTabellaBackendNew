import { NestFactory } from '@nestjs/core';
import { SfuModule } from './sfu.module';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createKafkaOptions } from '@app/global/utility/kafka/kafka.config';
import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
  const app = await NestFactory.create(SfuModule);
  // app.connectMicroservice(createKafkaOptions('presentation-group'));
  // await app.startAllMicroservices();

  // Enable CORS
  app.enableCors({
    origin: '*', // Be more specific for production environments
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.use(compression());

  const config = new DocumentBuilder()
    .setTitle('Etabella SFU API')
    .setDescription('API description')
    .setVersion('1.0')
    .addServer(process.env.NODE_ENV === 'production' ? '/presentation' : '')
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
  await app.listen(configService.get('PORT_SFU'));
}
bootstrap();
