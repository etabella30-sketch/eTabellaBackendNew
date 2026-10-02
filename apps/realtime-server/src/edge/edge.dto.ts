/**
 * Request bodies and queries of the edge REST routes. realtime-server runs a global ValidationPipe with
 * whitelist + forbidNonWhitelisted, so every key a caller may send is declared here. The acting user is
 * never a body key: it comes from the verified token (req.user).
 */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

const toBool = ({ value }) => (value === true || value === 'true' || value === '1' ? true : value === false || value === 'false' || value === '0' ? false : value);
const toInt = ({ value }) => (value === '' || value === null || value === undefined ? value : Number(value));

// ----- device routes (public / device-signed) -----

export class EdgeChallengeQuery {
    @ApiProperty({ description: 'Venue box id (RtEdgeNode.nEdgeid)' })
    @IsUUID()
    edgeId: string;
}

export class EdgeEnrollReq {
    @ApiProperty({ description: 'One-time 128-bit enrolment code (26 base32 characters, dashes allowed)' })
    @IsString()
    @MaxLength(64)
    code: string;

    @ApiProperty({ description: 'Device public key: standard base64 of the P-256 SubjectPublicKeyInfo DER' })
    @IsString()
    @MaxLength(400)
    cPubKey: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(toBool)
    @IsBoolean()
    bTpmKey?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(40)
    cVersion?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(60)
    cParserVer?: string;

    @ApiProperty({ required: false, description: 'Box address on the transmitter network' })
    @IsOptional()
    @IsString()
    @MaxLength(45)
    cLanIp?: string;
}

export class EdgeDeviceSigned {
    @ApiProperty()
    @IsUUID()
    edgeId: string;

    @ApiProperty({ description: 'Nonce from edge/v1/challenge' })
    @Matches(/^[0-9a-f]{64}$/)
    nonce: string;

    @ApiProperty({ description: 'base64 ECDSA-P256-SHA256 signature by the device key' })
    @IsString()
    @MaxLength(400)
    sig: string;
}

export class EdgeCertReq extends EdgeDeviceSigned {
    @ApiProperty({ description: 'PKCS#10 CSR, PEM' })
    @IsString()
    @MaxLength(16_384)
    csr: string;
}

export class EdgeArchiveUrlReq extends EdgeDeviceSigned {
    @ApiProperty()
    @IsUUID()
    nSesid: string;

    @ApiProperty({ description: 'sha256 hex of the file to upload' })
    @Matches(/^[0-9a-f]{64}$/)
    sha256: string;

    @ApiProperty()
    @Transform(toInt)
    @IsInt()
    @Min(0)
    bytes: number;
}

// ----- admin routes -----

export class EdgeIdQuery {
    @ApiProperty()
    @IsUUID()
    nEdgeid: string;
}

export class EdgeListQuery {
    @ApiProperty({ required: false, description: 'Only boxes assigned to this case' })
    @IsOptional()
    @IsUUID()
    nCaseid?: string;

    @ApiProperty({ required: false, description: 'Include revoked boxes' })
    @IsOptional()
    @Transform(toBool)
    @IsBoolean()
    bAll?: boolean;
}

export class EdgeCreateReq {
    @ApiProperty()
    @IsString()
    @MinLength(1)
    @MaxLength(120)
    cName: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    cVenue?: string;

    @ApiProperty({ required: false, description: 'Opaque slug, 6-40 [a-z0-9]; generated when absent' })
    @IsOptional()
    @Matches(/^[a-z0-9]{6,40}$/)
    cSlug?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(toInt)
    @IsInt()
    @Min(1)
    @Max(65535)
    nCatPort?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    nScopeAdmin?: string;
}

export class EdgeIdReq {
    @ApiProperty()
    @IsUUID()
    nEdgeid: string;
}

export class EdgeConfirmKeyReq extends EdgeIdReq {
    @ApiProperty({ description: 'The fingerprint shown on the box console (colons and spaces allowed)' })
    @IsString()
    @MaxLength(120)
    cKeyFpr: string;
}

export class EdgeQuarantineReq extends EdgeIdReq {
    @ApiProperty({ enum: ['Q', 'A'] })
    @IsIn(['Q', 'A'])
    cAction: 'Q' | 'A';

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(400)
    cNote?: string;
}

export class EdgeRevokeReq extends EdgeIdReq {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(400)
    cNote?: string;
}

export class EdgeCaseReq extends EdgeIdReq {
    @ApiProperty()
    @IsUUID()
    nCaseid: string;

    @ApiProperty({ enum: ['I', 'D'], description: 'I assign, D unassign' })
    @IsIn(['I', 'D'])
    permission: 'I' | 'D';
}

export class EdgeOrphansQuery {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    nSesid?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    nEdgeid?: string;

    @ApiProperty({ required: false, enum: ['P', 'D', 'A', 'M'] })
    @IsOptional()
    @IsIn(['P', 'D', 'A', 'M'])
    cStatus?: string;
}

export class EdgeResolveReq {
    @ApiProperty()
    @IsUUID()
    nOrphanid: string;

    @ApiProperty({ enum: ['D', 'A'], description: 'D dismiss (super-admin, note), A addendum produced' })
    @IsIn(['D', 'A'])
    cStatus: 'D' | 'A';

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(400)
    cNote?: string;
}

export class EdgeEventsQuery {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    nEdgeid?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    nSesid?: string;

    @ApiProperty({ required: false, description: "Only events of this type (RtEdgeEvent.cType, e.g. 'ready', 'seal', 'warn_ack')" })
    @IsOptional()
    @Matches(/^[a-z][a-z0-9_.-]{0,29}$/)
    cType?: string;
}

export class EdgeSessionQuery {
    @ApiProperty()
    @IsUUID()
    nSesid: string;
}

export class EdgeShrinkReq {
    @ApiProperty()
    @IsUUID()
    nSesid: string;

    @ApiProperty()
    @IsUUID()
    heldId: string;

    @ApiProperty({ enum: ['confirm', 'reject'] })
    @IsIn(['confirm', 'reject'])
    cAction: 'confirm' | 'reject';

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(400)
    cNote?: string;
}

// ----- session routes -----

export class EdgeSplitReq {
    @ApiProperty({ description: 'Part 1: the venue-box session to split' })
    @IsUUID()
    nSesid: string;

    @ApiProperty({ required: false, description: 'Part 2 name; default "<Part 1 name> (Part N)"' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    cName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(400)
    cNote?: string;
}

export class EdgeDirectReq {
    @ApiProperty()
    @IsUUID()
    nSesid: string;
}

export class EdgeForceSealReq {
    @ApiProperty()
    @IsUUID()
    nSesid: string;

    @ApiProperty({ description: 'Watermark note, e.g. "venue data missing 10:02-11:40"' })
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    cSealNote: string;
}

export class EdgeWarnAckReq {
    @ApiProperty()
    @IsUUID()
    nSesid: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(400)
    cNote?: string;
}
