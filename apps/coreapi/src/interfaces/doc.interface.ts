import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsIn, IsNumber, IsObject, IsOptional, IsString, ValidateNested, isBoolean, isNumber, isString } from "class-validator";
import { jCoordinateItem } from "./fact.interface";
import { Type } from "class-transformer";

// export class InsertDoc {
//     @ApiProperty({ example: "uuid-string", description: 'Unique identifier for the database entry' })
//     @IsItUUID()
//     nBDid: string;

//     @ApiProperty({ example: '', description: 'Array of strings' })
//     @IsString({ each: true })
//     jLT: string;

//     @ApiProperty({ example: '[{}, {}]', description: 'Array of objects' })
//     @IsString()
//     jAn: string;

//     @ApiProperty({ example: '[[22, {}, [{}]]]', description: 'Array of arrays containing mixed types' })
//     @IsString()
//     jDl: string;

//     @ApiProperty({ example: '["",""]', description: 'Array of arrays containing mixed types' })
//     @IsString()
//     jOT: string;

//     @ApiProperty({ example: '[1, 2, 3]', description: 'Array of team IDs' })
//     @IsString()
//     jUsers: string;


//     @ApiProperty({ example: 'S', description: 'Type as a string' })
//     @IsString()
//     cType: string;


//     @IsItUUID()
//     nMasterid?: string;
// }




export class InsertDoc {
    @ApiProperty({ example: 1, description: 'Unique identifier for the database entry' })
    @IsItUUID()
    nBundledetailid: string;

    // @ApiProperty({ example: '', description: 'Array of strings' })
    // @IsString({ each: true })
    // jLT: string;

    @ApiProperty({ type: [jCoordinateItem], description: 'Array of annotation objects' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => jCoordinateItem)
    jAn: jCoordinateItem[];

    @ApiProperty({ example: '[[22, {}, [{}]]]', description: 'Array of arrays containing mixed types' })
    @IsString()
    jDl: string;

    @ApiProperty({ example: '["",""]', description: 'Array of arrays containing mixed types' })
    @IsString()
    jOT: string;

    @ApiProperty({ example: '["example1", "example2"]', description: 'Array of strings' })
    @IsString()
    jT: string;

    @ApiProperty({ example: '[1, 2, 3]', description: 'Array of team IDs' })
    @IsString()
    jUsers: string;


    @ApiProperty({ example: 'S', description: 'Type as a string' })
    @IsString()
    cType: string;

    @ApiProperty({ example: 1, description: 'Unique identifier for the database entry' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 'I', description: 'Doc from, only I or RT are allowed' })
    @IsIn(['I', 'RT'])
    cDFrom: string;

    @ApiProperty({ example: 1, description: 'Page number' })
    @IsNumber()
    nPage: number;

    @ApiProperty({ example: 1, description: 'Line number' })
    @IsNumber()
    nLine: number;

    @IsItUUID()
    nMasterid?: string;
}


export class resInsertDoc {
    msg: number;
    value?: string;
    nDocid?: string;
    error?: any;
}

export class docID {
    @ApiProperty({ example: "uuid-string", description: 'nDocid for the database entry' })
    @IsItUUID()
    nDocid: string;

    @ApiProperty({ example: "uuid-string", description: 'nDMLids for the database entry' })
    @IsItUUID()
    nDMLids: string;

    @IsItUUID()
    nMasterid?: string;
}


export class docIDmulti {
    @ApiProperty({ example: "[\"uuid-1\", \"uuid-2\", \"uuid-3\"]", description: 'Array of document UUIDs' })
    @IsString()
    jDocids: string;

    @IsItUUID()
    nMasterid?: string;
}