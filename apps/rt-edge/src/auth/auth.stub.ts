/**
 * SKELETON STUBS of AuthPort and AccessPort: nobody is authenticated (authenticate throws NotImplementedPortError,
 * so every signed-in route answers 500, never a false 401), permission checks deny, lists are empty, actions throw.
 * Replace with the real auth module (keep AUTH_PORT / ACCESS_PORT; change `useClass` in auth.module.ts).
 */
import { Inject, Injectable } from '@nestjs/common';

import type {
    EdgeMeResponse,
    EdgeRoomGrant,
    EdgeSignInStartResponse,
    IssueRoomCodesResponse,
    OperatorCodeIssueResponse,
    OperatorCodeSignInResponse,
    OperatorCodeStatusResponse,
    ReissueRoomCodeResponse,
    RoomCodeListResponse,
    RoomCodePickerResponse,
    RoomCodeRedeemResponse,
    RoomCodeRowResponse,
} from '../contracts';
import {
    AccessPort,
    AuthPort,
    BOX_CONFIG,
    BoxConfig,
    boxDay,
    EdgeDeviceCookie,
    EdgePrincipal,
    notImplemented,
    Reply,
} from '../ports';

@Injectable()
export class AuthStub implements AuthPort {
    async authenticate(): Promise<EdgePrincipal> {
        return notImplemented('AuthPort', 'authenticate');
    }

    reverifyOnline(): EdgePrincipal {
        return notImplemented('AuthPort', 'reverifyOnline');
    }

    requireBoxAdmin(): void {
        notImplemented('AuthPort', 'requireBoxAdmin');
    }

    requireOnlineCaseAdmin(): void {
        notImplemented('AuthPort', 'requireOnlineCaseAdmin');
    }

    canSeeCase(): boolean {
        return false;
    }

    canOpenSession(): boolean {
        return false;
    }

    rooms(): readonly EdgeRoomGrant[] {
        return [];
    }

    me(): Reply<EdgeMeResponse> {
        return notImplemented('AuthPort', 'me');
    }

    async signOut(): Promise<void> {
        return notImplemented('AuthPort', 'signOut');
    }
}

@Injectable()
export class AccessStub implements AccessPort {
    constructor(@Inject(BOX_CONFIG) private readonly config: BoxConfig) {}

    signInStart(): Reply<EdgeSignInStartResponse> {
        return notImplemented('AccessPort', 'signInStart');
    }

    async redeemRoomCode(): Promise<{ readonly reply: Reply<RoomCodeRedeemResponse>; readonly deviceCookie: EdgeDeviceCookie | null }> {
        return notImplemented('AccessPort', 'redeemRoomCode');
    }

    async operatorSignIn(): Promise<Reply<OperatorCodeSignInResponse>> {
        return notImplemented('AccessPort', 'operatorSignIn');
    }

    listRoomCodes(): Reply<RoomCodeListResponse> {
        return { rows: [], unusedCount: 0 };
    }

    roomCodePicker(principal: EdgePrincipal): Reply<RoomCodePickerResponse> {
        return { sessions: [], operatorNameRequired: principal.kind === 'operator' };
    }

    issueRoomCodes(): Reply<IssueRoomCodesResponse> {
        return notImplemented('AccessPort', 'issueRoomCodes');
    }

    revokeRoomCode(): Reply<RoomCodeRowResponse> {
        return notImplemented('AccessPort', 'revokeRoomCode');
    }

    endRoomAccess(): Reply<RoomCodeRowResponse> {
        return notImplemented('AccessPort', 'endRoomAccess');
    }

    reissueRoomCode(): Reply<ReissueRoomCodeResponse> {
        return notImplemented('AccessPort', 'reissueRoomCode');
    }

    operatorCodeStatus(_principal: EdgePrincipal, nowMs: number): Reply<OperatorCodeStatusResponse> {
        return {
            day: boxDay(nowMs, this.config.box.timeZone),
            issued: false,
            issuedAtMs: null,
            mintedBy: null,
            validUntilMs: null,
            usesToday: 0,
        };
    }

    async issueOperatorCode(): Promise<Reply<OperatorCodeIssueResponse>> {
        return notImplemented('AccessPort', 'issueOperatorCode');
    }
}
