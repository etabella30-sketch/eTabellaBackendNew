import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { caseListReq, CaseListRes, caseTicketReq, caseTicketRes, clearTicketReq, clearTicketRes, ticketBuilderReq, ticketResolveClearReq, ticketResolveClearRes, ticketResolveReq, ticketResolveRes } from '../../interfaces/ticket.interface';
import { UtilityService } from '../utility/utility.service';
@Injectable()
export class TicketService {



    constructor(private db: DbService,
        private utility: UtilityService
    ) {

    }

    async getCaseTicket(query: caseTicketReq): Promise<caseTicketRes> {
        let res = await this.db.executeRef('user_tickets', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async getCaseAllTicket(query: caseTicketReq): Promise<caseTicketRes> {
        let res = await this.db.executeRef('admin_case_tickets', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async clearTickets(body: clearTicketReq): Promise<clearTicketRes> {
        let res = await this.db.executeRef('user_tickets_clear', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to clear', error: res.error }
        }
    }


    async ticketResolved(body: ticketResolveReq): Promise<ticketResolveRes> {
        let res = await this.db.executeRef('admin_case_ticket_resolved', body);
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]["jNotify"] || [];
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            } catch (error) {
            }

            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to resolve', error: res.error }
        }
    }


    async clearAdminTickets(body: ticketResolveClearReq): Promise<ticketResolveClearRes> {
        let res = await this.db.executeRef('admin_clear_resolvedtickets', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to clear', error: res.error }
        }
    }

    async getCaseList(query: caseListReq): Promise<CaseListRes> {
        let res = await this.db.executeRef('ticket_caselist', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async ticketbuilder(body: ticketBuilderReq): Promise<clearTicketRes> {
        let res = await this.db.executeRef('ticket_builder', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to clear', error: res.error }
        }
    }

}
