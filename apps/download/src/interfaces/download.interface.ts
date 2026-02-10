import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class DownloadProcess {

    @ApiProperty({ example: 1, description: '' })
    @IsItUUID()
    nCaseid: string;


    @ApiProperty({ example: 1, description: 'Section id' })
    @IsOptional()
    @IsItUUID()
    nSectionid: string;

    @ApiProperty({ example: 1, description: 'Download Taskid id' })
    @IsItUUID()
    @IsOptional()
    nDTaskid: string;

    @ApiProperty({ example: '{}', description: 'Folder ids', required: false })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    @IsOptional()
    jFolders: string;

    @ApiProperty({ example: '{}', description: 'File ids', required: false })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    @IsOptional()
    jFiles: string;
    
    @ApiProperty({ example: false, description: 'Is Hyperlink', required: false })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return undefined;  // prevents "" from blowing up
    })
    bIshyperlink: boolean;

    @IsItUUID()
    nMasterid?: string;
}


export class DownloadFile {

    @ApiProperty({ example: '', description: 'cFilename id' })
    @IsString()
    cFilename: string;

    @ApiProperty({ example: '', description: 'cPath id' })
    @IsString()
    cPath: string;

    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}


export interface IndexGenerationJob {
    query: any;
    outputPath: string;
    logApp: any;
    jobId?: string;
}

export class PresentReportReq {
    @ApiProperty({ example: '{}', description: 'File ids', required: false })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    params: string;

    @IsItUUID()
    nMasterid?: string;
}

export class PresentReportParams {
    nCaseid: string;
    nSectionid: string;
}