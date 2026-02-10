import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CaseactivityService } from '../../services/caseactivity/caseactivity.service';
import { CaseLSReq, ConnectionsReq, dwdpathReq, ScanPaginationReq, UserLlogReq, UserLSReq } from '../../interfaces/caseactivity.interface';
import { query } from 'express';

@ApiBearerAuth('JWT')
@ApiTags('caseactivity')
@Controller('caseactivity')
export class CaseactivityController {

    constructor(private caseactivityService: CaseactivityService) { }

    @Get('getcasels')
    async getCasels(@Query() Query: CaseLSReq): Promise<any> {
        return this.caseactivityService.getCasels(Query);
    }

    @Get('getuserls')
    async getUserls(@Query() Query: UserLSReq): Promise<any> {
        return this.caseactivityService.getUserls(Query);
    }


    @Get('getuserlog')
    async getUserlog(@Query() Query: UserLlogReq): Promise<any> {
        return this.caseactivityService.getUserLog(Query);
    }

    @Get('getsessionls')
    async getSessionls(@Query() Query: UserLSReq): Promise<any> {
        return this.caseactivityService.getSessionls(Query);
    }


    @Get('getConnections')
    async getConnections(@Query() Query: ConnectionsReq): Promise<any> {
        return this.caseactivityService.getConnections(Query);
    }


    @Get('getBundledata')
    async getBundledata(@Query() Query: UserLSReq): Promise<any> {
        return this.caseactivityService.getBundledata(Query);
    }

    @Get('getScandata')
    async getScandata(@Query() Query: UserLSReq): Promise<any> {
        return this.caseactivityService.getScandata(Query);
    }

    @Get('getStoragedata')
    async getStorageSize(@Query() Query: UserLSReq): Promise<any> {
        return this.caseactivityService.getStorageSize(Query);
    }

    @Get('scan_paginate')
    async getScan_paginate(@Query() query: ScanPaginationReq): Promise<any> {
        return await this.caseactivityService.getScan_paginate(query);
    }

    @Get('downlaodscan_paginate')
    async downlaodscan_paginate(@Query() query: ScanPaginationReq): Promise<any> {
        return await this.caseactivityService.downlaodscan_paginate(query);
    }


    @Get('download')
    async downloadFile(@Query() query: dwdpathReq, @Res() res: Response) {
        return await this.caseactivityService.downloadFile(query, res);
    }

}
