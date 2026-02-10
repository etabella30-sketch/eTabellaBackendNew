import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SetupService } from '../../services/setup/setup.service';
import { CaseDetailRes, caseDetailsReq, ContactDetailRes, contactListReq, fileUpdateReq, fileUpdateRes, getValueReq, insertReq, insertRes, ongoinglistReq, OngoingListRes, PresentationReq, PresentationSetUpClearScheduleReq, PresentationSetUpClearScheduleRes, PresentationSetUpDetailReq, PresentationSetUpFilesReq, recentFilesidsReq, recentFilesReq, runningPresentationReq, scheduleDeleteReq, ScheduleDeleteRes, scheduleListReq, ScheduleListRes, setValueReq, setValueRes, StatusUpdateReq, StatusUpdateRes, subTypesReq, TeamReq, TypeRes, TypesReq } from '../../interfaces/setup/setup.interface';

@ApiBearerAuth('JWT')
@ApiTags('Setup')
@Controller('present/setup')
export class SetupController {

    constructor(private setupservice: SetupService) {

    }

    @Get('getsetup')
    async getsetup(@Query() query: getValueReq): Promise<any> {
        return await this.setupservice.getsetup(query);
    }

    @Post('setsetup')
    async setsetup(@Body() body: setValueReq): Promise<setValueRes> {
        return await this.setupservice.setsetup(body);
    }


    @Get('getType')
    async getType(@Query() query: TypesReq): Promise<TypeRes[]> {
        return await this.setupservice.getType(query);
    }


    @Get('getsubType')
    async getsubType(@Query() query: subTypesReq): Promise<TypeRes[]> {
        return await this.setupservice.getsubType(query);
    }


    @Get('teams/users')
    async presentTeamUsers(@Query() query: TeamReq): Promise<TypeRes[]> {
        return await this.setupservice.getTeam(query);
    }

    @Get('list')
    async presentationList(@Query() query: PresentationReq): Promise<TypeRes[]> {
        return await this.setupservice.presentationList(query);
    }

    @Get('caseDetails')
    async caseDetail(@Query() query: caseDetailsReq): Promise<CaseDetailRes> {
        return await this.setupservice.caseDetail(query);
    }

    @Get('contactList')
    async contactList(@Query() query: contactListReq): Promise<ContactDetailRes[]> {
        return await this.setupservice.contactList(query);
    }

    @Get('scheduleList')
    async scheduleList(@Query() query: scheduleListReq): Promise<ScheduleListRes[]> {

        return await this.setupservice.scheduleList(query);
    }

    @Delete('scheduleDelete')
    async scheduleDelete(@Body() body: scheduleDeleteReq): Promise<ScheduleDeleteRes> {
        return await this.setupservice.scheduleDelete(body);
    }

    @Get('ongoinglist')
    async ongoing(@Query() query: ongoinglistReq): Promise<OngoingListRes[]> {
        return await this.setupservice.ongoing(query);
    }

    @Post('insert')
    async insert(@Body() body: insertReq): Promise<insertRes> {
        return await this.setupservice.insert(body);
    }

    @Get('files')
    async getPresentFiles(@Query() query: PresentationSetUpFilesReq): Promise<any> {
        return await this.setupservice.getPresents(query);
    }

    @Get('detail')
    async getPresentSetUpDetail(@Query() query: PresentationSetUpDetailReq): Promise<any> {
        return await this.setupservice.getPresentsSetUpDetail(query);
    }


    @Delete('clearSchedule')
    async clearSchedule(@Body() body: PresentationSetUpClearScheduleReq): Promise<PresentationSetUpClearScheduleRes> {
        return await this.setupservice.clearSchedule(body);
    }

    @Get('homedetail')
    async homeDetail(@Query() query: runningPresentationReq): Promise<any> {
        return await this.setupservice.homeDetail(query);
    }

    @Get('recentFiles')
    async recentFiles(@Query() query: recentFilesReq): Promise<any> {
        return await this.setupservice.recentFiles(query);
    }

    @Post('files_serial_update')
    async files_serial_update(@Body() body: fileUpdateReq): Promise<fileUpdateRes> {
        return await this.setupservice.files_serial_update(body);
    }

    @Post('update_status')
    async update_status(@Body() body: StatusUpdateReq): Promise<StatusUpdateRes> {
        return await this.setupservice.update_status(body);
    }


    @Get('recentFilesIds')
    async recentFilesIds(@Query() query: recentFilesidsReq): Promise<any> {
        return await this.setupservice.recentFilesIds(query);
    }
}