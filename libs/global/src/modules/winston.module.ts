import { DynamicModule, Module } from '@nestjs/common';
import { WinstonModule as NestWinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

@Module({})
export class WinstonConfigModule {
  static forRoot(appName: string): DynamicModule {
    const logDir = path.join('logs', appName);

    // Ensure the initial directory exists
    fs.mkdirSync(logDir, { recursive: true });

    return {
      module: WinstonConfigModule,
      imports: [
        NestWinstonModule.forRoot({
          transports: [
            new winston.transports.Console({
              level: 'info',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
              )
            })
          ],
        }),
      ],
      exports: [NestWinstonModule],
    };
  }
}
