import { DbService } from '@app/global/db/pg/db.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SessionJobService {
    private readonly logger = new Logger(SessionJobService.name);



    constructor(private readonly db: DbService) {

    }

    // Runs every hour
    @Cron(CronExpression.EVERY_HOUR)
    handleHourlyTask() {
        this.logger.debug('Running hourly task...');

        // Your task logic here
        this.performTask();
    }

    private performTask() {
        // Example task: simulate some processing
        this.logger.log('Performing the scheduled task! ✅');




        // You can add database queries, API calls, cleanups, etc.
    }



//   async  getCompletedSessions():Promise<{nSesid:string,}[]> {

//     }

}
