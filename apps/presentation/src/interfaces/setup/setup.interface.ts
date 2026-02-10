import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class setValueReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Unic id' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 1, description: '' })
    @IsOptional()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'Typeid must be a number conforming to the specified constraints' })
    nTypeid: number;

    @ApiProperty({ example: 'G/P', description: 'Public/Private type' })
    @IsOptional()
    @IsString()
    cType: string;

    @ApiProperty({ example: 1, description: '' })
    @IsOptional()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'Sub Typeid must be a number conforming to the specified constraints' })
    nSTypeid: number;

    @ApiProperty({ example: 'F/W/C', description: 'File/Witness/Core type' })
    @IsOptional()
    @IsString()
    cSType: string;

    @ApiProperty({ example: [], description: '' })
    @IsOptional()
    @IsString({ each: true })
    @IsArray()
    jUsers: string[];

    @ApiProperty({ example: 'Presentation name', description: 'Presentation name' })
    @IsOptional()
    @IsString()
    cName: string;

    @IsItUUID()
    nMasterid?: string;
}

export interface setValueRes {
    msg?: number;
    error?: any
}

export class getValueReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Caseid' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}

export class TypesReq {
    @IsItUUID()
    nMasterid?: string;
}

export class subTypesReq {
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Caseid' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}


export interface TypeRes {
    nValue: number;
    cKey: string;
    jOther: typeOtherParms;
}

export interface typeOtherParms {
    icon: string;
    icontype: string;
    type: string;
    title?: string;
}


export class TeamReq {

    @ApiProperty({ example: 'G/P', description: 'Public/Private type' })
    @IsString()
    cType: string;

    @IsItUUID()
    nCaseid: string;


    @IsItUUID()
    nMasterid?: string;


    @IsOptional()
    @IsString()
    ref?: number;

}

export class PresentationReq {

    @ApiProperty({ example: 1093, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 1, description: 'nTypeid' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'nTypeid must be a number conforming to the specified constraints' })
    nTypeid: number;


    @ApiProperty({ example: 1, description: 'nSubtypeid' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'nSubtypeid must be a number conforming to the specified constraints' })
    @IsOptional()
    nSubtypeid: number;

    @IsItUUID()
    nMasterid?: string;
}

export class scheduleDeleteReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPCid' })
    @IsItUUID()
    nPCid: string;

    @IsItUUID()
    nMasterid?: string;
}

class FileDetail {
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Bundle detail ID', required: false })
    @IsOptional()
    @IsItUUID()
    nBundledetailid: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Bundle ID', required: false })
    @IsOptional()
    @IsItUUID()
    nBundleid: string;

    @ApiProperty({ example: 'D', description: 'Type of the file' })
    @IsString({ message: 'type must be a string' })
    type: string;
}

export class insertReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Unic id' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 'I', description: 'status' })
    @IsOptional()
    @IsString()
    cStatus: string;

    @ApiProperty({ example: 'Presentation name', description: 'Presentation name' })
    @IsOptional()
    @IsString()
    cName: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Contact id' })
    @IsOptional()
    @IsItUUID()
    nContactid: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPCid id' })
    @IsOptional()
    @IsItUUID()
    nPCid: string;

    @ApiProperty({ example: 1, description: '' })
    @IsOptional()
    @IsNumber({}, { message: 'Typeid must be a number conforming to the specified constraints' })
    nTypeid: number;

    @ApiProperty({ example: 1, description: '' })
    @IsOptional()
    @IsNumber({}, { message: 'Sub Typeid must be a number conforming to the specified constraints' })
    nSTypeid: number;

    @ApiProperty({ example: [], description: '' })
    @IsOptional()
    @IsString({ each: true })
    @IsArray()
    jUsers: string[];

    @ApiProperty({
        example: [
            { nBundledetailid: 1, nBundleid: 2, cType: 'D' },
            { nBundledetailid: 1, nBundleid: 2, cType: 'D' },
        ],
        description: 'Array of file details',
        type: [FileDetail],
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FileDetail) // This ensures the objects in the array are transformed into FileDetail instances
    jFiles: FileDetail[];

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsOptional()
    @IsItUUID()
    nPresentid: string;

    @IsItUUID()
    nMasterid?: string;
}



export interface CaseDetailRes {
    msg: number;
    cCasename?: string;
    cCaseno?: string;
    cDesc?: string;
    nCaseid?: string;
    value?: string;
    error?: string
}


export interface ContactDetailRes {
    cCompany?: string;
    cEmail: string;
    cFname: string;
    cLname: string;
    cProfile: string;
    cRole?: string;
    nContactid: string;
}

export interface ScheduleListRes {
    nPCid: string;
    nContactid: string;
    cFname: string;
    cLname: string;
}


export interface ScheduleDeleteRes {
    msg: number;
    value: number;
}

