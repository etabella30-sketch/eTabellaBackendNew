import { RealtimeService, userRoomsFor } from './realtime.service';

const FACT = '5d0c5b2e-2b9e-4c7e-8f0a-1a2b3c4d5e6f';
const OWNER = '043c3b64-0e14-494d-af52-eeff4cc407f5';
const KHENT = '9d1f5f0a-52c1-4c3c-9d0e-6f6f0a1b2c3d';
const INDER = '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

/** A server whose adapter has these rooms joined; `to()` records the rooms it is asked for. */
function fakeServer(rooms: string[]) {
    const emitted: Array<{ rooms: string | string[]; event: string; payload: any }> = [];
    const server = {
        sockets: { adapter: { rooms: new Map(rooms.map(room => [room, new Set(['sock'])])) } },
        to: jest.fn((target: string | string[]) => ({ emit: (event: string, payload: any) => emitted.push({ rooms: target, event, payload }) })),
    };
    return { server, emitted };
}

describe('userRoomsFor', () => {
    it("finds each recipient's joined U room, whatever case the token wrote the id in", () => {
        const { server } = fakeServer([`U${OWNER}`, `U${INDER.toUpperCase()}`, `FACT_${FACT}`, `U${KHENT}`]);
        expect(userRoomsFor(server as any, [OWNER, INDER, 'nobody-here'])).toEqual([`U${OWNER}`, `U${INDER.toUpperCase()}`]);
    });

    it('answers no rooms for no recipients, garbage, or no adapter', () => {
        const { server } = fakeServer([`U${OWNER}`]);
        expect(userRoomsFor(server as any, undefined)).toEqual([]);
        expect(userRoomsFor(server as any, [])).toEqual([]);
        expect(userRoomsFor(server as any, [42, '', null])).toEqual([]);
        expect(userRoomsFor(undefined, [OWNER])).toEqual([]);
    });
});

describe('RealtimeService.emitCommentMsg', () => {
    // A viewer with no comment thread open never heard of a new comment: it went
    // to the fact's room only. It now also reaches each named viewer's own room,
    // in one emit, so a socket in both rooms hears it once.
    it("sends one message to the fact's room and to each recipient's own room", () => {
        const { server, emitted } = fakeServer([`U${OWNER}`, `U${KHENT}`, `FACT_${FACT}`]);
        const service = new RealtimeService({} as any);
        service.setServer(server as any);
        const message = { type: 'FACT-MESSAGE', nFSid: FACT, nCid: 'c-new', nUserid: KHENT, recipients: [OWNER, INDER] };

        service.emitCommentMsg(message);

        expect(emitted).toEqual([{ rooms: [`FACT_${FACT}`, `U${OWNER}`], event: 'factsheet-comments', payload: message }]);
    });

    it('keeps working for an older coreapi that names no recipients', () => {
        const { server, emitted } = fakeServer([`U${OWNER}`]);
        const service = new RealtimeService({} as any);
        service.setServer(server as any);

        service.emitCommentMsg({ nFSid: FACT, nCid: 'c-old' });

        expect(emitted).toEqual([{ rooms: [`FACT_${FACT}`], event: 'factsheet-comments', payload: { nFSid: FACT, nCid: 'c-old' } }]);
    });
});
