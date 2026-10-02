/**
 * SPEC HELPER (imported by *.spec.ts and the spec fixtures only; nothing in the box imports it): the box WITHOUT its
 * feature modules.
 *
 * `bareBox(AppModule.register(opts), ports)` keeps what app.module.ts itself owns — the global core (BOX_CONFIG,
 * EDGE_RUN_MODE, EDGE_CLOCK, EDGE_EVENT_BUS, EDGE_BOOT_STATUS), EdgeLifecycle and its start budget, exactly as
 * `register` built them — and replaces state/, kernel/, uplink/, auth/, ops/, lan/ and cli/ by the providers given.
 * The skeleton's specs (main.ts, the lifecycle) therefore never depend on what those modules provide or construct:
 * no database, socket, file or cloud, whatever a later wave puts behind a port.
 */
import { DynamicModule, Module, ModuleMetadata, Provider } from '@nestjs/common';

import { EdgeCoreModule } from '../../app.module';
import { KERNEL_PORT, LAN_PORT, OPS_PORT, STATE_PORT, UPLINK_PORT } from '../tokens';

@Module({})
class BareBoxModule {}

/** The ports EdgeLifecycle injects (app.module.ts); a bare box must provide all five. */
export const LIFECYCLE_PORT_TOKENS = [STATE_PORT, KERNEL_PORT, UPLINK_PORT, OPS_PORT, LAN_PORT] as const;
export type LifecyclePortToken = (typeof LIFECYCLE_PORT_TOKENS)[number];

/** A lifecycle port as far as EdgeLifecycle uses it. */
export interface InertLifecyclePort {
    start(): Promise<void>;
    close(): Promise<void>;
}

const inert = (): InertLifecyclePort => ({ start: async () => undefined, close: async () => undefined });

/**
 * `useValue` providers for the five lifecycle ports: `given[token]` where present, an inert `{start, close}`
 * otherwise. Pass `omit` for a port that an extra import provides (e.g. STATE_PORT from the real StateModule).
 */
export function lifecyclePorts(given: Partial<Record<LifecyclePortToken, unknown>> = {}, omit: readonly LifecyclePortToken[] = []): Provider[] {
    return LIFECYCLE_PORT_TOKENS.filter(token => !omit.includes(token)).map(token => ({ provide: token, useValue: given[token] ?? inert() }));
}

/**
 * The same box as `box` (an `AppModule.register` result) without its feature modules: its EdgeCoreModule, its own
 * providers (the start budget, EdgeLifecycle) and `ports`; `extraImports` adds real modules a spec wants.
 */
export function bareBox(box: DynamicModule, ports: readonly Provider[], extraImports: NonNullable<ModuleMetadata['imports']> = []): DynamicModule {
    const core = (box.imports ?? []).filter(m => (m as DynamicModule)?.module === EdgeCoreModule);
    if (core.length !== 1) throw new Error('bareBox: expected an AppModule.register(...) result (one EdgeCoreModule import)');
    return {
        module: BareBoxModule,
        imports: [...core, ...extraImports],
        providers: [...(box.providers ?? []), ...ports],
        exports: box.exports ?? [],
    };
}
