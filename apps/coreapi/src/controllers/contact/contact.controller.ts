import { Body, Controller, Get, Post, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ContactService } from '../../services/contact/contact.service';
import { CRBuilderReq, CRBuilderRes, CaseContactBuilderReq, CheckMentionExistsReq, CompanyBuilderReq, CompanyBuilderRes, CompanyReq, CompanyRes, ContactBuilderReq, ContactBuilderRes, ContactDeleteReq, ContactFileReq, ContactFileRes, ContactReq, ContactRes, ContactlsReq, ContactlsRes, ContactroleReq, ContactroleRes } from '../../interfaces/contact.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';

@ApiBearerAuth('JWT')
@ApiTags('contact')
@Controller('contact')
export class ContactController {


    constructor(private readonly contactService: ContactService) {
    }

    @Get('getcontactlist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getContactlist(@Query() query: ContactlsReq): Promise<ContactlsRes[]> {
        return await this.contactService.getContactlist(query);
    }


    @Get('getcontactdetail')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(81)
    async getContactDetail(@Query() query: ContactReq): Promise<ContactRes> {
        return await this.contactService.getContactDetail(query);
    }

    @Get('contactfiles')
    @UsePipes(new ValidationPipe({ transform: true }))
    async contactFiles(@Query() query: ContactFileReq): Promise<ContactFileRes[]> {
        return await this.contactService.contactFiles(query);
    }

    @Post('contactbuilder')
    async contactBuilder(@Body() body: ContactBuilderReq): Promise<ContactBuilderRes> {
        return await this.contactService.contactBuilder(body);
    }

    @Post('contactdelete')
    async contactDelete(@Body() body: ContactDeleteReq): Promise<ContactBuilderRes> {
        return await this.contactService.contactDelete(body);
    }


    @Get('getcompanylist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCompanylist(@Query() query: CompanyReq): Promise<CompanyRes[]> {
        return await this.contactService.getCompanylist(query);
    }

    @Post('companybuilder')
    async companyBuilder(@Body() body: CompanyBuilderReq): Promise<CompanyBuilderRes> {
        return await this.contactService.companyBuilder(body);
    }



    @Get('getcontactrole')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getContactrolelist(@Query() query: ContactroleReq): Promise<ContactroleRes[]> {
        return await this.contactService.getContactrolelist(query);
    }

    @Post('contactrolebuilder')
    async contactroleBuilder(@Body() body: CRBuilderReq): Promise<CRBuilderRes> {
        return await this.contactService.contactroleBuilder(body);
    }


    // rt new design case role chnages


    @Get('getcontact/caseroles')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getContactCaserolelist(@Query() query: ContactroleReq): Promise<ContactroleRes[]> {
        return await this.contactService.getContactCaserolelist(query);
    }


    @Post('casecontact/rolebuilder')
    async caseContactroleBuilder(@Body() body: CRBuilderReq): Promise<CRBuilderRes> {
        return await this.contactService.caseContactroleBuilder(body);
    }


    @Post('case/contactbuilder')
    async caseContactBuilder(@Body() body: CaseContactBuilderReq): Promise<ContactBuilderRes> {
        return await this.contactService.caseContactBuilder(body);
    }

    @Get('getcontact/companylist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getContactCompanylist(@Query() query: CompanyReq): Promise<CompanyRes[]> {
        return await this.contactService.getContactCompanylist(query);
    }

    @Get('mentiontag/exists')
    @UsePipes(new ValidationPipe({ transform: true }))
    async checkMentionExists(@Query() query: CheckMentionExistsReq): Promise<CompanyRes[]> {
        return await this.contactService.checkMentionExists(query);
    }

}
