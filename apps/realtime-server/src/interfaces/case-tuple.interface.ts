import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";


export class updatesReq {

    @ApiProperty({ example: 'bc669a9e-6388-42af-9a94-f438e907ea30', description: 'Unique identifier for the database entry' })
    @IsItUUID()
    nCaseid: string;


    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}