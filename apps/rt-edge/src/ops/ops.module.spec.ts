import { Test } from '@nestjs/testing';

import {
    AUTH_PORT,
    BOX_CONFIG,
    EDGE_BOOT_STATUS,
    EDGE_CLOCK,
    EDGE_EVENT_BUS,
    EdgeDeviceHealth,
    InMemoryEdgeEventBus,
    KERNEL_PORT,
    OPS_PORT,
    OpsPort,
    STATE_PORT,
    UPLINK_PORT,
} from '../ports';
import { DEFAULT_OPS_TUNING, OPS_TUNING } from './ops.constants';
import { NODE_OPS_TIMERS, NodeOpsHost, OPS_HOST, OPS_TIMERS } from './ops-host';
import { OpsModule } from './ops.module';
import { OpsService } from './ops.service';
import { FakeAuth, FakeBoot, FakeKernel, FakeOpsHost, FakeState, FakeUplink, ManualTimers, NOW, sessionRecord, testConfig } from './testing/ops-fakes';
import { TransmitterControl } from './transmitter';

type ProviderMeta = { provide?: unknown; useClass?: unknown; useValue?: unknown } | (new (...args: never[]) => unknown);

describe('OpsModule wiring', () => {
    const meta = <T>(key: string): T[] => (Reflect.getMetadata(key, OpsModule) ?? []) as T[];

    it('provides OPS_PORT with OpsService (the stub is replaced), the Node host, Node timers and the default tuning', () => {
        const providers = meta<ProviderMeta>('providers');
        const byToken = (token: unknown) => providers.find(p => typeof p === 'object' && p.provide === token) as { useClass?: unknown; useValue?: unknown };
        expect(byToken(OPS_PORT).useClass).toBe(OpsService);
        expect(byToken(OPS_HOST).useClass).toBe(NodeOpsHost);
        expect(byToken(OPS_TIMERS).useValue).toBe(NODE_OPS_TIMERS);
        expect(byToken(OPS_TUNING).useValue).toBe(DEFAULT_OPS_TUNING);
        expect(providers).toContain(TransmitterControl);
        expect(meta('exports')).toEqual([OPS_PORT, TransmitterControl]);
    });

    it('registers no controller: the LAN module owns the HTTP routes (no duplicate paths)', () => {
        expect(meta('controllers')).toEqual([]);
    });

    it('resolves every injection of its providers and runs start → heartbeat → close', async () => {
        const state = new FakeState();
        state.sessionsData = [sessionRecord()];
        const bus = new InMemoryEdgeEventBus();
        const timers = new ManualTimers();
        const ref = await Test.createTestingModule({
            providers: [
                ...meta<never>('providers'),
                { provide: BOX_CONFIG, useValue: testConfig() },
                { provide: EDGE_CLOCK, useValue: () => NOW },
                { provide: EDGE_EVENT_BUS, useValue: bus },
                { provide: EDGE_BOOT_STATUS, useValue: new FakeBoot() },
                { provide: STATE_PORT, useValue: state.asPort() },
                { provide: KERNEL_PORT, useValue: new FakeKernel().asPort() },
                { provide: UPLINK_PORT, useValue: new FakeUplink().asPort() },
                { provide: AUTH_PORT, useValue: new FakeAuth().asPort() },
            ],
        })
            .overrideProvider(OPS_HOST)
            .useValue(new FakeOpsHost())
            .overrideProvider(OPS_TIMERS)
            .useValue(timers)
            .compile();
        const ops = ref.get<OpsPort>(OPS_PORT);
        expect(ops).toBeInstanceOf(OpsService);
        expect(ref.get(TransmitterControl)).toBeInstanceOf(TransmitterControl);
        const health: EdgeDeviceHealth[] = [];
        bus.subscribe('device-health', h => health.push(h));
        await ops.start();
        expect(health).toHaveLength(1);
        // Heartbeat, clock, network re-run (user decision 2026-10-04), retention.
        expect(timers.active.size).toBe(4);
        await ops.close();
        expect(timers.active.size).toBe(0);
        await ref.close();
    });
});
