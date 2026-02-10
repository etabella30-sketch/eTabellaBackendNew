// custom-processor.decorator.ts
// import { SetMetadata } from '@nestjs/common';

// export const PROCESSOR_KEY = 'PROCESSOR_KEY';
// export const CustomProcessor = (processorName: string) => SetMetadata(PROCESSOR_KEY, processorName);




// custom-processor.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PROCESSOR_KEY = 'PROCESSOR_KEY';
export const CustomProcessor = (processorName: string) => {
  return (target: any) => {
    SetMetadata(PROCESSOR_KEY, processorName)(target);
    // Ensure metadata is attached to both the constructor and prototype
    Reflect.defineMetadata(PROCESSOR_KEY, processorName, target);
    Reflect.defineMetadata(PROCESSOR_KEY, processorName, target.prototype);
    return target;
  };
};