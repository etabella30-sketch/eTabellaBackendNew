import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import exp from "constants";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class batchdownloadReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true })
    @IsItUUID()
    nCaseid?: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true })
    @IsItUUID()
    nSectionid?: string;

    @ApiProperty({ example: '{550e8400-e29b-41d4-a716-446655440000, aaae8400-e29b-41d4-a716-446655440000}', description: 'is apply to all', required: false })
    @IsOptional()
    @IsString()
    cBundleids?: string;

    @ApiProperty({ example: 'example.xlsx', description: 'is apply to all', required: true })
    @IsString()
    cFilename: string;


    @ApiProperty({ example: '["Tab","cTab"],["Name","cFilename"],["Date","dIntrestDt"],["Description","cDescription"],["Page","cRefpage"],["Exhibit","cExhibitno"]', description: '' })
    @IsString()
    column: string;

    @IsItUUID()
    nMasterid?: string;
}



export class batchColumnReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true })
    @IsOptional()
    @IsItUUID()
    nCaseid?: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true })
    @IsOptional()
    @IsItUUID()
    nSectionid?: string;

    @IsItUUID()
    nMasterid?: string;
}


export class batchDwdpathReq {

    @ApiProperty({ example: '', description: 'is apply to all', required: true })
    @IsString()
    cPath?: string;

    @IsItUUID()
    nMasterid?: string;
}

export class batchUploadReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true })
    @IsItUUID()
    nCaseid?: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true })
    @IsItUUID()
    nSectionid?: string;

    @ApiProperty({ example: '', description: 'is apply to all', required: true })
    @IsString()
    cPath?: string;

    @ApiProperty({ example: '["Tab","cTab"],["Name","cFilename"],["Date","dIntrestDt"],["Description","cDescription"],["Page","cRefpage"],["Exhibit","cExhibitno"]', description: '' })
    @IsString()
    column: string;


    @IsItUUID()
    nMasterid?: string;

}



export class batchdownloadRes {
    msg?: Number;
    value?: string;
    error?: any;
    data?: any;
}



export class batchLogReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true })
    @IsItUUID()
    nCaseid?: string;

    @IsItUUID()
    nMasterid?: string;

}

export class batchLogDetailReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true })
    @IsItUUID()
    nBlogid?: string;


    @IsItUUID()
    nMasterid?: string;
}


export class batchLogRes {
    cBatchno?: string;
    nBlogid?: string;
    cFilename?: string;
    cColumn?: string;
    cStatus?: string;
    dUpdateDt?: string;
    msg?: Number;
    value?: string;
    error?: any;
}