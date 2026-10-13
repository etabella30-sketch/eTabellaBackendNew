import { sourceHearingTimecode } from '@app/api-contracts';
import { adjacentLiveQfactLines, LiveQfactCoordinate, splitLiveQfactLines } from './live-qfact-rules';

const line = (order: number, time: string, run='r1'): LiveQfactCoordinate => ({
  identity: String(order), p:1,l:order,oP:1,oL:order,text:'test',otext:'test',t:time,
  capture:'live-instant',run,order,hearing:sourceHearingTimecode(time),
});
describe('ordinary QFACT line grouping', () => {
  it('groups by consecutive source pairs and breaks the 35-second gap', () => {
    expect(splitLiveQfactLines([line(10,'10:00:00:00'),line(11,'10:00:10:00'),line(12,'10:00:35:00'),line(13,'10:01:10:00')])
      .map(group=>group.map(item=>item.order))).toEqual([[10,11,12],[13]]);
  });
  it('never bridges an unmarked line or a formal restart', () => {
    expect(adjacentLiveQfactLines(line(10,'10:00:00:00'),line(12,'10:00:10:00'))).toBe(false);
    expect(adjacentLiveQfactLines(line(10,'10:00:00:00'),line(11,'10:00:10:00','r2'))).toBe(false);
  });
  it('never groups unknown hearing times', () => {
    expect(adjacentLiveQfactLines(line(10,''),line(11,''))).toBe(false);
  });
  it('uses source time even when captures arrive out of order or much later', () => {
    expect(splitLiveQfactLines([line(12,'10:00:35:00'),line(10,'10:00:00:00'),line(11,'10:00:10:00')]).length).toBe(1);
  });
});
