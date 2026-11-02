import { sourceHearingTimecode } from '@app/api-contracts';
import { consecutiveLiveQfactLines, LIVE_QFACT_CAPTURE_WINDOW_MS, LiveQfactCoordinate, splitLiveQfactLines, withinLiveQfactCaptureWindow } from './live-qfact-rules';

const line = (order: number, time: string, run='r1', at?: number): LiveQfactCoordinate => ({
  identity: String(order), p:1,l:order,oP:1,oL:order,text:'test',otext:'test',t:time,
  capture:'live-instant',run,order,hearing:sourceHearingTimecode(time),...(at===undefined ? {} : {at}),
});
describe('ordinary QFACT line grouping', () => {
  it('splits only at a missing line, never at a hearing pause inside a stored group (Option B)', () => {
    expect(splitLiveQfactLines([line(10,'10:00:00:00'),line(11,'10:00:10:00'),line(12,'10:00:35:00'),line(14,'10:01:10:00')])
      .map(group=>group.map(item=>item.order))).toEqual([[10,11,12],[14]]);
  });
  it('never bridges an unmarked line or a formal restart', () => {
    expect(consecutiveLiveQfactLines(line(10,'10:00:00:00'),line(12,'10:00:10:00'))).toBe(false);
    expect(consecutiveLiveQfactLines(line(10,'10:00:00:00'),line(11,'10:00:10:00','r2'))).toBe(false);
  });
  it('orders lines that arrive out of order', () => {
    expect(splitLiveQfactLines([line(12,'10:00:35:00'),line(10,'10:00:00:00'),line(11,'10:00:10:00')]).length).toBe(1);
  });
});

describe('Option B capture window', () => {
  const T=1_000_000;
  it('measures from the group\'s last capture (server receipt), inclusive of 30 s', () => {
    const group=[line(10,'10:00:00:00','r1',T),line(11,'10:00:05:00','r1',T+20_000)];
    expect(withinLiveQfactCaptureWindow(group,group[1],line(13,'10:09:00:00'),T+20_000+LIVE_QFACT_CAPTURE_WINDOW_MS)).toBe(true);
    expect(withinLiveQfactCaptureWindow(group,group[1],line(13,'10:00:06:00'),T+20_000+LIVE_QFACT_CAPTURE_WINDOW_MS+1)).toBe(false);
  });
  it('falls back to the hearing gap between the facing edge and the click for groups without capture times', () => {
    const group=[line(10,'10:00:00:00'),line(11,'10:00:05:00')];
    expect(withinLiveQfactCaptureWindow(group,group[1],line(13,'10:00:35:00'),T)).toBe(true);
    expect(withinLiveQfactCaptureWindow(group,group[1],line(13,'10:00:35:01'),T)).toBe(false);
    expect(withinLiveQfactCaptureWindow(group,group[0],line(8,'09:59:40:00'),T)).toBe(true);
    expect(withinLiveQfactCaptureWindow(group,group[1],line(13,''),T)).toBe(false);
  });
});
