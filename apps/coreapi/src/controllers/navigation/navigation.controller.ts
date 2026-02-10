import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { CheckNavigationReq, CheckNavigationRes, FactCompanyRes, FactListReq, FactListRes, FactCompParams, CompanyParams, filterReq, shareusers, AllListReq, AllLinkListReq } from '../../interfaces/navigation.interface';
import { NavigationService } from '../../services/navigation/navigation.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('JWT')
@ApiTags('navigation')
@Controller('navigation')
export class NavigationController {
    constructor(private readonly navigationService: NavigationService) {
    }

    @Get('checknavigationdata')
    @UsePipes(new ValidationPipe({ transform: true }))
    async checkNavigationData(@Query() query: CheckNavigationReq): Promise<CheckNavigationRes> {
        return await this.navigationService.checkNavigationData(query);
    }

    @Get('factlist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactlist(@Query() query: FactListReq): Promise<any> {
        return await this.navigationService.getFactlist(query);
    }

    @Get('factcompanylist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCompanylist(@Query() query: CompanyParams): Promise<FactCompanyRes[]> {
        return await this.navigationService.getCompanylist(query);
    }

    @Get('factbycompany')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactByCompany(@Query() query: FactCompParams): Promise<FactCompanyRes[]> {
        return await this.navigationService.getFactByCompany(query);
    }

    @Get('factlinklist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactlinks(@Query() query: FactListReq): Promise<FactCompanyRes[]> {
        return await this.navigationService.getFactlinks(query);
    }

    @Get('doclinks')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getDocLinks(@Query() query: FactListReq): Promise<FactCompanyRes[]> {
        return await this.navigationService.getDoclinks(query);
    }

    @Get('weblinks')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getWebLinks(@Query() query: FactListReq): Promise<FactCompanyRes[]> {
        return await this.navigationService.getWebLinks(query);
    }

    @Get('facttasks')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFacttasks(@Query() query: FactListReq): Promise<FactCompanyRes[]> {
        return await this.navigationService.getFacttasks(query);
    }

    @Get('filetasks')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFiletasks(@Query() query: FactListReq): Promise<FactCompanyRes[]> {
        return await this.navigationService.getFiletasks(query);
    }



    @Get('filter/incomming')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getIncommingDocs(@Query() query: filterReq): Promise<FactCompanyRes[]> {
        return await this.navigationService.getIncommingLinks(query);
    }

    @Get('filter/outgoing')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getoutgoingDocs(@Query() query: filterReq): Promise<FactCompanyRes[]> {
        return await this.navigationService.getOutgoingLinks(query);
    }


    @Get('filter/destination')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getdestinationDocs(@Query() query: filterReq): Promise<FactCompanyRes[]> {
        return await this.navigationService.getdestinationDocs(query);
    }



    @Get('filter/docinfo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getdocinfoDocs(@Query() query: filterReq): Promise<FactCompanyRes[]> {
        return await this.navigationService.getdocinfoDocs(query);
    }

    @Get('filter/webinfo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getwebInfoDocs(@Query() query: filterReq): Promise<FactCompanyRes[]> {
        return await this.navigationService.getwebInfoDocs(query);
    }

    @Get('sharedusers')
    @UsePipes(new ValidationPipe({ transform: true }))
    async sharedusers(@Query() query: shareusers): Promise<FactCompanyRes[]> {
        return await this.navigationService.getShareds(query);
    }
    @Get('all')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getAll(@Query() query: AllListReq): Promise<any> {
        return await this.navigationService.getAll(query);
    }

     @Get('alllinks/list')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getAllLinks(@Query() query: AllLinkListReq): Promise<any> {
        return await this.navigationService.getAllLinks(query);
    }
}
