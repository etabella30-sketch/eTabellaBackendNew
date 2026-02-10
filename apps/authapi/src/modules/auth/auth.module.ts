import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '../../controllers/auth/auth.controller';
import { AuthService } from '../../services/auth/auth.service';
import { SharedModule } from '../../shared/shared.module';
import { TokenModule } from '@app/global/modules/token.module';
import { JwtStrategy } from '@app/global/utility/jwt/jwt.strategy';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { PasswordHashService } from '@app/global/utility/cryptography/password-hash.service';
import { UtilityService } from '../../utility/utility.service';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';

@Module({
    imports: [
        // KafkaSharedModule,
        KafkaModule.register('etabella-auth', 'auth-group'),
        SharedModule,
        PassportModule,
        TokenModule
    ],
    controllers: [AuthController],
    providers: [AuthService, PasswordHashService, JwtStrategy, UtilityService,KafkaGlobalService],
})
export class AuthModule implements NestModule {

    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            // .forRoutes(UsersController); 
            // .forRoutes('*'); // Apply to all routes, or specify routes
            .forRoutes(
                { path: 'auth/signout', method: RequestMethod.POST },
                { path: 'auth/userinfo', method: RequestMethod.GET }
            );
    }
}
