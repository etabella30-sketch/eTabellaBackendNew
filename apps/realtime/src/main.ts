import { NestFactory } from '@nestjs/core';
import { RealtimeModule } from './realtime.module';
import * as compression from 'compression';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CrashLoggingFilter } from '@app/global/utility/crash-log/crash-logging.filter';
import * as fs from 'fs';



async function bootstrap() {
  const app = await NestFactory.create(RealtimeModule);

  // Enable CORS
  app.enableCors({
    origin: '*', // Be more specific for production environments
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  // Enable compression middleware
  app.use(compression());
  const config = new DocumentBuilder()
    .setTitle('Etabella Realtime API')
    .setDescription('API description')
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

  // Apply global exception filters
      app.useGlobalFilters(new HttpErrorFilter(), new CrashLoggingFilter());

  // Access the ConfigService from the app's container
  const configService = app.get(ConfigService);


  try {

    // const logService = app.get(LogService); // Inject LogService

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception E:', err);
      // logService.error(`[Uncaught Exception] ${err.message}\nStack: ${err.stack || 'N/A'}\n\n`, 'appcrash')
      // Optionally exit the process
      const logMessage = `[${new Date().toISOString()}] [Uncaught Exception] ${err.message}\nStack: ${err.stack || 'N/A'}\n\n`;
      fs.appendFileSync('app-crash.log', logMessage);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection E:', reason);
      // logService.error(`[Unhandled Rejection]  ${reason}\n\n`, 'appcrash')
      const logMessage = `[${new Date().toISOString()}] [Unhandled Rejection] ${reason}\n\n`;
      fs.appendFileSync('app-crash.log', logMessage);
    });
  } catch (error) {
    console.log('ERROR while logging exit', error)
  }





  await app.listen(configService.get('PORT_REALTIMEAPI'));
}
bootstrap();
