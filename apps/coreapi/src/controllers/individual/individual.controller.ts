import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IndividualService } from '../../services/individual/individual.service';
import { DocinfoReq, DocinfoRes, fetchTabDataReq, getTabReq, hyperlinkFileReq, linkexplorerReq, locationShareToUsers, toolbarDataReq, updateBundleDetailRotation, updateShareLink } from '../../interfaces/individual.interface';

@ApiBearerAuth('JWT')
@ApiTags('individual')
@Controller('individual')
export class IndividualController {
    constructor(private readonly individualService: IndividualService) {
    }


    @Get('tabinfo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCaseDetail(@Query() query: fetchTabDataReq): Promise<any> {
        return await this.individualService.getTabData(query);
    }





    @Get('gettab')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getfetchtab(@Query() query: getTabReq): Promise<any> {
        return await this.individualService.getTab(query);
    }


    @Get('getDocinfo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getDocinfo(@Query() query: DocinfoReq): Promise<DocinfoRes> {
        return await this.individualService.getDocinfo(query);
    }





    @Get('globannots')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getglobalannotas(@Query() query: DocinfoReq): Promise<DocinfoRes> {
        return await this.individualService.getglobalannotas(query);
    }


    @Post('updaterotation')
    async updateRotation(@Body() body: updateBundleDetailRotation): Promise<any> {
        return await this.individualService.updateRotation(body);
    }


    @Get('incomming/factlinks')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getIncommingFactLinks(@Query() query: linkexplorerReq): Promise<DocinfoRes> {
        return await this.individualService.getLinks(query, 'linkexplorer_incomming_factlinks');
    }

    @Get('incomming/doclinks')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getIncommingDocLink(@Query() query: linkexplorerReq): Promise<DocinfoRes> {
        return await this.individualService.getLinks(query, 'linkexplorer_incomming_doclinks');
    }



    @Get('outgoing/factlinks')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getOutgoingFactLinks(@Query() query: linkexplorerReq): Promise<DocinfoRes> {
        return await this.individualService.getLinks(query, 'linkexplorer_outgoing_factlinks');
    }

    @Get('outgoing/doclinks')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getOutgoingDocLink(@Query() query: linkexplorerReq): Promise<DocinfoRes> {
        return await this.individualService.getLinks(query, 'linkexplorer_outgoing_doclinks');
    }


    @Post('updatesharelink')
    async updateShareLink(@Body() body: updateShareLink): Promise<any> {
        return await this.individualService.updateShareLink(body);
    }


    @Post('locationshare/sharetousers')
    async locationshareSharetousers(@Body() body: locationShareToUsers): Promise<any> {
        return await this.individualService.locationshareSharetousers(body);
    }


    @Get('locationshare/sharedusers')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSharesUsers(@Query() query: linkexplorerReq): Promise<DocinfoRes> {
        return await this.individualService.getSharesUsers(query);
    }

    @Get('gethyperlinkfile')
    @UsePipes(new ValidationPipe({ transform: true }))
    async gethyperlinkfile(@Query() query: hyperlinkFileReq): Promise<any> {
        return await this.individualService.getHyperLinkFiles(query);
    }


    @Get('toolbar/data')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getToolbarData(@Query() query: toolbarDataReq): Promise<any> {
        return await this.individualService.getToolbarData(query);
    }
}
