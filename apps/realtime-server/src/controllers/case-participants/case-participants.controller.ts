import { Controller, Get, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { Caller, CallerGuard, CaseScoped, CaseScopeGuard, DomainError, DomainErrorFilter, RouteId, SHARED_VALIDATION } from '@app/api-kernel';
import { DbService } from '@app/global/db/pg/db.service';

export class CaseParticipantsQuery {
  @IsUUID() nCaseid: string;
  // Legacy clients may send actor fields; the verified caller always replaces them.
  @IsOptional() @IsString() nMasterid?: string;
  @IsOptional() @IsString() nUserid?: string;
}

/** The venue's participant picker reads the same case contacts as CoreAPI. */
@Controller('contact')
@CaseScoped('nCaseid', { cloudCaseCheck: true })
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class CaseParticipantsController {
  constructor(private readonly db: DbService) {}

  @Get('getcontactlist')
  @RouteId('core.contacts')
  async list(@Caller() caller: Caller, @Query() query: CaseParticipantsQuery): Promise<unknown[]> {
    try {
      const result = await this.db.executeRef('contact_list', { nCaseid: query.nCaseid, nMasterid: caller.userId });
      const contacts = result.success ? result.data?.[0] : null;
      if (!Array.isArray(contacts) || contacts.some(row => Number(row?.msg) < 0)) {
        throw new Error('Contact lookup did not succeed');
      }
      return contacts;
    } catch {
      // A failed lookup is retryable, never a successful "no participants" response.
      throw new DomainError('unavailable', 'Could not load case participants. Please retry.');
    }
  }
}
