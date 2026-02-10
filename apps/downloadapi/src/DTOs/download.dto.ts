import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";


export class commonDTOs {

    @ApiProperty({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id', required: true })
    @IsItUUID()
    nDPid: string;

    @ApiProperty({ example: "fc2b2057-ac44-41c7-9058-64e8617ed3e5", description: '', required: true })
    @IsItUUID()
    nMasterid?: string;
}


export class downloadReq {

    @ApiProperty({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id', required: true })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: '2304b5fc-85ee-4676-af1c-3239910432ad', description: 'Section id', required: true })
    @IsItUUID()
    nSectionid: string;

    @ApiProperty({ example: 1, description: 'Download Taskid id', required: false })
    @IsOptional()
    @IsString()
    nDTaskid: string;

    @ApiProperty({ example: null, description: 'Folder ids', required: false })
    @IsString()
    @IsOptional()
    jFolders: string;

    @ApiProperty({ example: null, description: 'File ids', required: false })
    @IsString()
    @IsOptional()
    jFiles: string;

    @ApiProperty({ example: false, description: 'Is Hyperlink', required: false })
    @IsOptional()
    @IsBoolean()
    isHyperlink: boolean;

    @ApiProperty({ example: "fc2b2057-ac44-41c7-9058-64e8617ed3e5", description: '', required: true })
    @IsItUUID()
    nMasterid?: string;
}

export class downloadJobReq {
    @ApiProperty({ example: 1, description: 'jobId' })
    @IsItUUID()
    jobId: string;

    @ApiProperty({ example: "fc2b2057-ac44-41c7-9058-64e8617ed3e5", description: '', required: true })
    @IsItUUID()
    nMasterid?: string;
}

export class downloadJobsListReq {

    @ApiProperty({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id', required: false })
    @IsOptional()
    @IsItUUID()
    nDPid: string;

    @ApiProperty({ example: 1, description: 'Page number' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber()
    PageNumber: number;

    @ApiProperty({ example: 'N', description: 'Sort by' })
    @IsString()
    cSortBy: string;

    @ApiProperty({ example: "fc2b2057-ac44-41c7-9058-64e8617ed3e5", description: '', required: true })
    @IsItUUID()
    nMasterid?: string;
}



export class getUrlReq extends commonDTOs {

}



export class retryJobReq extends commonDTOs {

}
export class StopJobReq extends commonDTOs {

}

export class deleteJobReq extends commonDTOs {

}