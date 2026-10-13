import { Body, Controller, Get, Post, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { Caller, CallerGuard, CaseScoped, CaseScopeGuard, DomainErrorFilter, RouteId, SHARED_VALIDATION } from '@app/api-kernel';
import { DbService } from '@app/global/db/pg/db.service';

export class CaseModeQuery {
  @IsUUID() nCaseid: string;
  @IsOptional() @IsString() nMasterid?: string;
  @IsOptional() @IsString() nUserid?: string;
}
export class CaseModeBody extends CaseModeQuery {
  @IsIn(['E', 'A']) cUIMode: 'E' | 'A';
}

/** Online venue clients share the same User × Case state as coreapi. Offline switches are refused. */
@Controller('team-setup')
@CaseScoped('nCaseid')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class CaseModeController {
  constructor(private readonly db: DbService) {}

  @Get('uimode')
  @RouteId('core.uimode.get')
  async get(@Caller() caller: Caller, @Query() query: CaseModeQuery): Promise<unknown> {
    return this.execute('user_case_uimode_get', caller, { nCaseid: query.nCaseid });
  }

  @Post('uimode')
  @RouteId('core.uimode.set')
  async set(@Caller() caller: Caller, @Body() body: CaseModeBody): Promise<unknown> {
    return this.execute('user_case_uimode_set', caller, { nCaseid: body.nCaseid, cUIMode: body.cUIMode });
  }

  private async execute(fn: string, caller: Caller, fields: object): Promise<unknown> {
    const result = await this.db.executeRef(fn, { ...fields, nMasterid: caller.userId });
    return result.success ? result.data[0][0] : { msg: -1, value: 'Could not confirm the current case mode' };
  }
}
