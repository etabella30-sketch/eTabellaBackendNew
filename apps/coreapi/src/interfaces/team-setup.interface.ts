import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min, Validate, ValidateNested, ValidatorConstraint, ValidatorConstraintInterface, isString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class TeamBuilderReq {

  @ApiProperty({ example: 0, description: 'Team id', required: true })
  @IsOptional()
  @IsItUUID()
  nTeamid: string;


  @ApiProperty({ example: '', description: 'Team Name', required: true })
  @IsString()
  @IsNotEmpty()
  cTeamname: string;

  @ApiProperty({ example: '', description: 'Team Color', required: true })
  @IsString()
  @IsNotEmpty()
  cClr: string;

  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  @IsNotEmpty()
  nCaseid: string;

  @ApiProperty({ example: '', description: 'Permission', required: true })
  @IsString()
  @IsNotEmpty()
  permission: string;

  @IsItUUID()
  nMasterid?: string;

}



export class TeamBuilderRes {
  msg: Number;
  value: string;
  nTeamid?: string
  error?: any
}





export class TeamDeleteReq {

  @ApiProperty({ example: 0, description: 'Team id', required: true })
  @IsItUUID()
  nTeamid: string;

  @ApiProperty({ example: '', description: 'Permission', required: true })
  @IsString()
  @IsOptional()
  permission: string;

  @IsItUUID()
  nMasterid?: string;

}



export class TeamDeleteRes {
  msg: Number;
  value: string;
  nTeamid?: string
  error?: any
}

export class UserBuilderReq {

  @ApiProperty({ example: 0, description: 'User id', required: true })
  @IsOptional()
  @IsItUUID()
  nUserid: string;


  @ApiProperty({ example: '', description: 'First Name', required: true })
  @IsString()
  @IsNotEmpty()
  cFname: string;

  @ApiProperty({ example: '', description: 'Last Name', required: true })
  @IsString()
  @IsNotEmpty()
  cLname: string;

  @ApiProperty({ example: '', description: 'Email', required: true })
  @IsEmail()
  cEmail: Number;

  @ApiProperty({ example: '', description: 'Password', required: false })
  @IsOptional()
  @IsString()
  cPassword: string;

  @ApiProperty({ example: '', description: 'Profile', required: true })
  @IsString()
  @IsOptional()
  cProfile: string;

  @ApiProperty({ example: 0, description: 'Timezone', required: true })
  @IsNumber()
  @IsNotEmpty()
  nTZid: Number;

  @ApiProperty({ example: 0, description: 'Role id', required: false })
  @IsItUUID()
  @IsOptional()
  nRoleid: string;

  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  @IsOptional()
  nCaseid: string;


  @ApiProperty({ example: 0, description: 'Team id', required: false })
  @IsItUUID()
  @IsOptional()
  nTeamid: string;

  @ApiProperty({ example: 'E', description: "'N' create / 'E' edit (delete is team-setup/userdelete)", required: true })
  @IsString()
  @IsIn(['N', 'E'])
  permission: string;

  @IsItUUID()
  nMasterid?: string;

}

export class UserBuilderRes {
  msg: Number;
  value: string;
  nUserid?: string;
  nTeamid?: string;
  error?: any;
}


class UserDetail {
  @ApiProperty({ example: 0, description: 'User ID', required: true })
  @IsItUUID()
  u: string;

  @ApiProperty({ example: 0, description: 'Team ID', required: true })
  @IsItUUID()
  t: string;
}

export class teamSetup {
  @ApiProperty({ example: 0, description: 'Case ID', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ type: [UserDetail], description: 'User Details', required: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDetail)
  jUsers: UserDetail[];

  @IsItUUID()
  nMasterid?: string;
}

export class teamSetupRes {
  msg: Number;
  value: string;
  error?: any;
}


export class UserDeleteReq {
  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nUserid: string;

  @IsItUUID()
  nMasterid?: string;

  @ApiProperty({ example: 'D', description: '' })
  @IsString()
  @IsIn(['D'])
  permission: string;
}


export class UserDeleteRes {
  msg: Number;
  value: string;
  error?: any;
}


export class TeamcolorRes {
  cClr?: string;
  msg?: Number;
  value?: string;
  error?: any;
}



/** POST team-setup/uimode — the caller switches their own UI mode. */
export class UiModeReq {

  @ApiProperty({ description: 'Case whose mode this signed-in user is changing', required: true })
  @IsItUUID()
  @IsNotEmpty()
  nCaseid: string;

