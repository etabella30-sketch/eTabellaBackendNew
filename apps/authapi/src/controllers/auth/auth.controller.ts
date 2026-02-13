import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SignInReq, SignInResponce, SignOutReq, SignOutResponce, UserInfoReq } from '../../interfaces/auth.interface';
import { AuthService } from '../../services/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

@ApiBearerAuth('JWT')
@ApiTags('Authantication')
@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

    @Post('signin')
    async signIn(@Body() body: SignInReq, @Res({ passthrough: true }) res: Response): Promise<SignInResponce> {
        const result = await this.authService.signIn(body);
        if (result.msg === 1 && result.token) {
            res.cookie('access_token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
                path: '/',
            });
        }
        return result;
    }


    @Post('signout')
    async signOut(@Body() body: SignOutReq, @Res({ passthrough: true }) res: Response): Promise<SignOutResponce> {
        const result = await this.authService.signOut(body);
        res.clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });
        return result;
    }


    
    @Get('validate')
    @HttpCode(200)
    async validate(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;
        if (!token) {
            res.status(401);
            return { msg: -1, message: 'No token provided' };
        }
        try {
            const decoded: any = jwt.verify(token, this.configService.get('JWT_SECRET'));
            const userDetail = await this.authService.fetchUserInfo({ nMasterid: decoded.userId });
            if (userDetail?.msg === -1) {
                res.status(401);
                return userDetail;
            }
            return { msg: 1, userDetail };
        } catch (err) {
            res.status(401);
            return { msg: -1, message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' };
        }
    }

    @Get('userinfo')
    async userInfo(@Query() query: UserInfoReq): Promise<SignInResponce> {
        return await this.authService.fetchUserInfo(query);
    }


}
