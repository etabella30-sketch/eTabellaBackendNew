import 'reflect-metadata';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { CodeTableQuery } from '@app/rt-features/code-tables';
import { applyCodeTableDocs, CODE_TABLE_CORE_QUERY_DOCS, CODE_TABLE_REALTIME_QUERY_DOCS } from './code-tables.docs';

const meta = (proto: object, field: string): Record<string, unknown> | undefined =>
  Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, proto, field);

describe('applyCodeTableDocs (each host Swagger page reads as before Phase 10)', () => {
  it("documents CodeTableQuery.nCategoryid as coreapi's ComboCodeReq did when the host is coreapi", () => {
    applyCodeTableDocs('core');
    expect(meta(CodeTableQuery.prototype, 'nCategoryid')).toEqual(expect.objectContaining({ ...CODE_TABLE_CORE_QUERY_DOCS.nCategoryid, type: Number }));
  });

  it("documents it as realtime-server's dynamicComboReq did when the host is realtime-server", () => {
    applyCodeTableDocs('realtime');
    expect(meta(CodeTableQuery.prototype, 'nCategoryid')).toEqual(expect.objectContaining({ ...CODE_TABLE_REALTIME_QUERY_DOCS.nCategoryid, type: Number }));
  });

  it('never documents the ignored actor fields (R4: the actor is the verified Caller)', () => {
    expect(meta(CodeTableQuery.prototype, 'nMasterid')).toBeUndefined();
    expect(meta(CodeTableQuery.prototype, 'nUserid')).toBeUndefined();
  });
});
