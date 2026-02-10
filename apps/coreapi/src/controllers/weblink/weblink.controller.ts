import { Body, Controller, Get, Post, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { WeblinkService } from '../../services/weblink/weblink.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { getWebdata, InsertWeb, resDeleteWeb, webDelete, webListbyids } from '../../interfaces/web.interface';
import { query } from 'express';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';

@ApiBearerAuth('JWT')
@ApiTags('weblink')
@Controller('weblink')
export class WeblinkController {
    constructor(private weblinkserivce: WeblinkService) {

    }

    @Post('insertweb')
    @UsePipes(new ValidationPipe({ transform: true }))
    async insertWeb(@Body() body: InsertWeb): Promise<any> {
        let res = await this.weblinkserivce.insertWeb(body);
        if (res && res.nWebid) {
            return {
                msg: 1,
                value: 'Weblink inserted successfully',
                nWebid: res["nWebid"]
            }
        } else {
            return {
                msg: -1,
                value: 'Weblink not inserted successfully. Webid not found.',
                error: res
            }
        }
    }

    @Get('getwebData')
    async getWebData(@Query('url') url: string, @Query('nCaseid') nCaseid: number): Promise<any> {
        console.log('TEST LOCAL')
        return await this.weblinkserivce.getURLData(url, nCaseid);

        // res.favicon = await this.weblinkserivce.getFavicon(url);
        // res.screenshot = await this.weblinkserivce.getScreenshot(url,nCaseid);

    }


    @Get('getweblinklist')
    @UsePipes(new ValidationPipe({ transform: true }))    
    @UseInterceptors(LogInterceptor)
    @ApiId(77)
    async getWebLinkList(@Query() query: webListbyids): Promise<any> {
        try {
            query['ref'] = 2;
            let res = await this.weblinkserivce.getWebLinkList(query);
            return res;
        } catch (error) {
            return [{ msg: -1, value: 'Error in fetching weblink list', error: error }]
        }
    }


    @Post('deleteweb')
    @UsePipes(new ValidationPipe({ transform: true }))
    async deleteWeb(@Body() body: webDelete): Promise<resDeleteWeb> {
        let res = await this.weblinkserivce.deleteWeb(body);
        return res[0];
    }
}
