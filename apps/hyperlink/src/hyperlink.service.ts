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


  /**
   * Boot-time cleanup. The legacy index path keeps its HYPERLINK/ key without
   * a TTL and only deletes it on completion, so a restart mid-job would leave
   * the section locked for ever: those keys (no batchId) are wiped as before.
   * v2 batch keys (batchId + a live HYPERLINK-BATCH hash) are the progress
   * AND the lock of work that survives a restart in Bull, so they are kept;
   * a v2 key whose hash is gone is an orphan and is removed too.
   * Returns [deleted, kept].
   */
  async deleteAllRunningHyperlinkJobs(): Promise<[number, number]> {
    let deleted = 0, kept = 0;
    try {
      const keys: string[] = await this.redisDbService.scanKeys(`HYPERLINK/*`);
      for (const key of keys) {
        let parsed: any = null;
        try { parsed = JSON.parse(await this.redisDbService.getValue(key)); } catch (error) { parsed = null; }
        if (parsed && parsed.batchId && await this.redisDbService.hasKey(`HYPERLINK-BATCH/${parsed.batchId}`)) {
          kept++;
          continue;
        }
        await this.redisDbService.deleteValue(key);
        deleted++;
      }
      console.log(`Hyperlink startup: deleted ${deleted} legacy/orphan HYPERLINK/ key(s), kept ${kept} batch key(s)`);
    } catch (error) {
      console.log(`Failed to clean HYPERLINK/ keys`, error);
    }
    return [deleted, kept];
  }

}
