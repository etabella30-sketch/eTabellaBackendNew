import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  isBoolean,
  isNumber,
  isString,
} from 'class-validator';
import { IsItUUID } from '@app/global/decorator/is-uuid-nullable.decorator';
import { Transform, Type } from 'class-transformer';
import { is } from 'cheerio/lib/api/traversing';

class jCordinateItem {
  @ApiProperty({
    example: '',
    description: ' item',
  })
  @IsOptional()
  @IsString()
  text: string;

  @ApiProperty({
    example: '13:39:25:02',
    description: 'Timestamp in HH:MM:SS:FF format',
  })
  @IsString()
  t: string;

  @ApiProperty({
    example: 7,
    description: 'Line number or line identifier',
  })
  @IsOptional()
  @IsNumber()
  l: number;

  @ApiProperty({
    example: 42,
    description: 'Page number or page identifier',
  })
  @IsOptional()
  @IsNumber()
  p: number;

  @ApiProperty({
    example: 22,
    description: 'Original page number or offset',
  })
  @IsOptional()
  @IsNumber()
  oP: number;

  @ApiProperty({
    example: 1,
    description: 'Original line number or offset',
  })
  @IsOptional()
  @IsNumber()
  oL: number;

  @ApiProperty({
    example: '374926425208601',
    description: 'Unique identifier for the annotation item',
  })
  @IsOptional()
  @Transform(({ value }) => value != null ? String(value) : value)
  @IsString()
  identity: string;

  // ---- Optional canvas-drawing geometry (transcript pen/shape marks) ----
  // A pen stroke / rectangle shape drawn over the transcript is a first-class
  // DRAWING, not a line highlight. Its geometry rides on the FIRST coordinate of
  // each covered page so it round-trips via the verbatim jCordinates column
  // (page-relative px at zoom=1). Declared so the global ValidationPipe
  // (whitelist:true + forbidNonWhitelisted:true) keeps them instead of 400-ing.
  @ApiProperty({ example: 'drawing', description: "Canvas geometry kind: 'drawing' (pen) or 'area' (shape)", required: false })
  @IsOptional()
  @IsString()
  type: 'drawing' | 'area';

  @ApiProperty({ type: 'array', items: { type: 'object' }, description: 'Shape rectangles [{x,y,width,height}]', required: false })
  @IsOptional()
  @IsArray()
  rects: { x: number; y: number; width: number; height: number }[];

  @ApiProperty({ type: 'array', items: { type: 'array' }, description: 'Pen polyline points [[x,y], …]', required: false })
  @IsOptional()
  @IsArray()
  lines: number[][];

  @ApiProperty({ example: 3, description: 'Stroke width (px)', required: false })
  @IsOptional()
  @IsNumber()
  strokeWidth: number;

  @ApiProperty({ example: 1, description: 'Stroke opacity 0–1', required: false })
  @IsOptional()
  @IsNumber()
  opacity: number;

  @ApiProperty({ example: '#e0483f', description: 'Stroke colour (hex)', required: false })
  @IsOptional()
  @IsString()
  color: string;
}

export class FactDetailReq {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Fact ID (nFSid)',
    required: true,
  })
  @IsItUUID()
  nFSid: string;

  @IsItUUID()
  nMasterid: string;

  // bIsTranscipt routes through to et_fact_get_detail_single which CASEs on
  // it to surface published-view nTPage/nTLine instead of the draft values
  // after run3.py annotation transfer.
  @ApiProperty({ example: false, description: 'bIsTranscipt', required: false })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  @IsOptional()
  bIsTranscipt: boolean;
}


export class jCoordinateItemAn {
  @ApiProperty({ example: '', description: 'uuid as a  strings', required: false })
  @IsString()
  uuid: string;

  @ApiProperty({ example: '', description: 'Type as a string', required: false })
  @IsString()
  type: string;

  // Pen drawings store coordinates as an array of [x, y] point pairs,
  // i.e. number[][]. The previous declaration was a flat number[] with
  // @IsNumber({}, { each: true }), which made class-validator iterate the
  // outer array and reject every nested pair with "each value in lines
  // must be a number". Drop the per-element number validator — IsArray
  // is enough; the inner shape is enforced implicitly by the renderer
  // and the SP, which both treat lines as JSONB pairs.
  @ApiProperty({ example: [[12, 34], [12, 36]], description: 'array of [x, y] pen point pairs' })
  @IsArray()
  @IsOptional()
  lines: number[][];

