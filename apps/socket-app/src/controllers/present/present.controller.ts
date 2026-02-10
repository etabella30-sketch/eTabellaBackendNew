import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
import { PresentService } from '../../services/present/present.service';

@Controller('present')
export class PresentController {

  constructor(private readonly present:PresentService){

  }
  @MessagePattern('presentation')
  handlePresentations(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for presentation: `, message);
    this.present.emitPresent(message);
  }


  @MessagePattern('presentation-tools')
  handlePresentationTools(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for presentation-tools: `, message);
    this.present.emitPresentTools(message);
  }


  @MessagePattern('present-highlights')
  handlePresentationHighlights(@Payload() message: any, @Ctx() context: KafkaContext) {
    console.log(`Received message for present-highlights: `, message);
    this.present.emitHighlight(message);
  }

}
