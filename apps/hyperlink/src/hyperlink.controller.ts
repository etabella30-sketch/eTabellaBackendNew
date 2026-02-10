import { Body, Controller, Get, Post, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { HyperlinkService } from './hyperlink.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GeneratehyperlinkService } from './services/generatehyperlink/generatehyperlink.service';
import { gethyperlinkReq, hyperlinkReq } from './interfaces/hyperlink.interface';
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';

@ApiBearerAuth('JWT')
@ApiTags('hyperlink')
@Controller()
export class HyperlinkController {
  constructor(private readonly hyperlinkService: HyperlinkService,private genHyper:GeneratehyperlinkService) {}

  @Post('starthyperlink')
  @UseInterceptors(LogInterceptor)
  @ApiId(24)
  async hyperlinkFiles(@Body() body: hyperlinkReq): Promise<any> {
      return await this.genHyper.starthyperlink(body,false,body.isDeepscan || false); //body.isDeep
  }


  @MessagePattern('hyperlink-index-responce')
  handeAuth2(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for Index responce: `, message);
    if(message.data){
      this.genHyper.starthyperlink(message.data,true);
    }
  }


  @Post('indexhyperlink')
  @UseInterceptors(LogInterceptor)
  @ApiId(24)
  async indexHyperlink(@Body() body: hyperlinkReq): Promise<any> {
      return await this.genHyper.starthyperlink(body,true);
  }




  @Post('deephyperlink')
  @UseInterceptors(LogInterceptor)
  @ApiId(24)
  async deepHyperlink(@Body() body: hyperlinkReq): Promise<any> {
      return await this.genHyper.starthyperlink(body,false,true);
  }


  @Get('hyperlinks')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getCaseList(@Query() query: gethyperlinkReq): Promise<any> {
      return await this.genHyper.getHyperLinkProgress(query);
  }




}
