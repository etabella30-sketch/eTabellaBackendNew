import { NestFactory } from '@nestjs/core';
import { HyperlinkModule } from './hyperlink.module';
import { ValidationPipe } from '@nestjs/common';
import { createKafkaOptions } from '@app/global/utility/kafka/kafka.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });


async function bootstrap() {
  const app = await NestFactory.create(HyperlinkModule);

  app.connectMicroservice(createKafkaOptions('hyperlink-group'));

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
    .setTitle('Etabella Core API')
    .setDescription('API description')
    .setVersion('1.0')
    .addServer(process.env.NODE_ENV === 'production' ? '/hyperlink' : '')
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
  await app.listen(process.env.PORT_HYPERLINK);
}
bootstrap();
