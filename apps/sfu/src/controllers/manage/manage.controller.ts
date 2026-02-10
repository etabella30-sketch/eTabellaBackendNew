import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { connectTransportReq, consumeReq, createTransportReq, joinReq, produceReq } from '../../interfaces/manage.interface';
import { ManageService } from '../../services/manage/manage.service';

@ApiBearerAuth('JWT')
@ApiTags('manage')
@Controller('manage')
export class ManageController {

    constructor(private readonly manageService: ManageService) {

    }

    @Post('join')
    async requestToJoin(@Body() body: joinReq): Promise<any> {



        return await this.manageService.join(body);
    }

    @Post('create-transport')
    async createTransport(@Body() body: createTransportReq, @Req() req: Request): Promise<any> {
        // console.log(req.headers)// final fallback
        // const clientIp =
        //     req.headers['x-forwarded-for']?.toString()?.split(',')[0] || // client IP from proxy
        //     req.headers['x-real-ip']?.toString()// fallback
        // req.ip ||                                                   // Express IP
        // req.connection.remoteAddress;       
        // console.log('Client IP:', clientIp);
        return await this.manageService.createTransport(body,req.headers["host"]);
    }

    @Post('connect-transport')
    async connectTransport(@Body() body: connectTransportReq): Promise<any> {
        return await this.manageService.connectTransport(body);
    }

    @Post('produce')
    async produce(@Body() body: produceReq): Promise<any> {
        return await this.manageService.produce(body);
    }

    @Post('consume')
    async consume(@Body() body: consumeReq): Promise<any> {
        return await this.manageService.consume(body);
    }

    // On Presentation Closed


}