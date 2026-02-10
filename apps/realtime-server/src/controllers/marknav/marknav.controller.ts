import { Body, Controller, Delete, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MarknavService } from '../../services/marknav/marknav.service';
import { AllListReq, CompanyParams, DocListReq, FactCompParams, FactLinkListReq, FactListReq, HistoryDeleteReq, HistoryExistReq, HistoryInsertReq, MarknavUserlistReq, MarknavUserlistRes, quickMarkParams } from '../../interfaces/marknav.interface';

@ApiTags('Marknav')
@Controller('marknav')
export class MarknavController {


    constructor(
        private markNavService: MarknavService
    ) { }

    @Get('all')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getAll(@Query() query: AllListReq): Promise<any> {

        return this.markNavService.getAll(query);
    }

    @Get('factlist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactlist(@Query() query: FactListReq): Promise<any> {
        return this.markNavService.getFactlist(query);
    }

    @Get('factcompanylist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCompanylist(@Query() query: CompanyParams): Promise<any> {
        return this.markNavService.getCompanylist(query);
    }

    @Get('factbycompany')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactByCompany(@Query() query: FactCompParams): Promise<any> {
        return this.markNavService.getFactByCompany(query);
    }

    @Get('factlinklist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactlinks(@Query() query: FactLinkListReq): Promise<any> {
        return this.markNavService.getFactlinks(query);
    }

    @Get('quickmarklist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getQuickMarks(@Query() query: quickMarkParams): Promise<any> {
        return this.markNavService.getQuickMarks(query);
    }

    @Get('doclinks')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getDocLinks(@Query() query: DocListReq): Promise<any> {
        return this.markNavService.getDoclinks(query);
    }


    @Post('history/insert')
    async insertHistory(@Body() body: HistoryInsertReq): Promise<any> {
        return this.markNavService.insertHistory(body);
    }

    @Delete('history/delete')
    async deleteHistory(@Query() query: HistoryDeleteReq): Promise<any> {
        return this.markNavService.deleteHistory(query);
    }

    @Get('history/exist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getHistoryExist(@Query() query: HistoryExistReq): Promise<any> {
        return this.markNavService.getHistoryExist(query);
    }

    // @GEt('history/insert')
    // async deleteHighlights(@Body() body: deleteHighlightsRequestBody): Promise<any> {
    //     return this.factservice.deleteHighlights(body, 'D');
    // }


    @Get('marknavteamusers')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getMarknavTeamUsers(@Query() query: MarknavUserlistReq): Promise<MarknavUserlistRes[]> {
        console.log("alok query", query);
        return await this.markNavService.getMarknavTeamUsers(query);
    }

}
