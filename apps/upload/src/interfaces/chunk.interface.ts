import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class ChunkStatus {
    max: number;
    msg: number;
}

export class ChunkStatusReq {
    @ApiProperty({ example: "unic", description: '' })
    @IsString()
    identifier?: string;

    @ApiProperty({ example: '', description: '' })
    @IsItUUID()
    @IsOptional()
    nUPid: string;

    @ApiProperty({ example: '', description: '' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: "path", description: '' })
    @IsString()
    cPath?: string;


    @ApiProperty({ example: "total", description: '' })
    @IsString()
    cTotal?: string;

    @IsItUUID()
    nMasterid?: string;
}

export class UploadResponce {
    m: number;
    i: number;
}



export class MergeChunksReq {
    @ApiProperty({ example: "unic", description: '' })
    @IsString()
    identifier?: string;


    @ApiProperty({ example: '', description: '' })
    @IsOptional()
    @IsItUUID()
    nUPid: string;


    @ApiProperty({ example: "name", description: '' })
    @IsString()
    name?: string;

    @ApiProperty({ example: "", description: '' })
    @IsString()
    filetype?: string;

    @ApiProperty({ example: "", description: '' })
    @IsString()
    cFilename?: string;


    @ApiProperty({ example: 0, description: '' })
    @IsNumber()
    totalChunks?: number;


    @ApiProperty({ example: 'b8a4c7d1-e956-4c70-9d6b-f3e1c2a3b4d5', description: '' })
    @IsOptional()
    @IsItUUID()
    @IsOptional()
    nBundleid?: string;


    @ApiProperty({ example: 'c9b5d8e2-f067-5d81-0e7c-g4f2d3a4b5e6', description: '' })
    @IsOptional()
    @IsItUUID()
    nSectionid?: string;

    @ApiProperty({ example: 'd0c6e9f3-g178-6e92-1f8d-h5g3e4a5b6f7', description: '' })
    @IsOptional()
    @IsItUUID()
    nUDid?: string;


    @ApiProperty({ example: 'e1d7f0a4-h289-7f03-2g9e-i6h4f5a6b7g8', description: '' })
    @IsOptional()
    @IsItUUID()
    @IsOptional()
    nBundledetailid?: string;

    @ApiProperty({ example: 0, description: '' })
    @IsNumber()
    filesize?: number;

    @ApiProperty({ example: 'f2e8g1b5-i390-8g14-3h0f-j7i5g6b7h8i9', description: '' })
    @IsItUUID()
    nCaseid?: string;

    @IsBoolean()
    @IsOptional()
    bisTranscript?: boolean;

    @IsBoolean()
    @IsOptional()
    bIsconvert?: boolean;

    @IsString()
    @IsOptional()
    converttype?: string;


    @IsBoolean()
    @IsOptional()
    bIsocr?: boolean;

    @IsNumber()
    @IsOptional()
    nOcrtype?: number;

    @IsItUUID()
    nMasterid?: string;
}




export interface FileValidateResponse {
    isValidate: boolean,
    totalpages: number,
    totalsizeoffile: number,
    pagerotation: number,
    isLinerised: boolean
}






export class uploadStatusSet {

    @ApiProperty({ example: '', description: '' })
    @IsItUUID()
    nUPid: string;

    @ApiProperty({ example: '', description: '' })
    @IsNumber()
    nTotal: number;

    @IsItUUID()
    nMasterid?: string;
}


export class UploadUPid {
    @IsItUUID()
    nUPid: string;

    @IsNumber()
    nTotal: number;

    @IsNumber()
    nComplete: number;

    @IsNumber()
    nFailed: number;
}

export class UploadJob {
    @ApiProperty({ example: [], description: 'Array of upload job IDs' })
    @IsArray()
    jUPids: UploadUPid[];

    @ApiProperty({ example: 1, description: 'Master ID of the upload job', required: false })
    @IsItUUID()
    nMasterid?: string;
}