import { sourceHearingTimecode } from '@app/api-contracts';
import { consecutiveLiveQfactLines, LIVE_QFACT_CAPTURE_WINDOW_MS, LiveQfactCoordinate, liveQfactIssueKey, splitLiveQfactLines, withinLiveQfactCaptureWindow } from './live-qfact-rules';

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

// User 2026-11-04: the click within 30 s of the group's last capture OR the lines' transcript times within 30 s.
describe('capture window: click time or transcript time', () => {
  const T=1_000_000;
  it('a click within 30 s of the group\'s last capture joins, whatever the pause in the testimony (inclusive)', () => {
    const group=[line(10,'10:00:00:00','r1',T),line(11,'10:00:05:00','r1',T+20_000)];
    expect(withinLiveQfactCaptureWindow(group,group[1],line(12,'10:09:00:00'),T+20_000+LIVE_QFACT_CAPTURE_WINDOW_MS)).toBe(true);
  });
  it('a later click still joins when the lines were spoken within 30 s; not when both are over 30 s', () => {
    const group=[line(10,'10:00:00:00','r1',T),line(11,'10:00:05:00','r1',T+20_000)];
    const late=T+20_000+LIVE_QFACT_CAPTURE_WINDOW_MS+1;
    expect(withinLiveQfactCaptureWindow(group,group[1],line(12,'10:00:35:00'),late)).toBe(true);     // 30 s spoken
    expect(withinLiveQfactCaptureWindow(group,group[1],line(12,'10:00:35:01'),late)).toBe(false);    // 30 s + a frame
    expect(withinLiveQfactCaptureWindow(group,group[0],line(9,'09:59:40:00'),late)).toBe(true);      // the line above
    expect(withinLiveQfactCaptureWindow(group,group[1],line(12,''),late)).toBe(false);               // no transcript time
  });
  it('falls back to the hearing gap between the facing edge and the click for groups without capture times', () => {
    const group=[line(10,'10:00:00:00'),line(11,'10:00:05:00')];
    expect(withinLiveQfactCaptureWindow(group,group[1],line(13,'10:00:35:00'),T)).toBe(true);
    expect(withinLiveQfactCaptureWindow(group,group[1],line(13,'10:00:35:01'),T)).toBe(false);
    expect(withinLiveQfactCaptureWindow(group,group[0],line(8,'09:59:40:00'),T)).toBe(true);
    expect(withinLiveQfactCaptureWindow(group,group[1],line(13,''),T)).toBe(false);
  });
});

describe('issue identity for joining (user 2026-11-04: same issues only)', () => {
  const U='88888888-8888-4888-8888-888888888888', A='AAAAAAAA-0000-4000-8000-000000000001', B='bbbbbbbb-0000-4000-8000-000000000002';
  it('order, case and repeats do not matter; different sets differ', () => {
    expect(liveQfactIssueKey([A,B],U)).toBe(liveQfactIssueKey([B.toUpperCase(),A.toLowerCase(),A],U));
    expect(liveQfactIssueKey([A],U)).not.toBe(liveQfactIssueKey([A,B],U));
  });
  it('Unassigned counts only on its own: "A + Unassigned" is "A"; nothing is Unassigned', () => {
    expect(liveQfactIssueKey([A,U],U)).toBe(liveQfactIssueKey([A],U));
    expect(liveQfactIssueKey([],U)).toBe(liveQfactIssueKey([U],U));
    expect(liveQfactIssueKey([U],U)).not.toBe(liveQfactIssueKey([A],U));
    expect(liveQfactIssueKey([],null)).toBe('');
  });
});
