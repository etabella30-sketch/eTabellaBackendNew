/**
 * The query of the code-table lookup (plan Phase 10): `nCategoryid`, the Codemaster category (22 the party names,
 * 4 relevance, 5 impact, every other dynamic dropdown of the legacy app). One class for both live paths: coreapi
 * `common/getcode` (ComboCodeReq: Number() + IsNumber) and realtime-server `issue/dynamiccombo` (dynamicComboReq:
 * parseInt + IsNumber). They differed only on garbage ('4abc': coreapi 400, realtime-server read category 4); the
 * stricter coreapi reading is kept (D7, recorded in the Phase 10 commit). Extends ActorFields: `nMasterid` /
 * `nUserid` are accepted (coreapi's JwtMiddleware injects nMasterid, old clients send it) and ignored (R4: the actor
 * is the verified Caller, and the SP takes no user). No @nestjs/swagger here (D9): the box bundle has no swagger package.
 */
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { ActorFields } from '@app/api-kernel';

/** What the operations port reads: the category, and the actor fields it ignores. */
export interface CodeTableQueryFields {
  readonly nCategoryid: number;
  readonly nMasterid?: string;
  readonly nUserid?: string;
}

/** `GET common/getcode?nCategoryid=22` and `GET issue/dynamiccombo?nCategoryid=4`: a number, required (NaN fails). */
export class CodeTableQuery extends ActorFields implements CodeTableQueryFields {
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nCategoryid must be a number conforming to the specified constraints' })
  nCategoryid: number;
}
