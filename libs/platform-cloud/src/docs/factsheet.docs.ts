/**
 * Swagger docs of the Full Fact editor's shared DTOs (plan Phase 7a, decision D9a): the @ApiProperty options
 * realtime-server's fact.interface.ts carried on fectsheetDetailReq / unshareDTO (now FactsheetQuery) and
 * saveFactSheet (now FactsheetSaveBody) before the routes moved to @app/rt-features/factsheet, recorded here word
 * for word so the realtime-server Swagger page reads as it did. Called from apps/realtime-server/src/main.ts.
 */
import { FactsheetQuery, FactsheetSaveBody } from '@app/rt-features/factsheet';
import { applyDtoDocs, DtoDocs } from '../dto-docs';

export const FACTSHEET_QUERY_DOCS: DtoDocs<FactsheetQuery> = {
  nFSid: { example: 'uuid-string', description: 'nFSid' },
};

export const FACTSHEET_SAVE_BODY_DOCS: DtoDocs<FactsheetSaveBody> = {
  nFSid: { example: 'uuid-string', description: 'nFSid' },
  nSesid: { example: 'uuid-string', description: 'nSesid' },
  nBundledetailid: { example: 1, description: 'Unique identifier for the database entry' },
  jT: { example: '["example1", "example2"]', description: 'Array of strings', required: false },
  nFt: { example: 1, description: 'File type', required: false },
  nSt: { example: 1, description: 'State number', required: false },
  jFl: { example: '', description: 'Array of arrays containing mixed types', required: false },
  nColorid: { example: 'uuid-string', description: 'Color id', required: false },
  jIssues: { example: '', description: 'Array of arrays of numbers' },
  jContacts: { example: '', description: 'Array of contact IDs', required: false },
  jTasks: { example: '', description: 'Array of task IDs', required: false },
  jUsers: { example: '', description: 'Array of team IDs', required: false },
  jDate: { example: '[{}]', description: 'Array of date objects', required: false },
  bIsUserUpdated: { example: true, description: 'isUpdated' },
  nRv: { example: 0, description: 'Review status (Codemaster cat 27: Open / In Review / Finalized); 0 = default Open', required: false },
};

/** Documents FactsheetQuery and FactsheetSaveBody for the realtime-server Swagger page. */
export function applyFactsheetDocs(): void {
  applyDtoDocs(FactsheetQuery, FACTSHEET_QUERY_DOCS);
  applyDtoDocs(FactsheetSaveBody, FACTSHEET_SAVE_BODY_DOCS);
}
