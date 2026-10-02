/**
 * Launcher shim for tcp-server-main/tcp.js (run as `node -r tcp-preload.js tcp.js` with cwd = tcp-server-main; tcp.js
 * itself is never modified). Two changes, nothing else:
 *
 * 1. Ports. tcp.js listens on fixed 127.0.0.1:1337 (TCP) and :8081 (HTTP). Both are rebound to 127.0.0.1:0 and the
 *    port actually bound is announced on stdout as `E2E_LISTEN tcp <port>` / `E2E_LISTEN http <port>`.
 * 2. Pace. tcp.js waits `delayMs` (400 ms) between chunks with `setTimeout(resolve, 400)`. With
 *    E2E_TCP_TIME_SCALE=N (> 1) exactly those waits last 400/N ms, timed with setImmediate (a Windows timer cannot
 *    wait less than ~16 ms). Every chunk is still one socket.write, in order.
 *
 * Plain JavaScript on purpose: it is loaded by plain node, before tcp.js.
 */
'use strict';
const net = require('net');
const { performance } = require('perf_hooks');

const TCP_DELAY_MS = 400;
const scale = Number(process.env.E2E_TCP_TIME_SCALE || '1');

const originalListen = net.Server.prototype.listen;
net.Server.prototype.listen = function patchedListen(...args) {
    if (typeof args[0] === 'number' && (args[0] === 1337 || args[0] === 8081)) {
        const which = args[0] === 1337 ? 'tcp' : 'http';
        args[0] = 0;
        this.once('listening', () => {
            const addr = this.address();
            process.stdout.write(`E2E_LISTEN ${which} ${addr && typeof addr === 'object' ? addr.port : 0}\n`);
        });
    }
    return originalListen.apply(this, args);
};

if (scale > 1) {
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = function patchedSetTimeout(fn, ms, ...rest) {
        if (ms === TCP_DELAY_MS && typeof fn === 'function') {
            const due = performance.now() + TCP_DELAY_MS / scale;
            const tick = () => {
                if (performance.now() >= due) fn(...rest);
                else setImmediate(tick);
            };
            setImmediate(tick);
            return { ref() { return this; }, unref() { return this; }, hasRef() { return true; }, refresh() { return this; } };
        }
        return originalSetTimeout.call(this, fn, ms, ...rest);
    };
}
