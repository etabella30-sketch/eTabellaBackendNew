import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, isObject } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";



export class fileListReq {
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nSectionid: string;


    @ApiProperty({ example: 'T', description: '' })
    @IsString()
    cHyperlinktype: string;



    @ApiProperty({ example: 'Master Bundle', description: '' })
    @IsString()
    cFilename: string;

    @ApiProperty({ example: '["Tab","cTab",80],["Name","cFilename","*"],["Date","dIntrestDt",75],["Description","cDescription",80],["Page","cRefpage",40],["Exhibit","cExhibitno",75]', description: '' })
    @IsString()
    column: string;


    @ApiProperty({ example: false, description: 'Cover page' })
    // @Transform(({ value }) => value, { toClassOnly: true })
    @IsBoolean()
    bCoverpg?: boolean;

    @ApiProperty({ example: false, description: 'Index page' })
    // @Transform(({ value }) => value, { toClassOnly: true })
    @IsBoolean()
    bIndexpg?: boolean;

    @IsItUUID()
    nMasterid?: string;
}


export class updateIndexReq {
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nSectionid: string;

    @ApiProperty({ example: 'doc/Case22/index.pdf', description: '' })
    @IsString()
    cPath: string;


    @ApiProperty({ example: 2, description: '' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'nPage must be a number conforming to the specified constraints' })
    nPage: number;


    @IsItUUID()
    @IsOptional()
    nMasterid?: string;
}

export class fileListRes {
    msg: number;
    value?: string;
    error?: any;
    casedetail?: any;
    bundlelist?: any;
    // nCaseid?: string;
    // cCasename?: string;
    // cCaseno?: string;
    // dUpdateDt?: string;
}