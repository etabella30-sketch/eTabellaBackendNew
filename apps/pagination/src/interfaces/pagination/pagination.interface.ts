import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, isNumber } from 'class-validator';
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class jPaginationobj {
    @ApiProperty({ example: '#fff', description: 'Background color' })
    @IsString()
    bc: string;

    @ApiProperty({ example: '#000', description: 'Font color' })
    @IsString()
    fc: string;

    @ApiProperty({ example: '16', description: 'Font size' })
    @IsString()
    fs: string;

    @ApiProperty({ example: 'arial', description: 'Font type' })
    @IsString()
    ft: string;

    @ApiProperty({ example: false, description: 'Hide pagination' })
    @IsBoolean()
    isHide: boolean;

    @ApiProperty({ example: 'BR', description: 'Position of pagination' })
    @IsString()
    position: string;
}



export class getpaginationReq {
    @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '', required: false })
    @IsItUUID()
    @IsOptional()
    nPtaskid?: string;

    @IsItUUID()
    nMasterid?: string;
}


export class paginationReq {
    @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' })
    @IsOptional()
    @IsItUUID()
    nSectionid: string;

    @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' })
    @IsOptional()
    @IsItUUID()
    nBundleid: string;

    @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '', required: true })
    @IsOptional()
    @IsItUUID()
    nBundledetailid: string;

    @ApiProperty({ example: '1-1', description: '', required: false })
    @IsString()
    @IsOptional()
    cRefpage: String;

    @ApiProperty({ example: { "bc": "#fff", "fc": "#000", "fs": "16", "ft": "arial", "isHide": false, "position": "BR" }, description: '', required: false })
    @IsObject()
    jPagination: object;

    @ApiProperty({ example: false, description: 'is apply to all', required: false })
    @IsBoolean()
    bApplyall: boolean;

    @ApiProperty({ example: false, description: 'is cover page', required: false })
    @IsBoolean()
    bPagedefault: boolean;
    
    @ApiProperty({ example: false, description: 'is cover page', required: false })
    @IsBoolean()
    @IsOptional()
    bIslater: boolean;
    
    @ApiProperty({ example: '1-1', description: '', required: false })
    @IsString()
    @IsOptional()
    cStartPrefix: String;

    @IsItUUID()
    nMasterid?: string;
}


export class paginationFileReq {
    @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' })
    @IsOptional()
    @IsItUUID()
    nSectionid: string;

    @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}


export class paginationRes {
    msg?: number;
    value?: string;
    error?: any;
    data?: any;
}




export interface getpaginationRes {
    msg?: number;
    value?: string;
    error?: any;
    total_prog?: number;
    comp_progres?: number;
    nPtaskid?: string;
    nCaseid?: string;
    cStatus?: string;
    jIds?: string[];
}


export class stoppaginationReq {
    @ApiProperty({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' })
    @IsItUUID()
    nPtaskid: string;

    @IsItUUID()
    nMasterid?: string;
}


