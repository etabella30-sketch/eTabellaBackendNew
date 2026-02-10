import { Body, Controller, Post } from '@nestjs/common';
import { login } from '../../interfaces/session.interface';
import { AuthService } from '../../services/auth/auth.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {


    constructor(private auth: AuthService) {

    }

    @Post('signinrt')
    async login(@Body() body: login): Promise<any> {
        const res = await this.auth.login(body);
        return res;
    }



}
