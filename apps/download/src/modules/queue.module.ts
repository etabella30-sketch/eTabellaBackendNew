import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from '@app/global/modules/kafka.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        redis: {
          port: Number(config.get('REDIS_PORT')),
          host: config.get('REDIS_IP'),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'download-queue',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
    BullModule.registerQueue({
      name: 'index-generation',
      limiter: {
        max: 1, // Only process one job at a time to avoid memory issues
        duration: 25000
      },
      settings: {
        // Important: Keep resources isolated
        maxStalledCount: 1,
        stalledInterval: 120000,
        // Retry settings are important for recovery from memory issues
        backoffStrategies: {
          memory: (attemptsMade) => {
            return attemptsMade * 10000; // Increasing backoff for memory issues
          }
        }
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 1,
        timeout: 600000, // 10 minutes timeout
        backoff: {
          type: 'exponential',
          delay: 10000, // Start with 10 seconds delay
        },
      },
    }),
  ],
  exports: [BullModule], // Export BullModule to make it available in other modules
})
export class QueueModule { }
