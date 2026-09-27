import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RtDemoService } from '../../services/rt-demo/rt-demo.service';
import { RtDemoDocumentReq, RtDemoDocumentRes } from '../../interfaces/rt-demo.interface';

@ApiBearerAuth('JWT')
@ApiTags('rt-demo')
@Controller('rt-demo')
export class RtDemoController {

    constructor(private readonly rtDemo: RtDemoService) { }

    /** Opens a document link clicked in the RT Simulation, from the super-admin chosen source case. */
    @Get('document')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getDocument(@Query() query: RtDemoDocumentReq): Promise<RtDemoDocumentRes> {
        return await this.rtDemo.document(query);
    }
}
