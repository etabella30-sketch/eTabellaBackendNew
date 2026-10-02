import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbEdgeBoxRegistry, DbEdgeUserDirectory, JwtCloudSession } from './edge-token.directory';
import { EdgeTokenKeyConfig, edgeTokenKeyConfigFromEnv } from './edge-token.keys';
import { EdgeTokenService } from './edge-token.service';
import { RedisEdgeTokenStore } from './edge-token.store';
import {
    EDGE_BOX_REGISTRY, EDGE_CLOUD_SESSION, EDGE_TOKEN_KEY_CONFIG, EDGE_TOKEN_OPTIONS, EDGE_TOKEN_STORE, EDGE_USER_DIRECTORY,
    EdgeTokenOptions,
} from './edge-token.types';

/**
 * Wiring for edge sign-in in AuthModule. Config (never committed, never logged):
 *   EDGE_TOKEN_KEY            active private EC P-256 JWK (JSON or base64 JSON); unset = edge sign-in off
 *                             (`edge_unavailable`), the rest of authapi unaffected
 *   EDGE_TOKEN_KEY_PREVIOUS   optional previous key(s) during a rotation
 *   EDGE_BOX_DOMAIN           optional; boxes live at `<cSlug>.<domain>` (default etabella-edge.net)
 */

const logger = new Logger('EdgeTokenConfig');

/** The key config, or null (edge sign-in off) when unset or malformed; a malformed value never stops authapi. */
export function edgeKeyConfigFromConfig(config: Pick<ConfigService, 'get'>): EdgeTokenKeyConfig | null {
    try {
        const keys = edgeTokenKeyConfigFromEnv(name => config.get<string>(name));
        if (!keys) logger.warn('EDGE_TOKEN_KEY is not set: venue box sign-in is off');
        return keys;
    } catch (err) {
        logger.error(`${(err as Error)?.message ?? 'EDGE_TOKEN_KEY is malformed'}: venue box sign-in is off`);
        return null;
    }
}

export function edgeOptionsFromConfig(config: Pick<ConfigService, 'get'>): Partial<EdgeTokenOptions> {
    const domain = config.get<string>('EDGE_BOX_DOMAIN');
    return typeof domain === 'string' && domain.trim() ? { boxDomain: domain.trim() } : {};
}

export const EDGE_TOKEN_PROVIDERS: Provider[] = [
    EdgeTokenService,
    { provide: EDGE_TOKEN_KEY_CONFIG, inject: [ConfigService], useFactory: edgeKeyConfigFromConfig },
    { provide: EDGE_TOKEN_OPTIONS, inject: [ConfigService], useFactory: edgeOptionsFromConfig },
    { provide: EDGE_BOX_REGISTRY, useClass: DbEdgeBoxRegistry },
    { provide: EDGE_USER_DIRECTORY, useClass: DbEdgeUserDirectory },
    { provide: EDGE_TOKEN_STORE, useClass: RedisEdgeTokenStore },
    { provide: EDGE_CLOUD_SESSION, useClass: JwtCloudSession },
];
