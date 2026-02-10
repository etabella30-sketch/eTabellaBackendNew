import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class HyperlinkService {

  public tempChunkPath = './assets/upload-chunks';
  public docPath = 'doc';
  public backupDocPath = this.config.get('COPY_PATH');
  public redisKey = 'chunk/';


  constructor(
    // @Inject('KAFKA_SERVICE') private readonly clientKafka: ClientKafka,
   private config: ConfigService, private readonly redisDbService: RedisDbService) { }
  getHello(): string {
    return 'Hello World!';
  }


  async onModuleInit() {
    // await this.clientKafka.connect();
    this.deleteAllRunningHyperlinkJobs()

  }


  async deleteAllRunningHyperlinkJobs() {
    this.redisDbService.deleteAllWithPrefix(`HYPERLINK/`)
  }

}
