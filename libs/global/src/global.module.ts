import { Module } from '@nestjs/common';
import { GlobalService } from './global.service';
import { ConfigModule } from '@nestjs/config';
import { SchedulerService } from './utility/scheduler/scheduler.service';
@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: `.env.${process.env.NODE_ENV}`,
    ignoreEnvFile: process.env.NODE_ENV === 'production', // Optionally ignore .env file in production
  })],
  providers: [GlobalService, SchedulerService],
  exports: [GlobalService],
})
export class GlobalModule { }
