import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { UtilityService } from '../../utility/utility.service';
import { TcpService } from '../../tcp/tcp.service';
import { SessionService } from '../../session/session.service';
import { LogService } from '@app/global/utility/log/log.service';
import { ConfigService } from '@nestjs/config';
import { TransferHealthService } from '../../services/transfer-health/transfer-health.service';

@Controller('tcp')
export class TcpController {
    private localFileName = 'localserver.json';
    private logApplication = 'realtime';
    constructor(private readonly utility: UtilityService
        , public tcpService: TcpService, public sessionService: SessionService, private log: LogService,
        private config: ConfigService,
        private transferHealthService: TransferHealthService
    ) {
    }

    @Get('getserver')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getList(@Query() query: any): Promise<any> {
        const filePath = this.localFileName;  // Specify the path to your JSON file
        return await this.utility.readJsonFromFile(filePath);
    }

    @Post('setserver')
    async sessionBuilder(@Body() body: any): Promise<any> {
        let rs = await this.utility.saveJsonToFile(body, this.localFileName);
        this.log.info(`Setup new TCP connection ${JSON.stringify(body)}`, `${this.logApplication}/tcp`);
        this.tcpService.reconnectServer();
        return rs;
    }

    @Post('setuserid')
    async setUser(@Body() body: any): Promise<any> {
        // console.log('setuserid body',body);
        let data = await this.utility.readJsonFromFile('userid.json');
        if (data) {
            return data;
        }
        return { msg: -1 };
    }

    @Post('reinitsession')
    async reinitsession(@Body() body: any): Promise<any> {
        this.sessionService.reInitSessions(2);
        return { msg: 1 };
    }



    @Get('url')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getUrl(@Query() query: any): Promise<any> {
        const url = this.config.get<string>('LIVE_IP') || '45.76.154.127';
        const port = this.config.get<string>('LIVE_PORT') || '2086';
        const pdfloadurl = this.config.get<string>('PDF_LOAD_PATH') || 'https://etabella.sgp1.cdn.digitaloceanspaces.com/';
        const version = this.config.get<string>('VRSN') || '1.0.0';

        return { url, port, pdfloadurl, version, transferServiceStatus: this.transferHealthService.transferServiceStatus };
    }


}