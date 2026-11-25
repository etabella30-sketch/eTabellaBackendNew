import { Body, Controller, Delete, Get, Header, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { CALLER_KEY, type Caller } from '@app/api-kernel';
import { DraftRecoveryService, type DraftSource } from '../../services/draft-recovery/draft-recovery.service';
import type { Request } from 'express';

@Controller('draft-recovery/keys')
export class DraftRecoveryController {
  constructor(private readonly recovery: DraftRecoveryService) {}

  private user(req: Request): string {
    const caller = req[CALLER_KEY] as Caller | undefined;
    if (!caller?.userId || caller.family !== 'cloud-jwt') throw new UnauthorizedException();
    return caller.userId;
  }

  @Post()
  @Header('Cache-Control', 'no-store')
  issue(@Req() req: Request, @Body() body: DraftSource) {
    return this.recovery.issue(this.user(req), req['verifiedBrowserId'], req['verifiedTokenHash'], { caseId: body?.caseId, sourceKind: body?.sourceKind, sourceId: body?.sourceId });
  }

  @Get(':draftId')
  @Header('Cache-Control', 'no-store')
  recover(@Req() req: Request, @Param('draftId') draftId: string) {
    return this.recovery.recover(this.user(req), req['verifiedBrowserId'], req['verifiedTokenHash'], draftId);
  }

  @Delete(':draftId')
  @Header('Cache-Control', 'no-store')
  async remove(@Req() req: Request, @Param('draftId') draftId: string) {
    await this.recovery.remove(this.user(req), req['verifiedBrowserId'], req['verifiedTokenHash'], draftId);
    return { ok: true };
  }
}
