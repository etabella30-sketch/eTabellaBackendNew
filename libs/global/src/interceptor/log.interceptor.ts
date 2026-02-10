import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EventLogService } from '../utility/event-log/event-log.service';
import { logDataMdl } from '../interfaces/log.interface';
import { KafkaContext } from '@nestjs/microservices';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(
    private readonly logManageService: EventLogService,
    private readonly reflector: Reflector, // Use reflector to access metadata
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    debugger;

    /*if (context.getType() === 'rpc') {
      const kafkaContext = context.switchToRpc().getContext<KafkaContext>();
      const kafkaMessage = kafkaContext.getMessage();
      const { key, value } = kafkaMessage;

      // Extract metadata
      const apiId = this.reflector.get<number>('apiId', context.getHandler()) || 0;

      // Insert Kafka message log
      const logData: logDataMdl = {
        nLCatid: apiId,
        nMasterid: key || 0, // Use the message key as nMasterid if available
        jData: value // The Kafka message payload
      };

      this.logManageService.insertLog(logData)
        .catch(err => console.error('Error inserting Kafka message log:', err));

      return next.handle();
    }*/

    const request = context.switchToHttp().getRequest();
    const { method, originalUrl } = request;
    const userAgent = request.get('User-Agent') || '';

    // Get the API ID from metadata
    const apiId = this.reflector.get<number>('apiId', context.getHandler()) || 0;


    const reqObj = (['POST', 'PUT', 'DELETE', 'UPDATE'].includes(method) ? request.body : request.query)

    return next.handle().pipe(
      tap(async () => {
        // console.log('SET TO LOCAL',apiId)
        try {
          const mdl: logDataMdl = { nLCatid: apiId, nMasterid: reqObj.nMasterid, jData: reqObj };
          delete mdl.jData?.nMasterid;
          await this.logManageService.insertLog(mdl);
        } catch (error) {
          console.error('Error inserting log:', error);
          // Optionally handle log failure without breaking the main request-response cycle
        }
      }),
    );
  }
}
