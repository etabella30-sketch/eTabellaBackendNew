import { Body, Controller, Get, Post, Query, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SignInReq, SignInResponce, SignOutReq, SignOutResponce, UserInfoReq } from '../../interfaces/auth.interface';
import { AuthService } from '../../services/auth/auth.service';

@ApiBearerAuth('JWT')
@ApiTags('Authantication')
@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post('signin')
    async signIn(@Body() body: SignInReq): Promise<SignInResponce> {
        return await this.authService.signIn(body);
    }


    @Post('signout')
    async signOut(@Body() body: SignOutReq): Promise<SignOutResponce> {
        return await this.authService.signOut(body);
    }


    
    @Get('userinfo')
    async userInfo(@Query() query: UserInfoReq): Promise<SignInResponce> {
        return await this.authService.fetchUserInfo(query);
    }


}
