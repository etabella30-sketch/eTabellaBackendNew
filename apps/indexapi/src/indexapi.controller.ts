import { Controller } from '@nestjs/common';
import { IndexapiService } from './indexapi.service';

@Controller('index')
export class IndexapiController {
    constructor(private readonly indexService: IndexapiService) { }


}
