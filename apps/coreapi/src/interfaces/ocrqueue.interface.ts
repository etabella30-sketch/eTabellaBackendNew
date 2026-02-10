import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, isBoolean, isNumber, isString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class OCRFilelistQueue {
    @ApiProperty({ example: 1, description: 'Caseid for the database entry' })
    @IsItUUID()
    @IsOptional()
    nCaseid: string;

    @ApiProperty({ example: 1, description: 'Userid for the database entry' })
    @IsItUUID()
    @IsOptional()
    nUserid: string;

    @IsItUUID()
    nMasterid?: string;
}

export class resDeleteWeb {
    msg: number;
    value?: string;
    error?: any;
}