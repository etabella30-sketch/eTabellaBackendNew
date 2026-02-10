import { Module } from '@nestjs/common';
import { MiplQueueService } from './mipl-queue.service';
import { ProcessorDiscoveryService } from './services/processor-discovery/processor-discovery.service';
import { MiplQueueInitializer } from './services/initializer/initializer';

@Module({
  providers: [MiplQueueService,ProcessorDiscoveryService,MiplQueueInitializer],
  exports: [MiplQueueService,ProcessorDiscoveryService,MiplQueueInitializer],
})
export class MiplQueueModule {}
