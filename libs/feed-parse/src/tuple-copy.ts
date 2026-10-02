/**
 * DET-5 (spec §6.1): shared mutable tuples never leave the lane. Before
 * DET-5 every payload the parser emitted held the line buffer's own tuples:
 * the realtime-server gateway rewrote `line[1]` in place on TCP-DATA
 * (events.gateway.ts ingestTcpData), so a consumer could change the parser's
 * state, and a replay without that consumer diverged from the live run.
 * Every payload now carries its own deep copy, taken at the moment of the
 * emit, so it holds exactly what the buffer held then and nothing a consumer
 * does to it reaches the buffer.
 *
 * The copy keeps array holes as holes and `undefined` as `undefined`, so a
 * payload looks exactly as the shared tuple did (no JSON round trip).
 */

/** A deep copy of a line tuple (or any value inside one). */
export function copyTuple<T>(value: T): T {
  if (Array.isArray(value)) {
    const out = new Array(value.length);
    for (let i = 0; i < value.length; i++) {
      if (i in value) out[i] = copyTuple(value[i]);
    }
    return out as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    // tuples hold strings, numbers, null and arrays; anything else is copied structurally
    return structuredClone(value);
  }
  return value;
}

/** Deep copies of a list of tuples (holes kept). */
export function copyTuples<T>(list: T[]): T[] {
  if (!Array.isArray(list)) return list;
  return copyTuple(list);
}
