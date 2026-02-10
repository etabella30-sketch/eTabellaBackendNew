import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, isBoolean, isNumber, isString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class InsertWeb {
    @ApiProperty({ example: 1, description: 'Unique identifier for the database entry' })
    @IsItUUID()
    nBDid: string;

    @ApiProperty({ example: 'https://fb.com/', description: 'Array of strings' })
    @IsString({ each: true })
    cUrl: string;

    @ApiProperty({ example: '', description: 'cTitle of strings' })
    @IsString({ each: true })
    cTitle: string;


    @ApiProperty({ example: '', description: 'cNote of strings' })
    @IsString()
    cNote: string;


    @ApiProperty({ example: '', description: 'Type as a string' })
    @IsString()
    cFavicon: string;

    @ApiProperty({ example: '[{}, {}]', description: 'Array of objects' })
    @IsString()
    jAn: string;

    @ApiProperty({ example: '[1, 2, 3]', description: 'Array of team IDs' })
    @IsString()
    jUsers: string;


    @ApiProperty({ example: 'S', description: 'Type as a string' })
    @IsString()
    cType: string;




    @ApiProperty({ example: '', description: 'cImg as a string' })
    @IsString()
    cImg: string;

    
    @ApiProperty({ example: '{}', description: 'cImg as a string' })
    @IsString()
    jLinktype: string;

    
    @ApiProperty({ example: '[]', description: 'cImg as a string' })
    @IsString()
    jOT: string;


    @IsItUUID()
    nMasterid?: string;
}


export class resInsertFact {
    msg: number;
    value?: string;
    nFSid?: any;
    error?: any;
}

export class getWebdata {
    metadata: any;
    favicon: any;
    screenshot: any;
}



export class webListbyids {
    @ApiProperty({ example: '[]', description: 'Unique identifier for the database entry' })
    @IsString()
    jWebids: string;

    @IsItUUID()
    nMasterid?: string;
}


export class webDelete {
    @ApiProperty({ example: 0, description: 'Unique identifier for the database entry' })
    @IsItUUID()
    nWebid: string;

    @IsItUUID()
    nMasterid?: string;
}


export class resDeleteWeb {
    msg: number;
    value?: string;
    error?: any;
}