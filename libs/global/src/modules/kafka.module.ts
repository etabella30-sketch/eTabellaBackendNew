import { Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport, ClientsModuleOptions } from '@nestjs/microservices';
import { KafkaGlobalService } from '../utility/kafka/kafka.shared.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule], // Import ConfigModule to use ConfigService
})
export class KafkaModule {
  static register(clientId: string, groupId: string): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name: 'KAFKA_SERVICE',
            useFactory: async (configService: ConfigService) => ({
              transport: Transport.KAFKA,
              options: {
                client: {
                  clientId: clientId,
                  brokers: [configService.get<string>('KAFKA_HOST')], // Get broker address from ConfigService
                },
                consumer: {
                  groupId: groupId,
                },
                producer: {
                  // ← this flag tells KafkaJS to auto-create topics when you first produce to them
                  allowAutoTopicCreation: true,
                  retry: {
                    initialRetryTime: 300,
                    retries: 10,
                  }
                },
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
      providers: [KafkaGlobalService],
      exports: [ClientsModule, KafkaGlobalService], // Export ClientsModule so it can be used in other modules
    };
  }
}
