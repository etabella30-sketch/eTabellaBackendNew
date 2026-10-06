/**
 * Swagger docs of the code-table shared DTO (plan Phase 10, decision D9a): the @ApiProperty options coreapi's
 * ComboCodeReq and realtime-server's dynamicComboReq carried before the route moved to @app/rt-features/code-tables
 * (one query class now serves both paths), recorded here word for word so each host's Swagger page reads as it did.
 * Called from apps/coreapi/src/main.ts and apps/realtime-server/src/main.ts.
 */
import { CodeTableQuery } from '@app/rt-features/code-tables';
import { applyDtoDocs, DtoDocs } from '../dto-docs';

/** coreapi `common/getcode` (ComboCodeReq, 2026-10-06): the example was the string 'uuid-string', kept as it was. */
export const CODE_TABLE_CORE_QUERY_DOCS: DtoDocs<CodeTableQuery> = {
  nCategoryid: { example: 'uuid-string', description: '' },
};

/** realtime-server `issue/dynamiccombo` (dynamicComboReq, 2026-10-06). */
export const CODE_TABLE_REALTIME_QUERY_DOCS: DtoDocs<CodeTableQuery> = {
  nCategoryid: { example: 4, description: '' },
};

/**
 * Documents the one query class for the host calling: coreapi passes 'core', realtime-server 'realtime'. One class,
 * one set of docs per process, so each host's page keeps the example its own DTO showed.
 */
export function applyCodeTableDocs(host: 'core' | 'realtime'): void {
  applyDtoDocs(CodeTableQuery, host === 'core' ? CODE_TABLE_CORE_QUERY_DOCS : CODE_TABLE_REALTIME_QUERY_DOCS);
}
