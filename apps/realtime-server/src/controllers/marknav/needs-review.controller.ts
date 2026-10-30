import { Body, Controller, Get, Post, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import * as fs from 'node:fs/promises';
import { Caller, CallerGuard, CaseScoped, CaseScopeGuard, DomainErrorFilter, SHARED_VALIDATION } from '@app/api-kernel';
import { DbService } from '@app/global/db/pg/db.service';

export class NeedsReviewQuery {
  @IsUUID() nCaseid: string;
  @IsUUID() nSesid: string;
  /** Accepted for compatibility only; the owner is always the Caller. */
  @IsOptional() @IsString() nMasterid?: string;
  @IsOptional() @IsString() nUserid?: string;
}

export class PlaceMarkBody extends NeedsReviewQuery {
  @IsUUID() id: string;
  @IsIn(['QF', 'F', 'D', 'QM']) kind: 'QF' | 'F' | 'D' | 'QM';
  @Type(() => Number) @IsInt() @Min(1) @Max(99999) nPage: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(99) nLine: number;
}

/** One line of the published transcript file (`s_<nSesid>.json`). */
interface PublishedLine { time?: string; lineIndex?: number; lines?: string[] }

/** The published line at page:line, as the publish writes it into a Mark's coordinates. */
export function publishedLine(pages: unknown, page: number, line: number): { t: string; text: string; identity: string } | null {
  const list = Array.isArray(pages) ? pages : Array.isArray((pages as { data?: unknown })?.data) ? (pages as { data: unknown[] }).data : [];
  const p = list.find((x: any) => Number(x?.page) === page) as { data?: PublishedLine[] } | undefined;
  const row = p?.data?.[line - 1];
  if (!row) return null;
  const text = (row.lines ?? []).join(' ').replace(/\s+/g, ' ').trim();
  return { t: String(row.time ?? '').slice(0, 8), text, identity: row.lineIndex == null ? `${page}:${line}` : String(row.lineIndex) };
}

/**
 * Needs Review (100% transfer plan, 2026-10-30). A Mark the publish could not place (no live time, or a
 * time outside the hearing) keeps cTransferStatus 'O' and was hidden everywhere. Its owner can now list
 * it and place it on a line of the published transcript; it keeps its type (QFact, Fact, DocLink or
 * Quick Mark). The owner is the token user, never a request field; the SPs touch only that user's 'O'
 * rows in that session of that case.
 */
@Controller('marknav')
@CaseScoped('nCaseid')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class MarkNavNeedsReviewController {
  constructor(private readonly db: DbService, private readonly config: ConfigService) {}

  @Get('needs-review')
  async list(@Caller() caller: Caller, @Query() query: NeedsReviewQuery): Promise<unknown> {
    const res = await this.db.executeRef('marknav_needs_review',
      { nCaseid: query.nCaseid, nSesid: query.nSesid, nMasterid: caller.userId }, 'realtime');
    return res.success ? res.data[0] : { msg: -1, value: 'Could not read the Marks that need review' };
  }

  @Post('place')
  async place(@Caller() caller: Caller, @Body() body: PlaceMarkBody): Promise<unknown> {
    let pages: unknown;
    try {
      pages = JSON.parse(await fs.readFile(`${this.config.get('REALTIME_PATH')}s_${body.nSesid}.json`, 'utf8'));
    } catch {
      return { msg: -1, value: 'The published transcript is not available' };
    }
    const at = publishedLine(pages, body.nPage, body.nLine);
    if (!at || !at.text) return { msg: -1, value: 'That line is not in the published transcript' };
    const jT = [{ t: at.t, p: body.nPage, l: body.nLine, text: at.text, identity: at.identity,
      x: 0, y: 0, width: 0, height: 21.5, match: 'manual' }];
    const res = await this.db.executeRef('marknav_place_mark', {
      nCaseid: body.nCaseid, nSesid: body.nSesid, nMasterid: caller.userId, id: body.id, kind: body.kind,
      jT, nTPage: body.nPage, nTLine: body.nLine, cTTime: at.t, tidentity: at.identity,
    }, 'realtime');
    return res.success ? res.data[0][0] : { msg: -1, value: 'The Mark could not be placed' };
  }
}
