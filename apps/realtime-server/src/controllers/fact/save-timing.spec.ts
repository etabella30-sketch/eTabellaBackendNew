import { SaveTiming } from './save-timing';

describe('SaveTiming (Server-Timing on mark saves, 2026-11-03)', () => {
  it('reports each step and the total', () => {
    const t = new SaveTiming();
    t.step('fact');
    t.step('detail');
    const setHeader = jest.fn();
    t.send({ headersSent: false, setHeader } as any);
    expect(setHeader).toHaveBeenCalledWith('Server-Timing', expect.stringMatching(/^fact;dur=[\d.]+, detail;dur=[\d.]+, total;dur=[\d.]+$/));
  });

  it('never throws: no response, headers already sent, or a failing setHeader', () => {
    const t = new SaveTiming();
    expect(() => t.send(undefined)).not.toThrow();
    const sent = jest.fn();
    t.send({ headersSent: true, setHeader: sent } as any);
    expect(sent).not.toHaveBeenCalled();
    expect(() => t.send({ headersSent: false, setHeader: () => { throw new Error('x'); } } as any)).not.toThrow();
  });
});
