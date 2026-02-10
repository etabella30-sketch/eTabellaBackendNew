import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class excelReport {

    @ApiProperty({ example: 0, description: '' })
    @IsItUUID()
    nUPid: string;

    @ApiProperty({ example: "", description: '' })
    @IsOptional()
    @IsString()
    cStatus?: string;

    
    @ApiProperty({ example: 0, description: '' })
    @IsItUUID()
    nCaseid: string;
    
    @ApiProperty({ example: "", description: '' })
    @IsOptional()
    @IsString()
    cFiletype?: string;

    @IsItUUID()
    nMasterid?: string;
}


export class exportSummary{
    nUPid: string;
    cUnicid: string;
    cBundlename: string;
    cFolder: string;
    totalfiles: number;
}






export class deleteFilesReq {

    @ApiProperty({ example: ["uuid1", "uuid2"], description: 'Array of file IDs' })
    @IsString({ each: true, message: 'Each value in jFiles must be a string' })
    jFiles: string[];

    @ApiProperty({ example: 0, description: '' })
    @IsItUUID()
    nCaseid: string;
    
    // @ApiProperty({ example: ["uuid1", "uuid2"], description: 'Array of folder  IDs' })
    // @IsString({}, { each: true, message: 'Each value in jFolders must be a string' })
    // jFolders: string[];


    @IsItUUID()
    nMasterid?: string;
}
