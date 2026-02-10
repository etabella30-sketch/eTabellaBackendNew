import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class TagCreateReq {


    @ApiProperty({ example: 1, description: 'Task ID', required: false })
    @IsItUUID()
    @IsOptional()
    nTagid: string;

    @ApiProperty({ example: '', description: 'Tag', required: true })
    @IsString()
    cTag?: string;

    @ApiProperty({ example: '', description: 'Subtag', required: false })
    @IsString()
    cSubtag?: string;

    @ApiProperty({ example: '', description: 'Color', required: false })
    @IsString()
    cClr?: string;

    @ApiProperty({ example: '', description: 'Color', required: false })
    @IsString()
    cDesc?: string;


    @ApiProperty({ example: 1, description: 'Parenttag ID' })
    @IsItUUID()
    @IsOptional()
    nParenttagid: string;

    @ApiProperty({ example: 'N', description: 'Permission', required: true })
    @IsString()
    permission?: string;


    @ApiProperty({ example: 1, description: 'Case ID' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}


export class TagCreateRes {
    nTagid?: string;
    msg?: number;
    value?: string;
    error?: any;
}

export class TagReq {

    @ApiProperty({ example: 1, description: 'Case ID' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}

