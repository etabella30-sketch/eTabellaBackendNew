import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TagService } from '../../services/tag/tag.service';
import { TagCreateReq, TagCreateRes, TagReq } from '../../interfaces/tag.interface';

@ApiBearerAuth('JWT')
@ApiTags('tag')
@Controller('tag')
export class TagController {


    constructor(private readonly tagService: TagService) {
    }

    @Post('tagBuilder')
    async tagBuilder(@Body() body: TagCreateReq): Promise<TagCreateRes> {
        const res = await this.tagService.tagBuilder(body);
        return res;
    }

    @Get('taglist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async taglist(@Query() query: TagReq): Promise<any> {
        return await this.tagService.taglist(query);
    }
}
