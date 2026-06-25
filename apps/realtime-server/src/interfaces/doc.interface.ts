import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { jCoordinateItemAn } from "./fact.interface";



class jCordinateItem {
    @ApiProperty({
        example: "", description: ' item'
    })
    @IsOptional()
    @IsString()
    text: string;

    @ApiProperty({ example: "13:39:25:02", description: 'Timestamp in HH:MM:SS:FF format' })
    @IsString()
    t: string;

    @ApiProperty({
        example: 7,
        description: 'Line number or line identifier'
    })
    @IsOptional()
    @IsNumber()
    l: number;

    @ApiProperty({
        example: 42,
        description: 'Page number or page identifier'
    })
    @IsOptional()
    @IsNumber()
    p: number;

    @ApiProperty({
        example: 22,
        description: 'Original page number or offset'
    })
    @IsOptional()
    @IsNumber()
    oP: number;

    @ApiProperty({
        example: 1,
        description: 'Original line number or offset'
    })
    @IsOptional()
    @IsNumber()
    oL: number;

    @ApiProperty({
        example: "374926425208601",
        description: 'Unique identifier for the annotation item'
    })
    @IsOptional()
    @Transform(({ value }) => value != null ? String(value) : value)
    @IsString()
    identity: string;

    // ---- Optional canvas-drawing geometry (transcript pen/shape DocLinks) ----
    // Mirrors fact.interface.ts jCordinateItem: a pen/shape drawn over the
    // transcript rides on the first coordinate of each page so it round-trips via
    // the verbatim jCordinates column. Declared so the whitelist ValidationPipe
    // keeps these fields instead of 400-ing.
    @ApiProperty({ example: 'drawing', description: "Canvas geometry kind: 'drawing' (pen) or 'area' (shape)", required: false })
    @IsOptional()
    @IsString()
    type: 'drawing' | 'area';

    @ApiProperty({ type: 'array', items: { type: 'object' }, description: 'Shape rectangles [{x,y,width,height}]', required: false })
    @IsOptional()
    @IsArray()
    rects: { x: number; y: number; width: number; height: number }[];

    @ApiProperty({ type: 'array', items: { type: 'array' }, description: 'Pen polyline points [[x,y], …]', required: false })
    @IsOptional()
    @IsArray()
    lines: number[][];

    @ApiProperty({ example: 3, description: 'Stroke width (px)', required: false })
    @IsOptional()
    @IsNumber()
    strokeWidth: number;

    @ApiProperty({ example: 1, description: 'Stroke opacity 0–1', required: false })
    @IsOptional()
    @IsNumber()
    opacity: number;

    @ApiProperty({ example: '#e0483f', description: 'Stroke colour (hex)', required: false })
    @IsOptional()
    @IsString()
    color: string;
}


export class InsertDoc {
    @ApiProperty({ example: 1, description: 'Unique identifier for the database entry' })
    @IsItUUID()
    @IsOptional()
    nSesid: string;

    
    @ApiProperty({ example: 1, description: 'Unique identifier for the database entry' })
    @IsItUUID()
    @IsOptional()
    nBundledetailid: string;

    // @ApiProperty({ example: '', description: 'Array of strings' })
    // @IsString({ each: true })
    // jLT: string;

    @ApiProperty({ type: [jCordinateItem], description: 'Array of annotation objects' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => jCordinateItem)
    @IsOptional()
    jCordinates: jCordinateItem[];

    
    @ApiProperty({ type: [jCoordinateItemAn], description: 'Array of annotation objects' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => jCoordinateItemAn)
    @IsOptional()
    jAn: jCoordinateItemAn[];

    @ApiProperty({ example: '[[22, {}, [{}]]]', description: 'Array of arrays containing mixed types' })
    @IsString()
    jDl: string;

    @ApiProperty({ example: '["",""]', description: 'Array of arrays containing mixed types' })
    @IsString()
    jOT: string;

    @ApiProperty({ example: '["example1", "example2"]', description: 'Array of strings' })
    @IsString()
    jT: string;

    @ApiProperty({ example: '[1, 2, 3]', description: 'Array of team IDs' })
    @IsString()
    jUsers: string;


    @ApiProperty({ example: 'S', description: 'Type as a string' })
    @IsString()
    cType: string;

    @ApiProperty({ example: 1, description: 'Unique identifier for the database entry' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: 'I', description: 'Doc from, only I or RT are allowed' })
    @IsIn(['I', 'RT'])
    cDFrom: string;

    @ApiProperty({ example: 1, description: 'Page number' })
    @IsNumber()
    @IsOptional()
    nPage: number;

    @ApiProperty({ example: 1, description: 'Line number' })
    @IsNumber()
    @IsOptional()
    nLine: number;

    
    @ApiProperty({ example: '{}', description: 'JSON of strings' })
    @IsOptional()
    @IsString()
    jLT: string;

    @IsItUUID()
    nMasterid?: string;
}


export class resInsertDoc {
    msg: number;
    value?: string;
    nDocid?: string;
    error?: any;
}

export class docID {
    @ApiProperty({ example: "uuid-string", description: 'nDocid for the database entry' })
    @IsItUUID()
    nDocid: string;

    @IsItUUID()
    nMasterid?: string;
}


export class docIDmulti {
    @ApiProperty({ example: "[\"uuid-1\", \"uuid-2\", \"uuid-3\"]", description: 'Array of document UUIDs' })
    @IsString()
    jDocids: string;

    @IsItUUID()
    nMasterid?: string;
}