  @ApiProperty({ example: 1, description: 'Page number or page identifier' })
  @IsNumber()
  page: number;

  @ApiProperty({ example: 1, description: 'Width of the annotation' })
  @IsNumber()
  @IsOptional()
  width: number;

  @ApiProperty({ type: [], description: 'Array of annotation objects' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => jRects)
  rects: jRects[];

  // Stroke STYLE the FE attaches to a pen/shape annotation (canvas colour /
  // thickness / opacity). Declared so the global ValidationPipe
  // (whitelist + forbidNonWhitelisted) keeps them instead of 400-ing a shape/pen
  // DocLink (a text DocLink leaves these undefined, so only shapes hit it). The
  // insert SP's jsonb_to_recordset only reads the columns it names, so these are
  // harmless extras.
  @ApiProperty({ example: '#e0483f', description: 'Stroke colour (hex)', required: false })
  @IsOptional()
  @IsString()
  color: string;

  @ApiProperty({ example: '#e0483f', description: 'Border colour (hex)', required: false })
  @IsOptional()
  @IsString()
  borderColor: string;

  @ApiProperty({ example: 3, description: 'Stroke width (px)', required: false })
  @IsOptional()
  @IsNumber()
  strokeWidth: number;

  @ApiProperty({ example: 1, description: 'Stroke opacity 0–1', required: false })
  @IsOptional()
  @IsNumber()
  opacity: number;
}

export class jRects {
  @ApiProperty({
    example: 42,
    description: 'Page number or page identifier'
  })
  @IsNumber()
  x: number;

  @ApiProperty({
    example: 42,
    description: 'Page number or page identifier'
  })
  @IsNumber()
  y: number;

  @ApiProperty({
    example: 22,
    description: 'Original page number or offset'
  })
  @IsNumber()
  height: number;

  @ApiProperty({
    example: 1,
    description: 'Original line number or offset'
  })
  @IsNumber()
  width: number;
}


export class quickfactUpdate {
  @ApiProperty({ example: 'uuid-string', description: 'nFSid must be a UUID' })
  @IsItUUID()
  nFSid: string;

  @ApiProperty({
    example: 'uuid-string',
    description: 'Colorid must be a UUID',
    required: false,
  })
  @IsItUUID()
  nColorid: string;

  @ApiProperty({ example: '["",""]', description: 'Users' })
  @IsString()
  jTexts: string;

  @ApiProperty({ example: '[[],[]]', description: 'Users' })
  @IsString()
  jIssue: string;

  @ApiProperty({
    example: '[1, 2, 3]',
    description: 'Array of contact IDs',
    required: false,
  })
  @IsOptional()
  @IsString()
  jContacts: string;

  @ApiProperty({ example: 'N', description: 'Is not edited' })
  @IsOptional()
  @IsString()
  cIsNote: string;

  @ApiProperty({ example: 1, description: 'Page number' })
  @IsNumber()
  nPage: number;

  @ApiProperty({ example: 1, description: 'Line number' })
  @IsNumber()
  nLine: number;

  @IsItUUID()
  nMasterid: string;
}

export class factDetailSingle {
  @ApiProperty({ example: 'uuid-string', description: 'nFSid must be a UUID' })
  @IsItUUID()
  nFSid: string;

