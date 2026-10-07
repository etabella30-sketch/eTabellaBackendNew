/**
 * The eight document reads as the venue box relays them, under the `bundles` prefix coreapi serves them on (the box
 * row's path is /coreapi/bundles/<x>, its cloudPath bundles/<x> on realtime-server, which mounts this controller for
 * the box; coreapi keeps its own BundlesController over the same DocumentsService). Controller-scoped plumbing (plan
 * §3.3 "Request plumbing"): the caller and case-scope guards, the shared validation pipe and the DomainError filter,
 * whose envelope each host binds. The reads that name a case carry @CaseScoped: on the box the sign-in's cases, on
 * the cloud the edge token's. The others name a section, folder or file; the cloud's edge-token branch reads their
 * case from those (realtime-edge-token.ts EDGE_SCOPE_ENTITY_SQL). The actor is `@Caller()`.
 */
import { Body, Controller, Get, Inject, Post, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, CaseScoped, CaseScopeGuard, DomainErrorFilter, RouteId, SHARED_VALIDATION } from '@app/api-kernel';

import { BundleDetailQuery, BundleIndexQuery, BundlesBody, FileDataQuery, FolderSearchQuery, SectionsQuery } from '../dto/documents.dto';
import { DOCUMENTS_OPS, DocumentsOperations } from '../documents.operations';

/** The manifest ids of the rows this controller serves (the box relays all eight). */
export const DOCUMENTS_ROUTE_IDS = Object.freeze({
  sections: 'core.bundles.sections',
  userSections: 'core.bundles.usersections',
  bundles: 'core.bundles.bundle',
  bundleDetail: 'core.bundles.bundledetail',
  bundleDetailSearch: 'core.bundles.bundledetail.search',
  folderSearch: 'core.bundles.folder.search',
  bundleIndex: 'core.bundles.index',
  fileData: 'core.bundles.filedata',
});

@Controller('bundles')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class DocumentsController {
  constructor(@Inject(DOCUMENTS_OPS) private readonly operations: DocumentsOperations) {}

  @Get('sections')
  @RouteId(DOCUMENTS_ROUTE_IDS.sections)
  @CaseScoped('nCaseid')
  sections(@Caller() caller: Caller, @Query() query: SectionsQuery): Promise<unknown> {
    return this.operations.sections(caller, query);
  }

  @Get('usersections')
  @RouteId(DOCUMENTS_ROUTE_IDS.userSections)
  @CaseScoped('nCaseid')
  userSections(@Caller() caller: Caller, @Query() query: SectionsQuery): Promise<unknown> {
    return this.operations.userSections(caller, query);
  }

  @Post('bundle')
  @RouteId(DOCUMENTS_ROUTE_IDS.bundles)
  bundles(@Caller() caller: Caller, @Body() body: BundlesBody): Promise<unknown> {
    return this.operations.bundles(caller, body);
  }

  @Get('bundledetail')
  @RouteId(DOCUMENTS_ROUTE_IDS.bundleDetail)
  bundleDetail(@Caller() caller: Caller, @Query() query: BundleDetailQuery): Promise<unknown> {
    return this.operations.bundleDetail(caller, query);
  }

  @Get('bundledetail-search')
  @RouteId(DOCUMENTS_ROUTE_IDS.bundleDetailSearch)
  bundleDetailSearch(@Caller() caller: Caller, @Query() query: BundleDetailQuery): Promise<unknown> {
    return this.operations.bundleDetailSearch(caller, query);
  }

  @Get('folder-search')
  @RouteId(DOCUMENTS_ROUTE_IDS.folderSearch)
  @CaseScoped('nCaseid')
  folderSearch(@Caller() caller: Caller, @Query() query: FolderSearchQuery): Promise<unknown> {
    return this.operations.folderSearch(caller, query);
  }

  @Get('index')
  @RouteId(DOCUMENTS_ROUTE_IDS.bundleIndex)
  bundleIndex(@Caller() caller: Caller, @Query() query: BundleIndexQuery): Promise<unknown> {
    return this.operations.bundleIndex(caller, query);
  }

  @Get('filedata')
  @RouteId(DOCUMENTS_ROUTE_IDS.fileData)
  fileData(@Caller() caller: Caller, @Query() query: FileDataQuery): Promise<unknown> {
    return this.operations.fileData(caller, query);
  }
}
