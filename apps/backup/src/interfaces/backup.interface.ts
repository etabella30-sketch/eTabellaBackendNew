import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class backupReq {

    @ApiProperty({ example: 0, description: 'User id' })
    @IsNumber()
    nUserid: string;

}