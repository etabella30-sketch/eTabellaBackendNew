import { Module } from '@nestjs/common';
import { AuthapiController } from './authapi.controller';
import { AuthapiService } from './authapi.service';
import { AuthModule } from './modules/auth/auth.module';
import { GlobalModule } from '@app/global';
@Module({
  imports: [
    GlobalModule, AuthModule
  ],
  controllers: [AuthapiController],
  providers: [AuthapiService],
})
export class AuthapiModule { }
