import { Module } from '@nestjs/common';
import { PresentationController } from './presentation.controller';
import { PresentationService } from './presentation.service';
import { GlobalModule } from '@app/global';
import { SetupModule } from './modules/setup/setup.module';
import { PresentModule } from './modules/present/present.module';

@Module({
  imports: [GlobalModule, SetupModule, PresentModule],
  controllers: [PresentationController],
  providers: [PresentationService],
})
export class PresentationModule { }
