import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, isBoolean, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export interface rooms {
    [key: string]: {
        workerindex: number;
        router: any;
        producer: any;
        producerTransport: any;
        transports: any;
        consumers: any;
    };
}


export interface returnTransport {
    id: string;
    iceParameters: any;
    iceCandidates: any[];
    dtlsParameters: any;
    sctpParameters?: any;
}

///////


class commonRequest {

    @IsItUUID()
    nPresentid?: string;

    @IsItUUID()
    nMasterid?: string;
}


export class joinReq extends commonRequest {

    @ApiProperty({ example: false, description: 'isPresenter' })
    @IsBoolean()
    isPresenter: boolean;

}


export class createTransportReq extends commonRequest {

    @ApiProperty({ example: false, description: 'isPresenter' })
    @IsBoolean()
    isPresenter: boolean;

}


export class connectTransportReq extends commonRequest {

    @ApiProperty({ example: false, description: 'isPresenter' })
    @IsBoolean()
    isPresenter: boolean;

    @ApiProperty({ example: '', description: 'transportId' })
    @IsObject()
    dtlsParameters: object;
}

export class produceReq extends commonRequest {

    @ApiProperty({ example: '', description: 'transportId' })
    @IsString()
    kind: string;

    @ApiProperty({ example: '', description: 'transportId' })
    @IsObject()
    rtpParameters: object;

}


export class consumeReq extends commonRequest {

    @ApiProperty({ example: '', description: 'transportId' })
    @IsObject()
    rtpCapabilities: object;

}