import { Module } from '@nestjs/common';

/**
 * `/authapi` on the box (api.module.ts mounts it under that prefix). Empty in Phase 4: sign-in stays on
 * etabella.net and the box's own `/edge/auth/*` forwarders. Phase 11 (D10, after HTTPS on the box) mounts the
 * `edge/token`, `edge/refresh` and `edge/password` forwarders and the cached `edge/jwks` here, so the FE edge build
 * can point `api.auth` at the box origin. Until then every `/authapi/*` request answers `403 use_cloud`.
 */
@Module({})
export class LocalAuthModule {}
