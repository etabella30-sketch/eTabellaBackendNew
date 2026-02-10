import { Injectable, OnModuleInit } from '@nestjs/common';
import { SessionbuilderService } from './services/sessionbuilder/sessionbuilder.service';
import { SqllitedbService } from './services/sqllitedb/sqllitedb.service';

@Injectable()
export class RealtimeService implements OnModuleInit {

  constructor(private sessionBuilderService: SessionbuilderService, private readonly dbLite: SqllitedbService) {

  }

  getHello(): string {
    return 'Hello World!';
  }

  async onModuleInit() {
    this.sessionBuilderService.syncUsers();

    // for (let i = 0; i < 50; i++) {
    //   const nm = Number(process.hrtime.bigint().toString());
    //   console.log('TIME ', Number(nm), typeof Number(nm), ' BY DATE ', new Date().getTime())
    // }


  }




  



}