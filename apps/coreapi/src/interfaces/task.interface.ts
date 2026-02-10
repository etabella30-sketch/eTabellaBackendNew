import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class TaskCreateReq {


    @ApiProperty({ example: 1, description: 'Task ID', required: false })
    @IsOptional()
    @IsItUUID()
    nTaskid: string;

    @ApiProperty({ example: 'example', description: 'Subject' })
    @IsString()
    cSubject: string;

    @ApiProperty({ example: 'example', description: 'Description' })
    @IsString()
    cDesc: string;

    @ApiProperty({ example: '{"cAssign": true, "cRemind": false, "cStatus": false}', description: 'Email Notifications' })
    @IsString()
    jEmailnotify: string;

    @ApiProperty({ example: 1, description: 'Priority' })
    @IsNumber()
    nPriority: number;

    @ApiProperty({ example: 1, description: 'Progress' })
    @IsNumber()
    nProgress?: number;

    @ApiProperty({ example: '{"dEnd": "2023-04-30T18:29:59.999Z","dStart": "2023-04-21T12:24:55.063Z","show_tm": "Apr 21 - 30","time_prges": 0}', description: 'Timeline', required: false })
    @IsString()
    @IsOptional()
    jTimeline?: string;

    @ApiProperty({ example: 'F', description: 'Task Type' })
    @IsString()
    cTasktype: string;

    // @ApiProperty({ example: 1, description: 'nClaimid' })
    // @Transform(({ value }) => (value === null || value === undefined) ? 0 : Number(value))
    // @IsNumber()
    // nClaimid: number;

    // @ApiProperty({ example: 1, description: 'nIssueid' })
    // @Transform(({ value }) => (value === null || value === undefined) ? 0 : Number(value))
    // @IsNumber()
    // nIssueid: number;

    // @ApiProperty({ example: 1, description: 'nImpactid' })
    // @Transform(({ value }) => (value === null || value === undefined) ? 0 : Number(value))
    // @IsNumber()
    // nImpactid: number;

    // @ApiProperty({ example: 1, description: 'nRelevanceid' })
    // @Transform(({ value }) => (value === null || value === undefined) ? 0 : Number(value))
    // @IsNumber()
    // nRelevanceid: number;

    @ApiProperty({ example: '[]', description: 'Reminder', required: false })
    @IsOptional()
    @IsString()
    jReminder?: string;

    @ApiProperty({ example: '[]', description: 'Users', required: false })
    @IsString()
    jUsers?: string;

    @ApiProperty({ example: 'N', description: 'Permission', required: true })
    @IsString()
    permission?: string;

    @ApiProperty({ example: false, description: 'Email Notification', required: false })
    @IsBoolean()
    @IsOptional()
    bemail?: boolean;

    @ApiProperty({ example: false, description: 'In-App Notification', required: false })
    @IsBoolean()
    @IsOptional()
    binapp?: boolean;

    @ApiProperty({ example: 1, description: 'Case ID' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}


export class TaskCreateRes {
    nTaskid?: string;
    msg?: number;
    value?: string;
    error?: any;
}



export class TaskRes {
    nTaskid?: string;
    msg?: number;
    value?: string;
    error?: any;
}


export class TasklistReq {

    @ApiProperty({ example: 'F', description: 'Task Type' })
    @Transform(({ value }) => value, { toClassOnly: true })
    @IsString()
    cTasktype: string;

    @ApiProperty({ example: 1, description: 'Case ID' })
    @IsItUUID()
    nCaseid: string;

    @IsItUUID()
    nMasterid?: string;
}



export class TaskDetailReq {

    @ApiProperty({ example: 1, description: 'Task ID' })
    @IsItUUID()
    nTaskid: string;

    @IsItUUID()
    nMasterid?: string;
}

export class TasklistRes {
    nTaskid?: string;
    msg?: number;
    value?: string;
    error?: any;
}




// @ApiProperty({ example: 1, description: 'Case ID' })
// @Transform(({ value }) => (value === null || value === undefined) ? 0 : Number(value))
// @IsNumber()
// nCaseid: number;

// @IsNumber({}, { message: 'nMasterid must be a number conforming to the specified constraints' })
// nMasterid ?: Number;
// }


export class TaskFactDetailReq {

    @ApiProperty({ example: 1, description: 'Task ID' })
    @IsItUUID()
    nTaskid: string;

    @ApiProperty({ example: 1, description: 'Task ID' })
    @IsItUUID()
    nFSid: string;


    @IsItUUID()
    nMasterid?: string;
}


export class TaskUpdateProgressReq {

    @ApiProperty({ example: 1, description: 'Task ID', required: false })
    @IsItUUID()
    nTaskid: string;

    @ApiProperty({ example: 1, description: 'Progress' })
    @IsNumber()
    nProgress?: number;

    @ApiProperty({ example: 'N', description: 'Permission', required: true })
    @IsString()
    permission?: string;

    @IsItUUID()
    nMasterid?: string;

}


export class TaskCreateReqV2 {


    @ApiProperty({ example: 1, description: 'Task ID', required: false })
    @IsOptional()
    @IsItUUID()
    nTaskid: string;

    @ApiProperty({ example: 'example', description: 'Subject' })
    @IsString()
    cSubject: string;

    @ApiProperty({ example: 'example', description: 'Description' })
    @IsString()
    cDesc: string;

    @ApiProperty({ example: '{"cAssign": true, "cRemind": false, "cStatus": false}', description: 'Email Notifications' })
    @IsString()
    jEmailnotify: string;

    @ApiProperty({ example: 1, description: 'Priority' })
    @IsNumber()
    nPriority: number;

    @ApiProperty({ example: 1, description: 'Progress' })
    @IsNumber()
    nProgress: number;

    @ApiProperty({ example: 1, description: 'Progress' })
    @IsNumber()
    nStatus: number;

    @ApiProperty({ example: '{"dEnd": "2023-04-30T18:29:59.999Z","dStart": "2023-04-21T12:24:55.063Z","show_tm": "Apr 21 - 30","time_prges": 0}', description: 'Timeline', required: false })
    @IsString()
    @IsOptional()
    jTimeline?: string;

    @ApiProperty({ example: 'F', description: 'Task Type' })
    @IsString()
    cTasktype: string;

    @ApiProperty({ example: '[]', description: 'Users', required: false })
    @IsString()
    jUsers?: string;

    @ApiProperty({ example: 'N', description: 'Permission', required: true })
    @IsString()
    permission?: string;

    @ApiProperty({ example: 1, description: 'Case ID' })
    @IsItUUID()
    nCaseid: string;

    @ApiProperty({ example: '2025-08-12 04:28 PM', description: 'dReminderDt' })
    @IsOptional()
    @IsString()
    dReminderDt: string;

    @IsItUUID()
    nMasterid?: string;
}




export class taskUpdateStatusReq {


    @ApiProperty({ example: 1, description: 'Task ID', required: false })
    @IsOptional()
    @IsItUUID()
    nTaskid: string;

    @ApiProperty({ example: 1, description: 'Progress' })
    @IsNumber()
    nProgress: number;

    @ApiProperty({ example: 1, description: 'Progress' })
    @IsNumber()
    nStatus: number;


    @IsItUUID()
    nMasterid?: string;
}
