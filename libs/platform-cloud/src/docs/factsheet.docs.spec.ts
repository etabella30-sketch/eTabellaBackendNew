import 'reflect-metadata';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { FactsheetQuery, FactsheetSaveBody } from '@app/rt-features/factsheet';
import { applyFactsheetDocs, FACTSHEET_QUERY_DOCS, FACTSHEET_SAVE_BODY_DOCS } from './factsheet.docs';

const meta = (proto: object, field: string): Record<string, unknown> | undefined =>
  Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, proto, field);

describe('applyFactsheetDocs (realtime-server Swagger reads as before Phase 7a)', () => {
  beforeAll(() => applyFactsheetDocs());

  it('documents every FactsheetSaveBody field the old saveFactSheet class documented, word for word', () => {
    const documented = Object.keys(FACTSHEET_SAVE_BODY_DOCS).sort();
    expect(documented).toEqual(['bIsUserUpdated', 'jContacts', 'jDate', 'jFl', 'jIssues', 'jT', 'jTasks', 'jUsers', 'nBundledetailid', 'nColorid', 'nFSid', 'nFt', 'nRv', 'nSesid', 'nSt']);
    for (const field of documented) {
      expect(meta(FactsheetSaveBody.prototype, field)).toEqual(expect.objectContaining(FACTSHEET_SAVE_BODY_DOCS[field as keyof FactsheetSaveBody]));
    }
    expect(meta(FactsheetSaveBody.prototype, 'nRv')).toEqual(expect.objectContaining({ type: Number }));
    expect(meta(FactsheetSaveBody.prototype, 'bIsUserUpdated')).toEqual(expect.objectContaining({ type: Boolean }));
  });

  it('documents FactsheetQuery.nFSid as fectsheetDetailReq / unshareDTO did, and never the ignored actor fields', () => {
    expect(meta(FactsheetQuery.prototype, 'nFSid')).toEqual(expect.objectContaining({ ...FACTSHEET_QUERY_DOCS.nFSid, type: String }));
    expect(meta(FactsheetQuery.prototype, 'nMasterid')).toBeUndefined();
    expect(meta(FactsheetSaveBody.prototype, 'nMasterid')).toBeUndefined();
    expect(meta(FactsheetSaveBody.prototype, 'nUserid')).toBeUndefined();
  });
});
