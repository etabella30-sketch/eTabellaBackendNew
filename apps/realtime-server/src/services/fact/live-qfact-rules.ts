import { HearingTimecode, hearingTimecode, withinLiveQfactGap } from '@app/api-contracts';

/** Ordinary transcript coordinates plus internal capture provenance. */
export interface LiveQfactCoordinate {
  readonly identity: string;
  readonly p: number;
  readonly l: number;
  readonly oP: number;
  readonly oL: number;
  readonly text: string;
  readonly otext: string;
  readonly t: string;
  readonly capture: 'live-instant';
  readonly run: string;
  readonly order: number;
  readonly hearing: HearingTimecode | null;
}

export function adjacentLiveQfactLines(left: LiveQfactCoordinate, right: LiveQfactCoordinate): boolean {
  return left.run === right.run && left.order + 1 === right.order
    && withinLiveQfactGap(hearingTimecode(left.hearing), hearingTimecode(right.hearing));
}

export function liveCoordinates(value: unknown): LiveQfactCoordinate[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is LiveQfactCoordinate => !!item && item.capture === 'live-instant'
    && typeof item.identity === 'string' && !!item.identity && typeof item.run === 'string'
    && Number.isInteger(item.order) && Number.isInteger(item.p) && Number.isInteger(item.l))
    .sort((a,b) => a.order-b.order);
}

export function splitLiveQfactLines(lines: readonly LiveQfactCoordinate[]): LiveQfactCoordinate[][] {
  const groups: LiveQfactCoordinate[][] = [];
  for (const line of [...lines].sort((a,b)=>a.order-b.order)) {
    const last = groups[groups.length-1];
    if (last && adjacentLiveQfactLines(last[last.length-1],line)) last.push(line);
    else groups.push([line]);
  }
  return groups;
}
