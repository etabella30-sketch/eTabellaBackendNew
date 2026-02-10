import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsBoolean, IsIn, IsNumber, IsObject, IsOptional, IsString, ValidateNested, isBoolean, isNumber, isString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { Type } from "class-transformer";

export class InsertFact {

    @ApiProperty({ example: "uuid-string", description: 'Unique identifier for the database entry', required: false })
    @IsItUUID()
    @IsOptional()
    nQFSid?: string;

    @ApiProperty({ example: "uuid-string", description: 'Bundle Detail id ' })
    @IsItUUID()
    nBDid: string;

    @ApiProperty({ example: '["example1", "example2"]', description: 'Array of strings', required: false })
    @IsString()
    jT: string;

    @ApiProperty({ example: '["example1", "example2"]', description: 'Array of strings', required: false })
    @IsString()
    jOT: string;

    @ApiProperty({ example: '[{}, {}]', description: 'Array of objects', required: false })
    @IsString()
    jAn: string;

    @ApiProperty({ example: 1, description: 'File type', required: false })
    @IsNumber()
    nFt: number;

    @ApiProperty({ example: 1, description: 'State number', required: false })
    @IsNumber()
    nSt: number;

    @ApiProperty({ example: '[[22, {}, [{}]]]', description: 'Array of arrays containing mixed types', required: false })
    @IsString()
    jFl: string;

    @ApiProperty({ example: 1, description: 'Timezone identifier', required: false })
    @IsNumber()
    nTZid: number;

    @ApiProperty({ example: "uuid-string", description: 'Color id', required: false })
    @IsItUUID()
    nColorid: string;


    @ApiProperty({ example: '[{}]', description: 'Array of date objects', required: false })
    @IsString()
    jDate: string;

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

    @ApiProperty({ example: 'S', description: 'Type as a string' })
    @IsString()
    cType: string;

    @ApiProperty({ example: 'F', description: 'File type as a string' })
    @IsString()
    cFtype: string;


    @ApiProperty({ example: '{}', description: 'File type as a string' })
    @IsString()
    jLinktype: string;

    @ApiProperty({ example: false, description: 'bIsHighlighted', required: true })
    @IsBoolean()
    bIsHighlighted: Boolean;


    @IsItUUID()
    nMasterid?: string;
}


export class resInsertFact {
    msg: number;
    value?: string;
    nFSid?: string;
    color?: string;
    error?: any;
}

export class jCoordinateItem {
    @ApiProperty({ example: '', description: 'uuid as a  strings', required: false })
    @IsString()
    uuid: string;

    @ApiProperty({ example: '', description: 'Type as a string', required: false })
    @IsString()
    type: string;

    @ApiProperty({ example: [], description: 'line number identifier' })
    @IsNumber({}, { each: true })
    @IsOptional()
    lines: number[];

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



export class resInsertData {
    msg: number;
    value?: string;
    error?: any;
    data?: any;
}




export class factDetailSingle {
    @ApiProperty({ example: 0, description: 'nFSid must be a number' })
    @IsItUUID()
    nFSid: string;

    @IsItUUID()
    nMasterid?: string;
}


export class factDetail {

    @ApiProperty({ example: "[1, 2, 3]", description: 'Array of team IDs' })
    @IsString()
    jFSids: string;


    @IsItUUID()
    nMasterid?: string;
}



export class InsertQuickFact {
    @ApiProperty({ example: 1, description: 'Unique identifier for the database entry' })
    @IsItUUID()
    nBDid: string;

    @ApiProperty({ example: '[{}, {}]', description: 'Array of objects' })
    @IsString()
    jAn: string;


    @ApiProperty({ example: '["example1", "example2"]', description: 'Array of strings' })
    @IsString()
    jT: string;

    @ApiProperty({ example: 1, description: 'Color id', required: false })
    @IsItUUID()
    nColorid: string;

    @ApiProperty({ example: '["example1", "example2"]', description: 'Array of strings' })
    @IsString()
    jOT: string;


    @ApiProperty({ example: '[[1, 2, 3], [1, 4, 3]]', description: 'Array of arrays of numbers' })
    @IsString()
    jIssues: string;

    @ApiProperty({ example: '[1, 2, 3]', description: 'Array of contact IDs', required: false })
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

    @ApiProperty({ example: '[{}, {}]', description: 'Array of objects' })
    @IsString()
    jLinktype: string;

    @IsItUUID()
    nMasterid?: string;
}




export class factUpdate {
    @ApiProperty({ example: "uuid-string", description: 'nFSid must be a UUID' })
    @IsItUUID()
    nFSid: string;


    @ApiProperty({ example: 0, description: 'nFiletype must be a number', required: false })
    @IsNumber()
    nFiletype: number;

    @ApiProperty({ example: 0, description: 'nStatus must be a number', required: false })
    @IsNumber()
    nStatus: number;


    @ApiProperty({ example: 0, description: 'nTZid must be a number', required: false })
    @IsNumber()
    nTZid: number;


    @ApiProperty({ example: "uuid-string", description: 'Colorid must be a UUID', required: false })
    @IsItUUID()
    nColorid: string;


    @ApiProperty({ example: '[1,2]', description: 'Users' })
    @IsString()
    jU: string;

