import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { EdgeAuthorizeInput, EdgeCancelInput, EdgeRefreshInput, EdgeTokenInput } from '../services/auth/edge-token.types';

/**
 * Request bodies of the venue edge box sign-in routes (`edge/*`, spec §8.4).
 *
 * The global ValidationPipe runs with forbidNonWhitelisted, so every key a caller may send is declared here. The
 * decorators only bound type and size; EdgeTokenService checks formats and answers with a DR22 code (a malformed body
 * still reads `invalid_request`, see EdgeRequestFilter).
 */

export class EdgeAuthorizeReq implements EdgeAuthorizeInput {
    @ApiProperty({ example: '0b6f3c9e-2d4a-4f51-9c7e-5a8d1e2f3b4c', description: 'The venue box (RtEdgeNode.nEdgeid)' })
    @IsString()
    @MaxLength(64)
    nEdgeid: string;

    @ApiProperty({ example: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', description: 'PKCE S256 code challenge' })
    @IsString()
    @MaxLength(128)
    cc: string;

    @ApiPropertyOptional({ example: 'S256', description: 'Only S256' })
    @IsOptional()
    @IsString()
    @MaxLength(16)
    cc_method?: string;

    @ApiProperty({ description: 'The box\'s random state, 16-128 URL-safe characters' })
    @IsString()
    @MaxLength(256)
    state: string;

    @ApiPropertyOptional({ description: 'Must be the box\'s registered callback when given' })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    redirect_uri?: string;

    @ApiPropertyOptional({ example: 'name@example.com', description: 'The email typed on the box (DR5)' })
    @IsOptional()
    @IsString()
    @MaxLength(320)
    login_hint?: string;
}

export class EdgeCancelReq implements EdgeCancelInput {
    @ApiProperty({ description: 'The venue box (RtEdgeNode.nEdgeid)' })
    @IsString()
    @MaxLength(64)
    nEdgeid: string;

    @ApiProperty({ description: 'The box\'s state from the authorize link' })
    @IsString()
    @MaxLength(256)
    state: string;
}

export class EdgeTokenReq implements EdgeTokenInput {
    @ApiProperty({ description: 'The one-time code from the box callback' })
    @IsString()
    @MaxLength(256)
    code: string;

    @ApiProperty({ description: 'PKCE code verifier (43-128 characters)' })
    @IsString()
    @MaxLength(256)
    verifier: string;

    @ApiPropertyOptional({ description: 'The callback\'s state; checked when given' })
    @IsOptional()
    @IsString()
    @MaxLength(256)
    state?: string;

    @ApiPropertyOptional({ description: 'The box; checked when given' })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    nEdgeid?: string;

    @ApiPropertyOptional({ description: 'Required when authorize named one' })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    redirect_uri?: string;
}

/** `edge/refresh` and `edge/signout`: the edge token rides in `Authorization: Bearer`. */
export class EdgeRefreshReq implements EdgeRefreshInput {
    @ApiPropertyOptional({ description: 'The box; checked when given' })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    nEdgeid?: string;
}
