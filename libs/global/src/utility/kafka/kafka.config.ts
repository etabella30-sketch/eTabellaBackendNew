// kafka-config.factory.ts
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

export function createKafkaOptions(groupId: string): MicroserviceOptions {
  const brokers = [ process.env.KAFKA_HOST || '103.253.145.78:9092']; // Update with comserver external IP
  console.log('Kafka brokers:', brokers);
  
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: brokers,
      },
      consumer: {
        groupId: groupId,
      },
      producer: {
        allowAutoTopicCreation: true,
        retry: {
          initialRetryTime: 300,
          retries: 10,
        },
      },
    },
  };
}
