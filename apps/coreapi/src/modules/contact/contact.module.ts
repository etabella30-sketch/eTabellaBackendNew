import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ContactController } from '../../controllers/contact/contact.controller';
import { ContactService } from '../../services/contact/contact.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
// import { ContactFgaService } from '../../services/contact-fga/contact-fga.service';

@Module({
  imports: [SharedModule],
  controllers: [ContactController],
  providers: [ContactService
    // , ContactFgaService
  ],
})
export class ContactModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(ContactController);
  }
}
