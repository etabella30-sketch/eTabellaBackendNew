import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MarknavService } from '../../services/marknav/marknav.service';
import { AllListReq, CompanyParams, DocListReq, FactCompParams, FactLinkListReq, FactListReq, quickMarkParams } from '../../interfaces/marknav.interface';

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
        return await this.markNavService.getDoclinks(query);
    }
}
