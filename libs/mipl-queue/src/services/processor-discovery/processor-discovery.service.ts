import { Injectable, Type } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { PROCESSOR_KEY } from '../../decorator/custom-processor.decorator';

@Injectable()
export class ProcessorDiscoveryService {
  constructor(private readonly modulesContainer: ModulesContainer) {}

  findProcessor(processorName: string): Type<any> | undefined {
    try {
      for (const [_, module] of this.modulesContainer.entries()) {
        for (const [key, wrapper] of module.providers.entries()) {
          // Check if the provider is named like a processor
          // if (typeof key === 'string' && key.includes('Processor')) {
          let ks:any = key;
          if (ks?.name?.includes('Processor')) {
            const instance = wrapper.instance;
            // Check if this is the processor we're looking for
            if (instance && this.isMatchingProcessor(instance, processorName)) {
              return wrapper.metatype as Type<any>;
            }
          }
        }
      }
    } catch (error) {
      
    }

    return undefined;
  }


  private isMatchingProcessor(instance: any, processorName: string): boolean {
    // First try to get metadata from the constructor
    const metadata = Reflect.getMetadata(PROCESSOR_KEY, instance.constructor);
    if (metadata === processorName) {
      return true;
    }

    // Fallback to checking the prototype
    const prototype = Object.getPrototypeOf(instance);
    return Reflect.getMetadata(PROCESSOR_KEY, prototype.constructor) === processorName;
  }
}