  @IsItUUID()
  nMasterid: string;
}
export class InsertQuickFact {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the database entry',
  })
  @IsItUUID()
  @IsOptional()
  nSesid: string;

  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the database entry',
  })
  @IsItUUID()
  @IsOptional()
  nBDid: string;

  @ApiProperty({
    type: [jCordinateItem],
    description: 'Array of annotation objects',
  })

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => jCordinateItem)
  @IsOptional()
  jCordinates: jCordinateItem[];

  // @ApiProperty({ type: [jCoordinateItemAn], description: 'Array of annotation objects' })
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => jCoordinateItemAn)
  // @IsOptional()
  // jAn: jCoordinateItemAn[];


  @ApiProperty({ example: '[{}, {}]', description: 'Array of objects' })
  @IsOptional()
  @IsString()
  jAn?: string;

  @ApiProperty({
    example: '["example1", "example2"]',
    description: 'Array of strings',
  })
  @IsString()
  jT: string;

  @ApiProperty({
    example: '["example1", "example2"]',
    description: 'Array of strings',
  })
  @IsString()
  jOT: string;

  @ApiProperty({ example: 1, description: 'Color id', required: false })
  @IsItUUID()
  nColorid: string;

  @ApiProperty({
    example: '[[1, 2, 3], [1, 4, 3]]',
    description: 'Array of arrays of numbers',
  })
  @IsString()
  jIssues: string;

  @ApiProperty({
    example: '[1, 2, 3]',
    description: 'Array of contact IDs',
    required: false,
  })
  @IsOptional()
  @IsString()
  jContacts: string;

  @ApiProperty({ example: 'F', description: 'File type as a string' })
  @IsString()
  cFtype: string;

  @ApiProperty({ example: 'N', description: 'Is not edited' })
  @IsOptional()
  @IsString()
  cIsNote: string;

  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the database entry',
  })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({
    example: 'I',
    description: 'fact from, only I or RT are allowed',
  })
  @IsIn(['I', 'RT'])
  cFFrom: string;

  @ApiProperty({ example: 1, description: 'Page number' })
  @IsNumber()
  @IsOptional()
  nPage: number;

  @ApiProperty({ example: 1, description: 'Line number' })
  @IsNumber()
  @IsOptional()
  nLine: number;

  @ApiProperty({ example: 'S', description: 'fact type, only S or M are allowed' })
  @IsIn(['M', 'S'])
  @IsOptional()
  cType: string;

  @ApiProperty({ example: '{}', description: 'JSON of strings' })
  @IsOptional()
  @IsString()
  jLinktype: string;

  @IsOptional()
  @ApiProperty({ example: true, description: 'isHighlighted' })
  @IsBoolean()
  bIsHighlighted: boolean;

  @ApiProperty({
    example: '[1, 2, 3]',
    description: 'Array of team IDs',
    required: false,
  })
  @IsOptional()
  @IsString()
  jUsers: string;

  @IsItUUID()
  nMasterid: string;
}

export class InsertFact {
  @ApiProperty({
    example: 'uuid-string',
    description: 'Unique identifier for the database entry',
    required: false,
  })
  @IsItUUID()
  @IsOptional()
  nQFSid?: string;

  @ApiProperty({ example: 'uuid-string', description: 'nSesid' })
  @IsItUUID()
  @IsOptional()
  nSesid: string;


  @ApiProperty({ example: 'uuid-string', description: 'nBDid' })
  @IsItUUID()
  @IsOptional()
  nBDid: string;

  @ApiProperty({
    example: '["example1", "example2"]',
    description: 'Array of strings',
    required: false,
  })
  @IsString()
  jT: string;

  @ApiProperty({
    type: [jCordinateItem],
    description: 'Array of annotation objects',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => jCordinateItem)
  @IsOptional()
  jCordinates: jCordinateItem[];



  // @ApiProperty({ type: [jCoordinateItemAn], description: 'Array of annotation objects' })
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => jCoordinateItemAn)
  // @IsOptional()
  // jAn: jCoordinateItemAn[];

  @ApiProperty({ example: '[{}, {}]', description: 'Array of objects' })
  @IsOptional()
  @IsString()
  jAn?: string;

  @ApiProperty({ example: 1, description: 'File type', required: false })
  @IsNumber()
  nFt: number;

  @ApiProperty({ example: 1, description: 'State number', required: false })
  @IsNumber()
  nSt: number;

  @ApiProperty({
    example: '[[22, {}, [{}]]]',
    description: 'Array of arrays containing mixed types',
    required: false,
  })
  @IsString()
  jFl: string;

  @ApiProperty({
    example: 'uuid-string',
    description: 'Color id',
    required: false,
  })
  @IsItUUID()
  nColorid: string;

  @ApiProperty({
    example: '[[1, 2, 3], [1, 4, 3]]',
    description: 'Array of arrays of numbers',
  })
  @IsString()
  jIssues: string;

