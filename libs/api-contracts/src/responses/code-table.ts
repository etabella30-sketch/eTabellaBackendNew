/**
 * One row of a code table (`public.et_combo_codemaster(nCategoryid)`: the party names of category 22, the relevance
 * and impact grades of 4 and 5, every other dynamic dropdown of the legacy app), as coreapi `common/getcode` and
 * realtime-server `issue/dynamiccombo` answer it and the venue box relays it (shared-libraries plan Phase 10).
 * Types only: the FE's ApiCodeRes / ApiPartyCode mirror this shape.
 */
export interface CodeRow {
  readonly nValue?: number;
  readonly cKey?: string;
  readonly jObject?: unknown;
  readonly nSerialno?: number;
}
