import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { updatesReq } from '../../interfaces/case-tuple.interface';
import { CaseTupleService } from '../../services/case-tuple/case-tuple.service';

@ApiTags('case-tuple')
@Controller('case-tuple')
export class CaseTupleController {


    constructor(private readonly caseTupleService: CaseTupleService) {

    }

    @Post('updates')
    async insertCaseTuples(@Body() body: updatesReq): Promise<any> {
        return this.caseTupleService.createCaseTuples(body);
    }
}