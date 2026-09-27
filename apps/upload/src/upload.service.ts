import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UPLOAD_CHUNK_ROOT } from './utility/upload-paths';
// import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class UploadService implements OnModuleInit {


  public tempChunkPath = UPLOAD_CHUNK_ROOT;
  public docPath = 'doc';
  public backupDocPath = this.config.get('COPY_PATH');
  public redisKey = 'chunk/';
  getHello(): string {
    return 'Hello World!';
  }



  constructor(
    // @Inject('KAFKA_SERVICE') private readonly clientKafka: ClientKafka, 
    private config: ConfigService) { }

  async onModuleInit() {
    // await this.clientKafka.connect();
  }

}
