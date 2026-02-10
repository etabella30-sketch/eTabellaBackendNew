import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TicketService } from '../../services/ticket/ticket.service';
import { caseListReq, CaseListRes, caseTicketReq, caseTicketRes, clearTicketReq, clearTicketRes, ticketBuilderReq, ticketResolveClearReq, ticketResolveClearRes, ticketResolveReq, ticketResolveRes } from '../../interfaces/ticket.interface';

@ApiBearerAuth('JWT')
@ApiTags('tickets')
@Controller('ticket')
export class TicketController {

    constructor(private readonly ticketService: TicketService) {
    }


    @Get('tickets')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCaseTicket(@Query() query: caseTicketReq): Promise<caseTicketRes> {
        return await this.ticketService.getCaseTicket(query);
    }

    @Get('casetickets')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCaseAllTicket(@Query() query: caseTicketReq): Promise<caseTicketRes> {
        return await this.ticketService.getCaseAllTicket(query);
    }

    @Post('clearticket')
    async cleartickets(@Body() body: clearTicketReq): Promise<clearTicketRes> {
        return await this.ticketService.clearTickets(body);
    }

    @Post('resolved')
    async ticketResolved(@Body() body: ticketResolveReq): Promise<ticketResolveRes> {
        return await this.ticketService.ticketResolved(body);
    }

    @Post('adminclearticket')
    async admincleartickets(@Body() body: ticketResolveClearReq): Promise<ticketResolveClearRes> {
        return await this.ticketService.clearAdminTickets(body);
    }


    @Get('caselist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCaselist(@Query() query: caseListReq): Promise<CaseListRes> {
        return await this.ticketService.getCaseList(query);
    }


    @Post('ticketbuilder')
    async ticketbuilder(@Body() body: ticketBuilderReq): Promise<clearTicketRes> {
        return await this.ticketService.ticketbuilder(body);
    }
}
