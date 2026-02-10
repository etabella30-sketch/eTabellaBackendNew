import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export type presentStatus = 'B' | 'I' | 'P' | 'L' | 'C';
export type presentsEvent = 'PAUSED' | 'LIVE' | 'END' | 'USER-MANAGE' | 'ASK-REQ' | 'REQ-MANAGE' | 'PRESENT-HIGHLIGHT-ADDED' | 'PRESENT-HIGHLIGHT-DELETED' | 'PRESENT-HIGHLIGHT-COLOR-CHANGE' | 'PRESENT-LINK-SHARED' | 'USER-COUNT-UPDATED';


export class presentEvents {
    event: presentsEvent;
    data: any;
    nPresentid?: string;
}



export class presetnTabsReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;

    @IsItUUID()
    nMasterid?: string;
}


class Rects {
    @ApiProperty({ example: 1, description: 'The x-coordinate of the rectangle' })
    @IsNumber()
    x: number;

    @ApiProperty({ example: 1, description: 'The y-coordinate of the rectangle' })
    @IsNumber()
    y: number;

    @ApiProperty({ example: 1, description: 'The width of the rectangle' })
    @IsNumber()
    width: number;

    @ApiProperty({ example: 1, description: 'The height of the rectangle' })
    @IsNumber()
    height: number;
}

export class SaveHighlightReq {
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the present item' })
    @IsItUUID()
    nPresentid: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Unique identifier' })
    @IsItUUID()
    nBundledetailid: string;

    @ApiProperty({ example: 'add1c8de-1303-43b3-a26f-ba2f9dad0b97', description: 'Unique identifier' })
    @IsString()
    uuid: string;

    @ApiProperty({ example: 'highlight', description: 'Highlight type' })
    @IsString()
    type: string;

    // @ApiProperty({
    //     example: [
    //         { x: 107.94, y: 632.95, width: 415.41, height: 12.4 },
    //         { x: 107.94, y: 680.55, width: 192.8, height: 27.2 }
    //     ],
    //     description: 'Array of rectangle objects',
    //     required: false
    // })
    // @IsOptional()
    // @IsArray()
    // @Type(() => Rects)
    // rects: Rects[];

    @ApiProperty({ example: 1, description: 'The width of the rectangle' })
    @IsOptional()
    @IsNumber()
    width: number;

    @ApiProperty({
        example: [
            { x: 107.94, y: 632.95, width: 415.41, height: 12.4 },
            { x: 107.94, y: 680.55, width: 192.8, height: 27.2 }
        ],
        description: 'Array of rectangle objects',
        required: false
    })
    @IsOptional()
    @IsString()
    rects: string;

    @ApiProperty({
        example: [
            ["76.61", "106.64"],
            ["77.85", "106.64"]
        ],
        description: 'Array of line coordinates',
        required: false
    })
    @IsOptional()
    @IsString()
    lines: string;

    @ApiProperty({ example: 1, description: 'Page number of the highlight' })
    @IsNumber()
    page: number;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false })
    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}



export class presentToolReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;

    @IsOptional()
    @IsNumber()
    ref?: Number;

    @IsItUUID()
    nMasterid?: string;
}


export class managePresentUserReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;


    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nUserid: string;


    @ApiProperty({ example: 'N/E/D', description: '' })
    @IsString()
    cPermission: string;


    @ApiProperty({ example: 'C', description: '', required: false })
    @IsOptional()
    @IsString()
    cStatus: string;


    @IsItUUID()
    nMasterid?: string;
}




export class managePresentStatusReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;

    @ApiProperty({ example: 'C', description: '' })
    @IsString()
    cStatus: string;


    @IsItUUID()
    nMasterid?: string;
}





export class manageUserReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;


    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nUserid: string;


    @ApiProperty({ example: 'C', description: '' })
    @IsString()
    cStatus: string;

    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}



export class joinRequestReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;

    @IsItUUID()
    nMasterid?: string;
}








export class presentDocPositionReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nBundledetailid: string;

    @IsItUUID()
    nMasterid?: string;
}




export class deleteHighlightReq {
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the present item' })
    @IsItUUID()
    nPresentid: string;

    @ApiProperty({ example: 'add1c8de-1303-43b3-a26f-ba2f9dad0b97', description: 'Unique identifier' })
    @IsString()
    uuid: string;

    @ApiProperty({ example: 1, description: 'page of the present item' })
    @IsNumber()
    page: number;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false })
    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}




export class colorChangeHighlightReq {
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the present item' })
    @IsItUUID()
    nPresentid: string;

    @ApiProperty({ example: 'add1c8de-1303-43b3-a26f-ba2f9dad0b97', description: 'Unique identifier' })
    @IsString()
    uuid: string;

    @ApiProperty({ example: '', description: 'Color of the present item' })
    @IsString()
    cColor: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false })
    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}




export class persentHighlightsReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;


    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nBundledetailid: string;


    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false })
    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}








export class persentManageDocReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;

    @ApiProperty({ example: [], description: 'Share bundledetail ids', required: false })
    @IsString({ each: true })
    @IsArray()
    jBd: string[];

    @ApiProperty({ example: 'N/E/D', description: '' })
    @IsString()
    cPermission: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false })
    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}







export class onlineUserReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;


    @IsItUUID()
    nMasterid?: string;
}






export class shareLinkReq {
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the present item' })
    @IsItUUID()
    nPresentid: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nAId: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nBundledetailid: string;

    @ApiProperty({ example: 1, description: '' })
    @IsOptional()
    @IsBoolean()
    bIsWithLink: number;

    @ApiProperty({ example: 'N/E/D', description: '' })
    @IsString()
    cPermission: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false })
    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}








export class getShareLinkListReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nBundledetailid: string;

    @IsItUUID()
    nMasterid?: string;
}



export class getShareLinkListByPresenterReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;


    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nBundledetailid: string;

    @IsItUUID()
    nMasterid?: string;
}







export class remarksInsertReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;


    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nBundledetailid: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nAId: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nRemarkid: string;


    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false })
    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}





export class getRunningScreenShareReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;


    @IsItUUID()
    nMasterid?: string;
}




export class getPresentDetailReq {

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
    @IsItUUID()
    nPresentid: string;


    @IsItUUID()
    nMasterid?: string;
}






export class unsaveHighlightsReq {
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the present item' })
    @IsItUUID()
    nPresentid: string;

    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false })
    @IsOptional()
    @IsItUUID()
    nMasterid?: string;
}