  @ApiProperty({
    example: '[1, 2, 3]',
    description: 'Array of contact IDs',
    required: false,
  })
  @IsString()
  jContacts: string;

  @ApiProperty({
    example: '[1, 2, 3]',
    description: 'Array of task IDs',
    required: false,
  })
  @IsString()
  jTasks: string;

  @ApiProperty({
    example: '[1, 2, 3]',
    description: 'Array of team IDs',
    required: false,
  })
  @IsString()
  jUsers: string;

  @ApiProperty({ example: 'F', description: 'File type as a string' })
  @IsString()
  cFtype: string;

  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the database entry',
  })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({
    example: 'I',
    description: 'fact from, only I or RT are allowed',
  })
  @IsIn(['I', 'RT'])
  cFFrom: string;

  @ApiProperty({
    example: '[{}]',
    description: 'Array of date objects',
    required: false,
  })
  @IsString()
  jDate: string;

  @ApiProperty({
    example: '["example1", "example2"]',
    description: 'Array of strings',
    required: false,
  })
  @IsString()
  jOT: string;


  @ApiProperty({ example: 1, description: 'Page number' })
  @IsNumber()
  @IsOptional()
  nPage: number;

  @ApiProperty({ example: 1, description: 'Line number' })
  @IsNumber()
  @IsOptional()
  nLine: number;

  @ApiProperty({ example: 'S', description: 'fact type, only S or M are allowed' })
  @IsIn(['M', 'S'])
  @IsOptional()
  cType: string;

  @ApiProperty({ example: '{}', description: 'JSON of strings' })
  @IsOptional()
  @IsString()
  jLinktype: string;

  @IsOptional()
  @ApiProperty({ example: true, description: 'isHighlighted' })
  @IsBoolean()
  bIsHighlighted: boolean;

  @IsItUUID()
  nMasterid: string;
}

export class fectsheetDetailReq {
  @ApiProperty({ example: 'uuid-string', description: 'nFSid' })
  @IsItUUID()
  nFSid: string;

  @IsOptional()
  @IsItUUID()
  nMasterid: string;
}

export class saveFactSheet {
  @ApiProperty({ example: 'uuid-string', description: 'nFSid' })
  @IsItUUID()
  nFSid: string;

  @ApiProperty({ example: 'uuid-string', description: 'nSesid' })
  @IsItUUID()
  @IsOptional()
  nSesid: string;

  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the database entry',
  })
  @IsItUUID()
  @IsOptional()
  nBundledetailid: string;

  @ApiProperty({
    example: '["example1", "example2"]',
    description: 'Array of strings',
    required: false,
  })
  @IsString()
  jT: string;

  @ApiProperty({ example: 1, description: 'File type', required: false })
  @IsNumber()
  nFt: number;

  @ApiProperty({ example: 1, description: 'State number', required: false })
  @IsNumber()
  nSt: number;

  @ApiProperty({
    example: '',
    description: 'Array of arrays containing mixed types',
    required: false,
  })
  @IsString()
  jFl: string;

  @ApiProperty({
    example: 'uuid-string',
    description: 'Color id',
    required: false,
  })
  @IsItUUID()
  nColorid: string;

  @ApiProperty({ example: '', description: 'Array of arrays of numbers' })
  @IsString()
  jIssues: string;

  @ApiProperty({
    example: '',
    description: 'Array of contact IDs',
    required: false,
  })
  @IsString()
  jContacts: string;

  @ApiProperty({
    example: '',
    description: 'Array of task IDs',
    required: false,
  })
  @IsString()
  jTasks: string;

  @ApiProperty({
    example: '',
    description: 'Array of team IDs',
    required: false,
  })
  @IsOptional()
  @IsString()
  jUsers: string;

  @ApiProperty({
    example: '[{}]',
    description: 'Array of date objects',
    required: false,
  })
  @IsString()
  jDate: string;


  @IsOptional()
  @ApiProperty({ example: true, description: 'isUpdated' })
  @IsBoolean()
  bIsUserUpdated: boolean;


  @IsOptional()
  @IsItUUID()
  nMasterid: string;
}

