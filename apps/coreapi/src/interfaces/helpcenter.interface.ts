import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class GetKeyWordReq {
    
    @ApiProperty({ example: 'S', description: 'cKey as a string' })
    @IsString()
    cKey: string;
    
    @IsItUUID()
    nMasterid?: string;
}

export class GetCommonTopicsReq {
    
    @IsItUUID()
    nMasterid?: string;
}



export class GetModuleListReq {

    @ApiProperty({ example: 1, description: 'nKeyid', required: false })
    @IsOptional()
    @IsItUUID()
    nKeyid?: string;

    @IsItUUID()
    nMasterid?: string;
}

export class GetSubModuleListReq {
    
    @ApiProperty({ example: 1, description: 'nKeyid', required: false })
    @IsOptional()
    @IsItUUID()
    nKeyid?: string;

    @ApiProperty({ example: 1, description: 'nMainid', required: true })
    @IsItUUID()
    nMainid: string;

    @IsItUUID()
    nMasterid?: string;
}

export class GetFaqListReq {

    @ApiProperty({ example: 'A', description: 'cQType' })
    @IsString()
    cQType: string;

    @IsItUUID()
    nMasterid?: string;
}


export class InsertFeedbackReq {

    @ApiProperty({ example: 1, description: 'nFaqid' })
    @IsItUUID()
    nFaqid: string;
  
    @ApiProperty({ example: false, description: 'bIsHelpful' })
    @IsBoolean()
    bIsHelpful: boolean;
  
    @IsItUUID()
    nMasterid?: string;
  
}



export class ModuleIUReq {

    @ApiProperty({ example: 'cTitle', description: 'cTitle' })
    @IsString()
    @IsNotEmpty()
    cTitle: string;

    @ApiProperty({ example: 'I', description: 'cPermission' })
    @IsString()
    @IsNotEmpty()
    cPermission: string;

    @ApiProperty({ example: 'cImage', description: 'cImage' })
    @IsString()
    @IsNotEmpty()
    cImage: string;
    
    @ApiProperty({ example: 1, description: 'nMainid' })
    @IsItUUID()
    nMainid: string;

    @IsItUUID()
    nMasterid?: string;
  
}

export class SubModuleIUReq {

    @ApiProperty({ example: 2, description: 'nMainid' })
    @IsItUUID()
    nMainid: string;
    
    @ApiProperty({ example: 5, description: 'nSMid' })
    @IsItUUID()
    nSMid: string;
    
    @ApiProperty({ example: 'cTitle', description: 'cTitle' })
    @IsString()
    @IsNotEmpty()
    cTitle: string;

    @ApiProperty({ example: 'cLink', description: 'cLink' })
    @IsString()
    @IsNotEmpty()
    cLink: string;

    @ApiProperty({ example: 'I', description: 'cPermission' })
    @IsString()
    @IsNotEmpty()
    cPermission: string;

    @ApiProperty({ example: 'cDescription', description: 'cDescription' })
    @IsString()
    cDescription: string
    
    @ApiProperty({ example: '["tag1", "tag2"]', description: 'jTags' })
    @IsArray()
    jTags: string[]

    @IsItUUID()
    nMasterid?: string;
  
}


export class ModuleDetailReq {

    @ApiProperty({ example: 1, description: 'nMainid' })
    @IsItUUID()
    nMainid: string;

    @IsItUUID()
    nMasterid?: string;
  
}


export class SubModuleDetailReq {

    @ApiProperty({ example: 1, description: 'nSMid' })
    @IsItUUID()
    nSMid: string;

    @IsItUUID()
    nMasterid?: string;
  
}


export class SearchKeyReq {

    @ApiProperty({ example: 5, description: 'nSMid' })
    @IsItUUID()
    nSMid: string;

    @IsItUUID()
    nMasterid?: string;
  
}