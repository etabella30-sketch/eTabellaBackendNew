import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, isBoolean, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";



export class fileConvertReq {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6', description: '' })
    @IsItUUID()
    nBundledetailid?: string;

    @ApiProperty({ example: 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7', description: '' })
    @IsItUUID()
    nCaseid?: string;

    @IsItUUID()
    nMasterid?: string;
}


export class fileURLReq {
    @ApiProperty({ example: '', description: '' })
    @IsString()
    cPath?: string;

}




export class fileOcrReq {
    @ApiProperty({ example: 'c3d4e5f6-g7h8-9i0j-1k2l-m3n4o5p6q7r8', description: '' })
    @IsItUUID()
    nBundledetailid?: string;

    @ApiProperty({ example: 1, description: '' })
    @IsNumber({}, { message: 'nOcrtype must be a number conforming to the specified constraints' })
    nOcrtype: number

    @IsItUUID()
    nMasterid?: string;
}




export class updateConvertNativeFileReq {
    nMasterid: string;
    cFilename: string;
    nSectionid: string;
    nBundleid: string;
    nBundledetailid: string;
    cFiletype: string;
    isValidate: boolean;
    cPath: string;
    cFilesize: string;
    nPagerotation: number;
    cPage: string;
    bisTranscript: boolean;
    nBaseBDid?: string;
}




export class EmailparseReq {
    @ApiProperty({ example: '', description: 'cPath in only string' })
    @IsString()
    cPath: string;

    @ApiProperty({ example: '', description: 'nCaseid is now a UUID string' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: '', description: 'cOutputpath in only string' })
    @IsString()
    cOutputpath: string;

    @ApiProperty({ example: 4, description: '' })
    @IsItUUID()
    nId: string;

    @IsItUUID()
    nMasterid?: string;
}


export class FileAttachment {
    cPath: string;
    cFilename: string;
    dataType: string;
    data: any;
}


export class convertFileMulti {

    @ApiProperty({ example: 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9', description: 'Case id', required: true })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 'e5f6g7h8-i9j0-1k2l-3m4n-o5p6q7r8s9t0', description: 'Section id', required: true })
    @IsItUUID()
    nSectionid: string;

    @ApiProperty({ example: '', description: 'Bundle ids', required: false })
    @IsString()
    @IsOptional()
    jBids: string;


    @ApiProperty({ example: '', description: 'Bundle detail ids', required: false })
    @IsString()
    @IsOptional()
    jBDids: string;


    @ApiProperty({ example: [], description: 'File types', required: false })
    @IsArray()
    @IsOptional()
    jFtypes: string[];

    @ApiProperty({ example: true, description: 'Metadata', required: false })
    @IsBoolean()
    @IsOptional()
    bMetadata: boolean;

    @ApiProperty({ example: 0, description: 'Convert Type', required: false })
    @IsString()
    @IsOptional()
    cConvertType: string;


    @IsItUUID()
    nMasterid?: string;
}

export class convertQueue {

    @ApiProperty({ example: 'f6g7h8i9-j0k1-2l3m-4n5o-p6q7r8s9t0u1', description: 'Case id', required: true })
    @IsItUUID()
    nCaseid: string;


    @IsItUUID()
    nMasterid?: string;
}
