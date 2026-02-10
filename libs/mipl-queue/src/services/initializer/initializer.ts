import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { parentPort, isMainThread, workerData } from 'worker_threads';
import Redis from 'ioredis';

@Injectable()
export class MiplQueueInitializer implements OnModuleInit {

  private readonly logger = new Logger('worker');
  private redis: Redis;
  checkInterValForTasks: any;

  onModuleInit() {
    if (!isMainThread) {
      this.logger.warn(`MODULE INITED ${workerData?.processorName}`);
    }
    
    // this.redis = new Redis({
    //   host: '192.168.0.105',
    //   port: 6379,
    //   password: 'admin@123',
    //   retryStrategy(times) {
    //     const delay = Math.min(times * 1000, 5000);
    //     console.log(`Retrying Redis connection in ${delay}ms...`);
    //     return delay;
    //   }
    // });

    try {
      // process.on('TASK',(e)=>{
      //     console.log(e)
      // })
      // this.checkInterValForTasks = setInterval(() => {
      //   // console.log('CHECKED FOR WORKER TASK')
      // }, 1000);

      // const checker = async (data): Promise<boolean> => {
      //   await this.delay(1000);
      //   // console.log('CHECKED FOR WORKER TASK')
      //   checker({ msg: 1 });
      //   return true;
      // }


      // checker({ msg: 1 });
    } catch (error) {

    }
  }




  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}