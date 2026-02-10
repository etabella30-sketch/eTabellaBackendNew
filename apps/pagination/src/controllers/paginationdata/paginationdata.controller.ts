import { Body, Controller, Get, Post, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaginationdataService } from '../../services/paginationdata/paginationdata.service';
import { getpaginationReq, getpaginationRes, paginationFileReq, paginationReq, paginationRes, stoppaginationReq } from '../../interfaces/pagination/pagination.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';


@ApiBearerAuth('JWT')
@ApiTags('paginationdata')
@Controller('paginationdata')
export class PaginationdataController {

    constructor(private paginationService: PaginationdataService) {

    }


    @Get('getpagination')
    async getPagination(@Query() query: getpaginationReq): Promise<getpaginationRes> {
        return await this.paginationService.getPagination(query);
    }

    @Post('pagination')
    // @UseInterceptors(LogInterceptor)
    // @ApiId(25)
    async generatePagination(@Body() body: paginationReq): Promise<paginationRes> {
        return await this.paginationService.getPaginationData(body);
    }

    @Post('paginationNonPaginated')
    // @UseInterceptors(LogInterceptor)
    // @ApiId(25)
    async genPaginationFile(@Body() body: paginationFileReq): Promise<paginationRes> {
        return await this.paginationService.getNonpaginatedData(body);
    }

    @Post('stoppagination')
    async stopPagination(@Body() body: stoppaginationReq): Promise<paginationRes> {
        return await this.paginationService.stopPaginationData(body);
    }
}


