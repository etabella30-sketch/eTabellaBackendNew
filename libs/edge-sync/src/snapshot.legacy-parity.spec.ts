/**
 * D11/D12 parity: the shared builder must emit exactly what today's cloud
 * memory path emits (apps/realtime-server feed-data.service.ts
 * streamSessionData, :536-571), every field byte-identical, except the page
 * ORDER, which D12 makes newest-first on purpose.
 *
 * The reference is the REAL streamSessionData (the service with only what it
 * touches, as feed-data.stream-session.spec.ts builds it). Once the service
 * delegates to buildSnapshot this stays green; the fixed vectors in
 * snapshot.spec.ts keep pinning the contract.
 */
import { FeedDataService } from '../../../apps/realtime-server/src/services/feed-data/feed-data.service';
import { buildSnapshot } from './snapshot';

const SES = '31ae9a74-7d69-4996-a78b-9c29b7af9653';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function legacyPayloads(pages: Record<string, unknown>, body: any, qFacts: any, qMarks: any): Promise<any[]> {
  const emitted: any[] = [];
  const service = Object.create(FeedDataService.prototype) as FeedDataService;
  Object.assign(service, {
    readSessionData: jest.fn().mockResolvedValue(pages),
    io: { server: { to: (room: string) => ({ emit: (event: string, payload: any) => emitted.push({ room, event, payload }) }) } },
    util: { delay: jest.fn() },
    log: { error: jest.fn() },
    logger: { verbose: jest.fn(), error: jest.fn() },
  });
  await service.streamSessionData('sock-1', body, qFacts, qMarks);
  expect(emitted.every(e => e.room === 'sock-1' && e.event === 'previous-data')).toBe(true);
  return emitted.map(e => e.payload);
}

/** A random session: pages with gaps, odd bodies, facts and marks of every shape. */
function randomCase(rand: () => number) {
  const int = (n: number) => Math.floor(rand() * n);
  const pages: Record<string, unknown> = {};
  const count = int(30);
  for (let k = 0; k < count; k++) {
    const page = 1 + int(60);
    const r = rand();
    pages[String(page)] =
      r < 0.05 ? null : Array.from({ length: 1 + int(25) }, (_, s) => ['10:00:0' + int(9), Array.from({ length: int(8) }, () => 32 + int(90)), (page - 1) * 25 + s, 'FL', null]);
  }
  const markShape = (key: string) => {
    const r = rand();
    if (r < 0.1) return undefined;
    if (r < 0.15) return null;
    if (r < 0.2) return {};
    return Array.from({ length: int(12) }, (_, k) => {
      const v = rand();
      const page = 1 + int(60);
      return { id: k, [key]: v < 0.3 ? String(page) : v < 0.4 ? undefined : v < 0.45 ? `0${page}` : page };
    });
  };
  const tabRoll = rand();
  const body = { nSesid: SES, tab: tabRoll < 0.2 ? undefined : tabRoll < 0.3 ? '7' : 1 + int(100) };
  return { pages, body, qFacts: markShape('pageIndex'), qMarks: markShape('cPageno') };
}

describe('buildSnapshot parity with FeedDataService.streamSessionData', () => {
  // The legacy path console.logs every caught fact/mark error; keep the run quiet.
  beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
  afterAll(() => jest.restoreAllMocks());

  it('emits the same payloads, byte for byte, on 300 seeded random sessions; only the order differs (newest-first)', async () => {
    const rand = mulberry32(0xd11d12);
    for (let k = 0; k < 300; k++) {
      const { pages, body, qFacts, qMarks } = randomCase(rand);
      const legacy = await legacyPayloads(pages, body, qFacts, qMarks);
      const shared = buildSnapshot(pages as any, { nSesid: body.nSesid, tab: body.tab, qFacts: qFacts as any, qMarks: qMarks as any });

      const bytes = (list: any[]) => list.map(p => JSON.stringify(p)).sort();
      expect(bytes(shared)).toEqual(bytes(legacy));
      expect(shared.map(p => Object.keys(p))).toEqual(shared.map(() => ['msg', 'page', 'data', 'totalPages', 'nSesid', 'a', 'h', 'tab']));
      const order = shared.map(p => p.page);
      expect(order).toEqual([...order].sort((a, b) => b - a));
    }
  });

  it('agrees on the stream-session fixture, field for field', async () => {
    const pages = Object.fromEntries(Array.from({ length: 3 }, (_, i) => [String(i + 1), [[`10:00:${i}`, `line on page ${i + 1}`, i * 25]]]));
    const qFacts = [{ nIDid: 'a2', pageIndex: 2 }];
    const qMarks = [{ nHid: 'h3', cPageno: '3' }];
    const legacy = await legacyPayloads(pages, { nSesid: SES, tab: 4 }, qFacts, qMarks);
    const shared = buildSnapshot(pages, { nSesid: SES, tab: 4, qFacts, qMarks });
    const byPage = (list: any[]) => [...list].sort((a, b) => a.page - b.page);
    expect(byPage(shared)).toEqual(byPage(legacy));
    expect(shared.map(p => p.page)).toEqual([3, 2, 1]);
  });

  it('both send nothing for an empty session', async () => {
    expect(await legacyPayloads({}, { nSesid: SES, tab: 1 }, [], [])).toEqual([]);
    expect(buildSnapshot({}, { nSesid: SES, tab: 1, qFacts: [], qMarks: [] })).toEqual([]);
  });
});