export interface OngoingListRes {
    nPresentid: string;
    cName: string;
    nStatus: number;
    cCodename: string;
}



export interface insertRes {
    nPresentid?: string;
    nBundledetailid?: string;
    msg: number;
    value?: string;
}





export class PresentationSetUpFilesReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPresentid' })
    @IsItUUID()
    nPresentid: string;


    @ApiProperty({ example: 'Tab', description: 'Sort by' })
    @IsOptional()
    @IsString()
    cSortby: string;

    @ApiProperty({ example: 'ASC', description: 'Sort type' })
    @IsOptional()
    @IsString()
    cSorttype: string;

    @IsItUUID()
    nMasterid?: string;
}






export class PresentationSetUpDetailReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPresentid' })
    @IsItUUID()
    nPresentid: string;

    @IsItUUID()
    nMasterid?: string;
}

export class PresentationSetUpClearScheduleReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPresentid' })
    @IsItUUID()
    nPresentid: string;

    @IsItUUID()
    nMasterid?: string;
}


export interface PresentationSetUpClearScheduleRes {
    msg: number;
    value?: number;
}


export class caseDetailsReq {

    @ApiProperty({ example: 1093, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}


export class contactListReq {

    @ApiProperty({ example: 1093, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 'W', description: 'cType' })
    @IsOptional()
    @IsString()
    cType: string;

    @IsItUUID()
    nMasterid?: string;
}

export class scheduleListReq {

    @ApiProperty({ example: 1093, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}

export class ongoinglistReq {

    @ApiProperty({ example: 1093, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}


export class runningPresentationReq {

    @ApiProperty({ example: 1093, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}

export class recentFilesReq {

    @ApiProperty({ example: 1093, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 1, description: '' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'Typeid must be a number conforming to the specified constraints' })
    nTypeid: number;

    @ApiProperty({ example: 1, description: '' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'pageNumber must be a number conforming to the specified constraints' })
    pageNumber: number;

    @ApiProperty({ example: 1, description: '' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'nLimit must be a number conforming to the specified constraints' })
    nLimit: number;

    @ApiProperty({ example: 1, description: '', required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'nSubtypeid must be a number conforming to the specified constraints' })
    nSubtypeid: number;


    @ApiProperty({ example: '2024-12-23', description: '', required: false })
    @IsOptional()
    @IsString()
    dStartDt: string;

    @ApiProperty({ example: '2024-12-25', description: '', required: false })
    @IsOptional()
    @IsString()
    dEndDt: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsString()
    cSearch: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsString()
    searchName: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsString()
    cPname: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsString()
    cSorttype: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsString()
    cSortby: string;

    @IsItUUID()
    nMasterid?: string;
}

class UpdateSerialDetail {
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPDid ID', required: true })
    @IsItUUID()
    nPDid: string;

    @ApiProperty({ example: 1, description: 'nSerial', required: true })
    @IsNumber({}, { message: 'nSerial must be a number' })
    nSerial: number;

}
export class fileUpdateReq {

    @ApiProperty({
        example: [
            { nPDid: 10, nSerial: 1 },
            { nPDid: 11, nSerial: 2 },
        ],
        description: 'Array of file list',
        type: [UpdateSerialDetail],
    })
    @ValidateNested({ each: true })
    @Type(() => UpdateSerialDetail) // This ensures the objects in the array are transformed into UpdateSerialDetail instances
    jFiles: UpdateSerialDetail[];

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;

    @IsItUUID()
    nMasterid?: string;
}

export interface fileUpdateRes {
    msg: number;
    value: string;
}

export class StatusUpdateReq {

    @ApiProperty({ example: 'I', description: 'status' })
    @IsString()
    cStatus: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;

    @IsItUUID()
    nMasterid?: string;
}

export interface StatusUpdateRes {
    msg: number;
    value: string;
}



export class recentFilesidsReq {

    @ApiProperty({ example: 1093, description: 'nCaseid' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 1, description: '' })
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'Typeid must be a number conforming to the specified constraints' })
    nTypeid: number;
    @ApiProperty({ example: 1, description: '', required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value), { toClassOnly: true })
    @IsNumber({}, { message: 'nSubtypeid must be a number conforming to the specified constraints' })
    nSubtypeid: number;


    @ApiProperty({ example: '2024-12-23', description: '', required: false })
    @IsOptional()
    @IsString()
    dStartDt: string;

    @ApiProperty({ example: '2024-12-25', description: '', required: false })
    @IsOptional()
    @IsString()
    dEndDt: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsString()
    cSearch: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsString()
    searchName: string;

    @ApiProperty({ example: '', description: '', required: false })
    @IsOptional()
    @IsString()
    cPname: string;

    @IsItUUID()
    nMasterid?: string;
}