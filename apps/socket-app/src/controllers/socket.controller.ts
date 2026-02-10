import { Controller } from '@nestjs/common';
import { UploadService } from '../services/upload/upload.service';
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
import { IndexService } from '../services/index/index.service';
import { UsersService } from '../services/users/users.service';
import { PaginationService } from '../services/pagination/pagination.service';
import { BatchfileService } from '../services/batchfile/batchfile.service';
import { ExportService } from '../services/export/export.service';
import { RealtimeService } from '../services/realtime/realtime.service';
@Controller()
export class SocketController {

  constructor(private readonly upload: UploadService, private readonly index: IndexService, private user: UsersService, private readonly pagination: PaginationService,
    private readonly batchfile: BatchfileService, private readonly fileexport: ExportService, private readonly realtime: RealtimeService) { }




  @MessagePattern('upload-response')
  handeAuth2(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for upload-response: `, message);
    // handle notification
    this.upload.emitMsg(message);
  }

  @MessagePattern('EXPORT-EXCEL-RESPONCE')
  handleExportExcel(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for EXPORT-EXCEL-RESPONCE: `, message);
    // handle notification
    this.upload.emitMsg(message, 'EXPORT-EXCEL-RESPONCE');
  }


  @MessagePattern('index-response')
  handeAuth3(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for index-response: `, message);
    // handle notification
    this.index.emitMsg(message);
  }




  @MessagePattern('LOGIN-VERIFY')
  onUserVerify(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for index-response: `, message);
    // handle notification
    this.user.emitMsg(message);
  }
  @MessagePattern('pagination-response')
  handeAuth4(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for pagination-response: `, message);
    // handle notification
    this.pagination.emitMsg(message);
  }


  @MessagePattern('batchfile-response')
  handeAuth5(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for batchfile-response: `, message);
    // handle notification
    this.batchfile.emitMsg(message);
  }


  @MessagePattern('export-response')
  handeAuth6(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for export-response: `, message);
    // handle notification
    this.fileexport.emitMsg(message);
  }

  @MessagePattern('hyperlink-response')
  handleHyperlink(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for hyperlink-response: `, message);
    // handle notification
    this.upload.emitMsg(message, 'hyperlink-response');
  }

  @MessagePattern('realtime-response')
  realtimelink(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for realtime-response: `, message);
    // handle notification
    this.realtime.emitMsg(message);
  }

  @MessagePattern('download-message')
  downloadMessages(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for upload-response: `, message);
    // handle notification
    this.upload.emitMsg(message, 'download-message');
  }



  @MessagePattern('factsheet-comments')
  factCommentMsg(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for factsheet-comments: `, message);
    // handle notification
    this.realtime.emitCommentMsg(message);
  }

}
