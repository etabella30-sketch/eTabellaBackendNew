import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";



export class AnnotMarks {

    @ApiProperty({
        example: 'abc123',
        description: 'Session ID',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    nSessionid: string;

    @ApiProperty({
        example: 'abc123',
        description: 'User Id',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    nUserid: string;
}



export class FeedPageReq {
    @ApiProperty({
        example: [1, 2, 3],
        description: 'Page numbers to fetch',
        required: true,
        type: [Number],
    })
    @Transform(({ value }) => {
        // Accept either a JSON string or an array; coerce elements to numbers
        if (Array.isArray(value)) return value.map(v => Number(v));
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed.map(v => Number(v)) : [];
            } catch {
                return [];
            }
        }
        return [];
    }, { toClassOnly: true })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    pages: number[];



    @ApiProperty({
        example: false,
        description: 'Transcript',
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    bTranscript: boolean;


    @ApiProperty({
        example: 'abc123',
        description: 'Session ID',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    nSesid: string;
}





export class feedTotalPage {

    @ApiProperty({
        example: 'abc123',
        description: 'Session ID',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    nSesid: string;
}


// "time": "10:00:35",
// "lineIndex": 24,
// "lines": [
//     "Interim Payment Applications were being valued by SBJV"
// ]



interface PageParsedItem extends Array<any> {
    0: string;       // time
    1: number[];     // asciiValue
    2: number;       // lineIndex
    3: string;       // formate
    4: number;       // oPage
    5: number;       // oLine
    6: number;       // unicid
    7: any[];        // links
}


interface transcriptData {
    time: string;
    lineIndex: number;
    lines: string[];
    unicid?: string;
}


export interface feedPage {
    nSesid: string;
    page: number;
    data: PageParsedItem[] | transcriptData[];
}



export interface feedResponse {
    total: number;
    feed: feedPage[]
}