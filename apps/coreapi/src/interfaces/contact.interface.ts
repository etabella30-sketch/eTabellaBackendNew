import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class ContactBuilderReq {

    @ApiProperty({ example: 1, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 1, description: 'nContactid' })
    @IsOptional()
    @IsItUUID()
    nContactid?: string;

    @ApiProperty({ example: '', description: 'cProfile', required: false })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cProfile?: string;

    @ApiProperty({ example: '', description: 'cFname' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cFname: string;

    @ApiProperty({ example: '', description: 'cLname' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cLname: string;

    @ApiProperty({ example: '', description: 'cAlias', required: false })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cAlias?: string;

    @ApiProperty({ example: '', description: 'cLinkedin', required: false })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cLinkedin?: string;

    @ApiProperty({ example: '', description: 'cEmail' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cEmail: string;

    @ApiProperty({ example: '', description: 'cCountrycode' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cCountrycode: string;

    @ApiProperty({ example: '', description: 'cMobile' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cMobile: string;

    @ApiProperty({ example: 1, description: 'nTZid', required: false })
    @Transform(({ value }) => (value === null || value === undefined) ? 0 : Number(value))
    @IsNumber()
    nTZid?: number;

    @ApiProperty({ example: 1, description: 'nRoleid', required: false })
    @IsOptional()
    @IsItUUID()
    nRoleid?: string;

    @ApiProperty({ example: 1, description: 'nCompanyid', required: false })
    @IsOptional()
    @IsItUUID()
    nCompanyid?: string;


    @ApiProperty({ example: '', description: 'cNote', required: false })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cNote?: string;

    @ApiProperty({ example: '', description: 'cIso', required: false })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cIso?: string;


    @ApiProperty({ example: 'N', description: 'permission' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    permission: string;

    @ApiProperty({ example: 'C', description: 'cType' })
    @IsOptional()
    @IsString()
    cType: string;

    @IsItUUID()
    nMasterid: string;

}


export class ContactDeleteReq {
    @ApiProperty({ example: 1, description: 'nContactid' })
    @IsItUUID()
    nContactid?: string;

    @ApiProperty({ example: 'D', description: 'permission' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    permission: string;


    @IsItUUID()
    nMasterid?: string;
}

export class ContactBuilderRes {
    nContactid?: string;
    msg?: number;
    value?: string;
    error?: any;
}



export class ContactlsReq {


    @ApiProperty({ example: 1, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 'C', description: 'cType' })
    @IsOptional()
    @IsString()
    cType: string;

    @ApiProperty({ example: false, description: 'nBundledetailid' })
    @IsOptional()
    @IsItUUID()
    nBundledetailid: string;

    
    @ApiProperty({ example: false, description: 'nSesid' })
    @IsOptional()
    @IsItUUID()
    nSesid: string;

    @IsItUUID()
    nMasterid: string;

}



export class ContactlsRes {
    nContactid?: string;
    cProfile?: string;
    cFname?: string;
    cLname?: string;
    cEmail?: string;
    cRole?: string;
    cCompany?: string;
    msg?: number;
    value?: string;
    error?: any;
}

export class ContactReq {


    @ApiProperty({ example: 1, description: 'nContactid' })
    @IsItUUID()
    nContactid: string;

    @IsItUUID()
    nMasterid: string;

}




export class ContactRes {
    nContactid?: string;
    cProfile?: string;
    cFname?: string;
    cLname?: string;
    cAlias?: string;
    cLinkedin?: string;
    cEmail?: string;
    cCountrycode?: string;
    cMobile?: string;
    nTZid?: number;
    nRoleid?: string;
    nCompanyid?: string;
    cNote?: string;
    cTimezone?: string;
    cRole?: string;
    cCompany?: string;
    msg?: number;
    value?: string;
    error?: any;
}


export class ContactFileReq {

    @ApiProperty({ example: 1, description: 'nSectionid' })
    @IsItUUID()
    @IsOptional()
    nSectionid: string;


    @ApiProperty({ example: 1, description: 'nContactid' })
    @IsItUUID()
    nContactid: string;


    @ApiProperty({ example: 'search', description: '', required: false })
    @IsOptional()
    @IsString()
    cSearch: string;

    @ApiProperty({ example: 1, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid: string;

}



export class ContactFileRes {
    nBundledetailid?: string;
    nBundleid?: string;
    cFilename?: string;
    cName?: string;
    cTab?: string;
    cExhibitno?: string;
    cPage?: string;
    cRefpage?: string;
    cFilesize?: string;
    cFiletype?: string;
    dIntrestDt?: string;
    cDescription?: string;
    msg?: number;
    value?: string;
    error?: any;
}




export class CompanyBuilderReq {


    @ApiProperty({ example: 1, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;


    @ApiProperty({ example: 1, description: 'nCompanyid', required: false })
    @IsOptional()
    @IsItUUID()
    nCompanyid?: string;

    @ApiProperty({ example: '', description: 'cCompany' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    @IsNotEmpty()
    cCompany: string;

    @ApiProperty({ example: 'N', description: 'permission' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    permission: string;

    @IsItUUID()
    nMasterid?: string;

}



export class CompanyBuilderRes {
    nCompanyid?: string;
    msg?: number;
    value?: string;
    error?: any;
}



export class CompanyReq {
    @ApiProperty({ example: 1, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;

}



export class CompanyRes {
    nCompanyid?: string;
    cCompany?: string;
    msg?: number;
    value?: string;
    error?: any;
}





export class CRBuilderReq {
    @ApiProperty({ example: 1, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;


    @ApiProperty({ example: 1, description: 'nCRoleid', required: false })
    @IsOptional()
    @IsItUUID()
    nCRoleid?: string;

    @ApiProperty({ example: '', description: 'cRole' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    @IsNotEmpty()
    cRole: string;

    @ApiProperty({ example: 'N', description: 'permission' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    permission: string;

    @IsItUUID()
    nMasterid?: string;

}



export class CRBuilderRes {
    nCRoleid?: string;
    msg?: number;
    value?: string;
    error?: any;
}


export class ContactroleReq {
    @ApiProperty({ example: 1, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;

}



export class ContactroleRes {
    nCRoleid?: string;
    cRole?: string;
    cIsdefault?: string;
    msg?: number;
    value?: string;
    error?: any;
}


export class CaseContactBuilderReq {

    @ApiProperty({ example: 1, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 1, description: 'nContactid' })
    @IsOptional()
    @IsItUUID()
    nContactid?: string;

    @ApiProperty({ example: '', description: 'cProfile', required: false })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cProfile?: string;

    @ApiProperty({ example: '', description: 'cFname' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cFname: string;

    @ApiProperty({ example: '', description: 'cLname' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cLname: string;

    // @ApiProperty({ example: '', description: 'cMentiontag', required: false })
    // @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    // @IsString()
    // @IsOptional()
    // cMentiontag: string;



    @ApiProperty({ example: '', description: 'cEmail', required: false })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cEmail: string;

    @ApiProperty({ example: '', description: 'cOccupation', required: false })
    @IsOptional()
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cOccupation?: string;

    @ApiProperty({ example: 1, description: 'nRoleid', required: false })
    @IsItUUID()
    nRoleid: string;

    @ApiProperty({ example: 1, description: 'nCompanyid', required: false })
    @IsItUUID()
    nCompanyid: string;

    @ApiProperty({ example: 1, description: 'nPartyid', required: false })
    @IsNumber()
    nPartyid: string;

    @ApiProperty({ example: '', description: 'cNote', required: false })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    cNote?: string;

    @ApiProperty({ example: 'N', description: 'permission' })
    @Transform(({ value }) => (value === null || value === undefined) ? '' : String(value))
    @IsString()
    permission: string;

    @ApiProperty({ example: 'C', description: 'cType' })
    @IsOptional()
    @IsString()
    cType: string;

    @IsItUUID()
    nMasterid: string;

}

export class CheckMentionExistsReq {
    @ApiProperty({ example: 1, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 'user_001', description: 'cMentiontag' })
    @IsString()
    cMentiontag: string;

    @ApiProperty({ example: 'N', description: 'cPermission' })
    @IsString()
    cPermission: string;

    @IsItUUID()
    nMasterid?: string;

}