  @ApiProperty({ example: 'E', description: "UI mode: 'E' Essential / 'A' Advanced", required: true })
  @IsString()
  @IsIn(['E', 'A'])
  cUIMode: 'E' | 'A';

  /** Injected from the JWT by the middleware — never trusted from the client. */
  @IsOptional()
  @IsItUUID()
  nMasterid?: string;
}

export class UiModeRes {
  msg: number;
  value: string;
  cUIMode?: 'E' | 'A' | null;
  error?: any;
}

export class UiModeQuery {
  @ApiProperty({ description: 'Case whose mode to read' })
  @IsItUUID()
  @IsNotEmpty()
  nCaseid: string;

  @IsOptional()
  @IsItUUID()
  nMasterid?: string;
}

/* ----- Highlight colour preferences (owner 2026-11-23): one row per user and case, ids only ----- */

const HIGHLIGHT_ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const HIGHLIGHT_ID_RE = new RegExp(`^${HIGHLIGHT_ID}$`, 'i');
const HIGHLIGHT_COMBO_RE = new RegExp(`^(team|private):${HIGHLIGHT_ID}(\\+${HIGHLIGHT_ID})+$`, 'i');
export const HIGHLIGHT_MAX_RANKED = 200;
export const HIGHLIGHT_MAX_COMBOS = 500;

/** jCombos: a plain object of at most 500 saved choices, each `team:<id>+<id>...` or `private:<id>+<id>...` naming one
 *  of the ids of its own combination. Anything else is refused before the database is reached. */
@ValidatorConstraint({ name: 'highlightCombos', async: false })
export class HighlightCombosConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > HIGHLIGHT_MAX_COMBOS) return false;
    return entries.every(([key, id]) => typeof id === 'string' && HIGHLIGHT_COMBO_RE.test(key)
      && key.slice(key.indexOf(':') + 1).toLowerCase().split('+').includes(id.toLowerCase()));
  }
  defaultMessage(): string { return 'jCombos must map a combination of Issue ids to one of those ids'; }
}

/** GET team-setup/highlight-prefs: the caller reads their own preferences for a case. */
export class HighlightPrefsQuery {
  @ApiProperty({ description: 'Case whose highlight preferences to read' })
  // Matches, not IsItUUID: IsItUUID lets a missing value through, and a case is required here.
  @Matches(HIGHLIGHT_ID_RE)
  nCaseid: string;

  /** Injected from the JWT by the middleware, never trusted from the client. */
  @IsOptional()
  @IsItUUID()
  nMasterid?: string;
}

/** POST team-setup/highlight-prefs: the caller saves their own preferences for a case. */
export class HighlightPrefsReq {
  @ApiProperty({ description: 'Case these preferences are for', required: true })
  // Matches, not IsItUUID: IsItUUID lets a missing value through, and a case is required here.
  @Matches(HIGHLIGHT_ID_RE)
  nCaseid: string;

  @ApiProperty({ description: 'The Highlight ranking is in use for this case', required: true })
  @IsBoolean()
  bOn: boolean;

  @ApiProperty({ example: 'D', description: "'D' Default ranking / 'M' My ranking", required: true })
  @IsIn(['D', 'M'])
  cMode: 'D' | 'M';

  @ApiProperty({ description: 'My ranking: Issue and Private Analysis Group ids, highest first; null = never set', required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(HIGHLIGHT_MAX_RANKED)
  @ArrayUnique((id: unknown) => (typeof id === 'string' ? id.toLowerCase() : id))
  @Matches(HIGHLIGHT_ID_RE, { each: true })
  jMyOrder?: string[] | null;

  @ApiProperty({ description: 'Saved choices: {"team:<id>+<id>": "<id>"}', required: true })
  @Validate(HighlightCombosConstraint)
  jCombos: Record<string, string>;

  @ApiProperty({ description: 'The revision these preferences were read at (0 = none stored)', required: true })
  @IsInt()
  @Min(0)
  nRev: number;

  /** Injected from the JWT by the middleware, never trusted from the client. */
  @IsOptional()
  @IsItUUID()
  nMasterid?: string;
}

export class HighlightPrefsRes {
  /** 1 = read / saved; -1 = refused; -2 = saved from another window since it was read (the stored row comes back). */
  msg: number;
  value: string;
  bExists?: boolean;
  bOn?: boolean;
  cMode?: 'D' | 'M';
  jMyOrder?: string[] | null;
  jCombos?: Record<string, string>;
  nRev?: number;
}
