/**
 * DI tokens of the venue box (apps/rt-edge). Every seam between the box modules is an interface in this folder
 * plus one token here; a module provides its port with `{ provide: <TOKEN>, useClass: <Impl> }` and exports the
 * token, and consumers inject it with `@Inject(<TOKEN>) private readonly x: <Port>`.
 *
 * The five core tokens (BOX_CONFIG, EDGE_RUN_MODE, EDGE_CLOCK, EDGE_EVENT_BUS, EDGE_BOOT_STATUS) come from the
 * global `EdgeCoreModule` (app.module.ts); every other token belongs to exactly one module:
 *
 * | Token          | Port            | Module            |
 * |----------------|-----------------|-------------------|
 * | STATE_PORT     | `StatePort`     | state/            |
 * | KERNEL_PORT    | `KernelPort`    | kernel/           |
 * | UPLINK_PORT    | `UplinkPort`    | uplink/           |
 * | AUTH_PORT      | `AuthPort`      | auth/             |
 * | ACCESS_PORT    | `AccessPort`    | auth/             |
 * | OPS_PORT       | `OpsPort`       | ops/              |
 * | LAN_PORT       | `LanPort`       | lan/              |
 * | CLI_PORT       | `CliPort`       | cli/              |
 */

/** `BoxConfig` (ports/box-config.ts): the parsed, frozen JSON box config file. */
export const BOX_CONFIG = 'RT_EDGE_BOX_CONFIG';
/** `EdgeRunMode`: 'serve' (the long-running box) or 'cli' (a one-shot command; nothing may open a socket). */
export const EDGE_RUN_MODE = 'RT_EDGE_RUN_MODE';
/** `EdgeClock`: epoch-ms clock. Inject it instead of calling `Date.now()` so specs can drive time. */
export const EDGE_CLOCK = 'RT_EDGE_CLOCK';
/** `EdgeEventBus` (ports/event-bus.ts): in-process status events the LAN gateway turns into socket events. */
export const EDGE_EVENT_BUS = 'RT_EDGE_EVENT_BUS';
/** `EdgeBootStatus` (ports/boot.ts): boot phase and the service starts that failed (read by ops for the verdict). */
export const EDGE_BOOT_STATUS = 'RT_EDGE_BOOT_STATUS';

export const STATE_PORT = 'RT_EDGE_STATE_PORT';
export const KERNEL_PORT = 'RT_EDGE_KERNEL_PORT';
export const UPLINK_PORT = 'RT_EDGE_UPLINK_PORT';
export const AUTH_PORT = 'RT_EDGE_AUTH_PORT';
export const ACCESS_PORT = 'RT_EDGE_ACCESS_PORT';
export const OPS_PORT = 'RT_EDGE_OPS_PORT';
export const LAN_PORT = 'RT_EDGE_LAN_PORT';
export const CLI_PORT = 'RT_EDGE_CLI_PORT';

/**
 * - `serve`: the box process (`main.ts` with no command): HTTPS + LAN gateway + CAT ingest + cloud uplink.
 * - `cli`: `rt-edge enroll|status|recover|capture …` (§3.2 `cli`): an application context with the same providers,
 *   but the lifecycle starts nothing. Implementations MUST NOT open a CAT listener, dial a transmitter, connect the
 *   uplink or bind any port in `cli` mode unless a CLI command explicitly asks them to (e.g. `enroll`).
 */
export type EdgeRunMode = 'serve' | 'cli';

/** Epoch milliseconds (UTC), like `Date.now`. */
export type EdgeClock = () => number;

/** Returned by every `subscribe`/`on…` call: removes that one listener; idempotent. */
export type Unsubscribe = () => void;
