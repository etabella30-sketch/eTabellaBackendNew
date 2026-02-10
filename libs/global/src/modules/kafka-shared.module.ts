import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaGlobalService } from '../utility/kafka/kafka.shared.service';
import { BullAdminModule } from './bull-admin/bull-admin.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // ClientsModule.register([
    //   {
    //     name: 'KAFKA_SERVICE',
    //     transport: Transport.KAFKA,
    //     options: {},
    //   },
    // ]),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule], // Import ConfigModule to use ConfigService
        inject: [ConfigService], // Inject ConfigService
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              brokers: [configService.get('KAFKA_HOST') || 'localhost:9092'], // Use environment variable
            },
            // consumer: {
            //   groupId: configService.get('KAFKA_GROUP_ID') || 'default-group', // Use environment variable
            // },
          },
        }),
      },
    ]),
    BullAdminModule,
  ],
  providers: [KafkaGlobalService],
  exports: [ClientsModule, KafkaGlobalService]
})
export class KafkaSharedModule { }