export class unshareDTO {
  @ApiProperty({ example: 'uuid-string', description: 'nFSid' })
  @IsItUUID()
  nFSid: string;

  @IsOptional()
  @IsItUUID()
  nMasterid: string;
}

export class UpdatePermissionsRequestBody {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Fact  ID',
  })
  @IsString()
  nFSid: string;

  @ApiProperty({ example: 1, description: 'grantedusers' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPermission)
  selectedUsers: UserPermission[];

  @ApiProperty({ example: 1, description: 'revokes' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPermission)
  revokes: UserPermission[];

  @IsItUUID()
  nMasterid: string;
}

export class UserPermission {
  @ApiProperty({ example: 'uuid-string', description: 'User ID' })
  @IsItUUID()
  nUserid: string;

  @IsOptional()
  @ApiProperty({ example: true, description: 'Can edit' })
  @IsBoolean()
  canEdit: boolean;

  @IsOptional()
  @ApiProperty({ example: true, description: 'Can reshare' })
  @IsBoolean()
  canReshare: boolean;

  @IsOptional()
  @ApiProperty({ example: true, description: 'Can comment' })
  @IsBoolean()
  canComment: boolean;
}




export class InsertFactGlobalV2 {

  @ApiProperty({ example: "uuid-string", description: 'Unique identifier for the database entry', required: false })
  @IsItUUID()
  @IsOptional()
  nFSid?: string;

  @ApiProperty({ example: "uuid-string", description: 'nBDid' })
  @IsItUUID()
  nBDid: string;

  @ApiProperty({ example: '["example1", "example2"]', description: 'Array of strings', required: false })
  @IsString()
  jT: string;

  @ApiProperty({ type: [jCoordinateItemAn], description: 'Array of annotation objects' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => jCoordinateItemAn)
  @IsOptional()
  jAn: jCoordinateItemAn[];

  @ApiProperty({ example: 1, description: 'File type', required: false })
  @IsNumber()
  nFt: number;

  @ApiProperty({ example: 1, description: 'State number', required: false })
  @IsNumber()
  nSt: number;

  @ApiProperty({ example: '[[22, {}, [{}]]]', description: 'Array of arrays containing mixed types', required: false })
  @IsString()
  jFl: string;

  @ApiProperty({ example: "uuid-string", description: 'Color id', required: false })
  @IsItUUID()
  nColorid: string;

  @ApiProperty({ example: '[[1, 2, 3], [1, 4, 3]]', description: 'Array of arrays of numbers' })
  @IsString()
  jIssues: string;

  @ApiProperty({ example: '[1, 2, 3]', description: 'Array of contact IDs', required: false })
  @IsString()
  jContacts: string;

  @ApiProperty({ example: '[1, 2, 3]', description: 'Array of task IDs', required: false })
  @IsString()
  jTasks: string;

  @ApiProperty({ example: '[1, 2, 3]', description: 'Array of team IDs', required: false })
  @IsString()
  jUsers: string;

  @ApiProperty({ example: 'F', description: 'File type as a string' })
  @IsString()
  cFtype: string;

  @ApiProperty({ example: 1, description: 'Unique identifier for the database entry' })
  @IsItUUID()
  nCaseid: string;


  @ApiProperty({ example: 'I', description: 'fact from, only I or RT are allowed' })
  @IsIn(['I', 'RT'])
  cFFrom: string;

  @ApiProperty({ example: '[{}]', description: 'Array of date objects', required: false })
  @IsString()
  jDate: string;

  @ApiProperty({ example: '["example1", "example2"]', description: 'Array of strings', required: false })
  @IsString()
  jOT: string;

  @ApiProperty({ example: 1, description: 'Page number' })
  @IsNumber()
  @IsOptional()
  nPage: number;

  @ApiProperty({ example: 1, description: 'Line number' })
  @IsNumber()
  @IsOptional()
  nLine: number;

  @ApiProperty({ example: 'S', description: 'fact type, only S or M are allowed' })
  @IsIn(['M', 'S'])
  cType: string;

  @ApiProperty({ example: '{}', description: 'JSON of strings' })
  @IsOptional()
  @IsString()
  jLinktype: string;

  @IsItUUID()
  nMasterid?: string;
}