    @ApiProperty({ example: '["",""]', description: 'Users' })
    @IsString()
    jTexts: string;


    @ApiProperty({ example: '[1,2]', description: 'Users' })
    @IsString()
    jT: string;

    @ApiProperty({ example: '[[],[]]', description: 'Users' })
    @IsString()
    jL: string;

    @ApiProperty({ example: '[[],[]]', description: 'Users' })
    @IsString()
    jIssue: string;

    @ApiProperty({ example: '[1,2]', description: 'Users' })
    @IsString()
    jC: string;

    @ApiProperty({ example: false, description: 'bIsHighlighted', required: true })
    @IsBoolean()
    bIsHighlighted: Boolean;

    @ApiProperty({ example: {}, description: 'Users' })
    @IsObject()
    jDate: any;

    @IsItUUID()
    nMasterid?: string;
}



export class highlightDelete {
    @ApiProperty({ example: 1, description: 'nFSid for the database entry' })
    @IsItUUID()
    nFSid: string;

    @ApiProperty({ example: '', description: 'Array of objects' })
    @IsString()
    uuid: string;

    @IsItUUID()
    nMasterid?: string;
}





export class addhighlight {
    @ApiProperty({ example: 1, description: 'nFSid for the database entry' })
    @IsItUUID()
    nFSid: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsString()
    cText: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsString()
    uuid: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsString()
    type: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsString()
    rects: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsString()
    lines: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsNumber()
    width: Number;

    @ApiProperty({ example: '', description: '', required: false })
    @IsNumber()
    page: Number;


    @ApiProperty({ example: '{}', description: 'File type as a string' })
    @IsString()
    jLinktype: string;

    @IsItUUID()
    nMasterid?: string;
}






export class factConvertMDL {
    @ApiProperty({ example: 1, description: 'nFSid for the database entry' })
    @IsItUUID()
    nFSid: string;


    @ApiProperty({ example: '{}', description: 'File type as a string' })
    @IsString()
    jLinktype: string;

    @IsItUUID()
    nMasterid?: string;
}





export class quickfactUpdate {
    @ApiProperty({ example: "uuid-string", description: 'nFSid must be a UUID' })
    @IsItUUID()
    nFSid: string;


    @ApiProperty({ example: "uuid-string", description: 'Colorid must be a UUID', required: false })
    @IsItUUID()
    nColorid: string;


    @ApiProperty({ example: '["",""]', description: 'Users' })
    @IsString()
    jTexts: string;

    @ApiProperty({ example: '[[],[]]', description: 'Users' })
    @IsString()
    jIssue: string;

    @ApiProperty({ example: '[1, 2, 3]', description: 'Array of contact IDs', required: false })
    @IsOptional()
    @IsString()
    jContacts: string;


    @ApiProperty({ example: 'N', description: 'Is not edited' })
    @IsOptional()
    @IsString()
    cIsNote: string;

    @IsItUUID()
    nMasterid?: string;
}






export class factNoteUpdateReq {
    @ApiProperty({ example: 1, description: 'nFSid for the database entry' })
    @IsItUUID()
    nFSid: string;


    @ApiProperty({ example: '[]', description: 'Note here' })
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1) // Optional: Ensures at least one string is in the array
    jTexts: string[];

    @IsItUUID()
    nMasterid?: string;
}


export class InsertQuickFactV2 {
    @ApiProperty({ example: 1, description: 'Unique identifier for the database entry' })
    @IsItUUID()
    nBDid: string;

    @ApiProperty({ type: [jCoordinateItem], description: 'Array of annotation objects' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => jCoordinateItem)
    jAn: jCoordinateItem[];


    @ApiProperty({ example: '["example1", "example2"]', description: 'Array of strings' })
    @IsString()
    jT: string;

    @ApiProperty({ example: 1, description: 'Color id', required: false })
    @IsItUUID()
    nColorid: string;

    @ApiProperty({ example: '[[1, 2, 3], [1, 4, 3]]', description: 'Array of arrays of numbers' })
    @IsString()
    jIssues: string;

    @ApiProperty({ example: '[1, 2, 3]', description: 'Array of contact IDs', required: false })
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

    @ApiProperty({ example: 1, description: 'Unique identifier for the database entry' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 'I', description: 'fact from, only I or RT are allowed' })
    @IsIn(['I', 'RT'])
    cFFrom: string;

    @ApiProperty({ example: 1, description: 'nPage', required: false })
    @IsNumber()
    nPage: number;


    @IsItUUID()
    nMasterid?: string;
}


export class InsertFactV2 {

    @ApiProperty({ example: "uuid-string", description: 'Unique identifier for the database entry', required: false })
    @IsItUUID()
    @IsOptional()
    nFSid?: string;

    @ApiProperty({ example: "uuid-string", description: 'nBDid' })
    @IsItUUID()
    nBDid : string;

    @ApiProperty({ example: '["example1", "example2"]', description: 'Array of strings', required: false })
    @IsString()
    jT: string;

    @ApiProperty({ type: [jCoordinateItem], description: 'Array of annotation objects' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => jCoordinateItem)
    jAn: jCoordinateItem[];

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
    nPage: number;

    @ApiProperty({ example: 1, description: 'Line number' })
    @IsNumber()
    nLine: number;

    @IsItUUID()
    nMasterid?: string;
}
