import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, isBoolean, isNumber, isString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";




export class CheckNavigationReq {
    @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
    @IsItUUID()
    nBundledetailid: string;

    @IsItUUID()
    nMasterid?: string;
}


export class CheckNavigationRes {
    isnavigateion?: boolean;
    isfact?: boolean;
    isdoclink?: boolean;
    iscontact?: boolean;
    isfactlink?: boolean;
    isweblink?: boolean;
    isfacttask?: boolean;
    isfiletask?: boolean;
    msg: number;
    value?: string;
    error?: any;
}


export class FactListReq {
    @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
    @IsItUUID()
    nBundledetailid: string;

    @ApiProperty({ example: 'ASC', description: 'Sort type identifier for the database entry' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    cSorttype: string;


    @ApiProperty({ example: 'QF', description: 'Fact type' })
    @IsOptional()
    @IsString()
    cFType?: string;

    @ApiProperty({ example: 'Category', description: 'Sort by identifier for the database entry' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    cSortby: string;

    @ApiProperty({ example: 1, description: 'Page number identifier for the database entry' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber()
    nPageNumber: number;

    @ApiProperty({ example: 1, description: 'Filter', required: false })
    @IsOptional()
    @IsString()
    jFilter: string;

    @IsItUUID()
    nMasterid?: string;
}

export class FactListRes {
    factDetails?: FactDetail[];
    issueDetails?: IssueDetail[];
    linkDetails?: LinkDetail[];
    msg?: number;
    value?: string;
    error?: any;
}


export class FactDetail {
    nFSid: string;
    dCreateDt: Date;
    cCreateby: string;
    nFiletype: number;
    nTZid: string;
    cTimezone: string;
    jLinktype: any; // You might want to define a more specific type based on the actual structure
    cType: string;
    cFType: string;
    jTexts: any; // You might want to define a more specific type based on the actual structure
    jOT: any; // You might want to define a more specific type based on the actual structure
    nColorid: string;
    nStatus: number;
    cColor: string;
    jDate: any; // You might want to define a more specific type based on the actual structure
    cDatetype: string;
    cStatus: string;
    cFiletype: string;
}

export class IssueDetail {
    jFSids: string[];
    nIssueid: string;
    nImpactid: string;
    nRelevanceid: string;
    nICid: string;
    cCategory: string;
    cIName: string;
    cColor: string;
    cCodename: string; // This represents both relevance and impact codenames
}

export class LinkDetail {
    nFSid: string;
    nFMLid: string;
    nBundledetailid: string;
    cName: string;
    cExhibitno: string;
    cTab: string;
    jLinktype: any; // You might want to define a more specific type based on the actual structure
    cPage: string;
}


export class FactCompanyRes {
    nCompanyid?: string | null;
    cCompany?: string;
    msg?: number;
    value?: string;
    error?: any;
}

export class CompanyParams {

    @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
    @IsItUUID()
    nBundledetailid: string;

    @IsItUUID()
    nMasterid?: string;
}

export class FactCompParams {

    @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
    @IsItUUID()
    nBundledetailid: string;

    @ApiProperty({ example: 1, description: 'Company id identifier for the database entry' })
    @IsOptional()
    @IsItUUID()
    nCompanyid: string;

    @ApiProperty({ example: 'cSortby', description: 'Sort by identifier for the database entry' })
    @IsOptional()
    @IsString()
    cSortby: string;

    @ApiProperty({ example: 1, description: 'Filter', required: false })
    @IsOptional()
    @IsString()
    jFilter: string;

    @IsItUUID()
    nMasterid?: string;
}



export class FactlinkListRes {
    msg?: number;
    value?: string;
    error?: any;
}


export class FactLinkDetail {
    nFSid: string;
    dCreateDt: Date;
    cCreateby: string;
    nFiletype: number;
    nTZid: string;
    cTimezone: string;
    jLinktype: any; // You might want to define a more specific type based on the actual structure
    cType: string;
    cFType: string;
    jTexts: any; // You might want to define a more specific type based on the actual structure
    jOT: any; // You might want to define a more specific type based on the actual structure
    nColorid: string;
    nStatus: number;
    cColor: string;
    jDate: any; // You might want to define a more specific type based on the actual structure
    cDatetype: string;
    cStatus: string;
    cFiletype: string;
    nBundledetailid: string;
    cName: string;
    cExhibitno: string;
    cPage: string;
    jFMLinktype: any; // You might want to define a more specific type based on the actual structure
}

type fTypes = 'CLAIM' | 'ISSUE' | 'TYPE' | 'RELEVANCE' | 'IMPACT' | 'STATUS' | 'CONTACT' | 'LINK' | 'DATE' | 'TASK';
type column = 'jClaim' | 'jIssue' | 'jType' | 'jRelevance' | 'jImpact' | 'jStatus' | 'jContact' | 'startDt' | 'endDt' | 'jPriority' | 'cProgress' | 'nTaskdays';
export class filterList {
    type: fTypes;
    value: any;
    consition: 'OR' | 'AND';
    // column: column;
}



export class filterReq {

    @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
    @IsItUUID()
    nBundledetailid: string;

    @IsItUUID()
    nMasterid?: string;
}


export class shareusers {
    @ApiProperty({ example: 1, description: 'nDocid id identifier for the database entry' })
    @IsItUUID()
    nId: string;


    @ApiProperty({ example: 'cType', description: 'cType for the database entry' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    cType: string;

    @IsItUUID()
    nMasterid?: string;
}



export class AllListReq {
    @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
    @IsItUUID()
    nBundledetailid: string;

    @ApiProperty({ example: 'ASC', description: 'Sort type identifier for the database entry' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    cSorttype: string;

    @ApiProperty({ example: 'Category', description: 'Sort by identifier for the database entry' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    cSortby: string;

    @ApiProperty({ example: 1, description: 'Page number identifier for the database entry' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber()
    nPageNumber: number;

    @ApiProperty({ example: 1, description: 'Filter', required: false })
    @IsOptional()
    @IsString()
    jFilter: string;

    @IsItUUID()
    nMasterid?: string;
}


export class AllLinkListReq {
    @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
    @IsItUUID()
    nBundledetailid: string;

    @ApiProperty({ example: 'ASC', description: 'Sort type identifier for the database entry' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    cSorttype: string;

    @ApiProperty({ example: 'Category', description: 'Sort by identifier for the database entry' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    cSortby: string;

    @ApiProperty({ example: 1, description: 'Page number identifier for the database entry' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber()
    nPageNumber: number;

    @ApiProperty({ example: 1, description: 'Filter', required: false })
    @IsOptional()
    @IsString()
    jFilter: string;

    @IsItUUID()
    nMasterid?: string;
}