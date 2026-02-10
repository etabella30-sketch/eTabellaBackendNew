import { Controller, Get, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EmailAttachment, EmailparseReq } from 'apps/coreapi/src/interfaces/common';
import { EmailService } from 'apps/coreapi/src/services/email/email/email.service';

@ApiBearerAuth('JWT')
@ApiTags('email')
@Controller('email')
export class EmailController {

    constructor(private readonly emailService: EmailService) {
    }

    @Get('getemailparse')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getemailparse(@Query() query: EmailparseReq): Promise<any> {
        return await this.emailService.getemailparse(query);
    }


    @Get('getattechment')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getattechment(@Query() query: EmailAttachment, @Res() res: Response): Promise<any> {
        return await this.emailService.downloadAttachment(query, res);
    }


}
