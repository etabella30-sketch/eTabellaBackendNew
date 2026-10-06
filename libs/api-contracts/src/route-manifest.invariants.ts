/**
 * Pure checks over a manifest. route-manifest.spec.ts runs them on ROUTE_MANIFEST, and from Phase 3 the box and
 * realtime-server manifest specs run them on their derived lists, so a row that breaks R4 / R5 / R6 fails in the
 * lib before any host derives a table or an allowlist from it.
 *
 * The result is one message per violation, each starting with the row id, rather than a boolean: a failing spec
 * then names every broken row at once instead of the first one. An empty array means the manifest is sound.
 */
import type { RouteManifestRow } from './route-manifest.types';

/** Kinds that forward to the cloud and therefore need a `cloudPath`. */
const RELAY_KINDS: ReadonlySet<string> = new Set(['local-or-cloud', 'cloud-read', 'cloud-write']);

/** R5: a team-scoped row is always a relay; `local` or `local-or-cloud` would let the box answer team data itself. */
const TEAM_SCOPED_KINDS: ReadonlySet<string> = new Set(['cloud-read', 'cloud-write']);

export function manifestInvariants(rows: readonly RouteManifestRow[]): readonly string[] {
  const violations: string[] = [];
  const ids = new Set<string>();
  const routeKeys = new Set<string>();

  rows.forEach((row: RouteManifestRow, index: number) => {
    const id = typeof row.id === 'string' && row.id.length > 0 ? row.id : `<row ${index}>`;
    if (id !== row.id) violations.push(`${id}: empty id`);
    if (ids.has(id)) violations.push(`${id}: duplicate id`);
    ids.add(id);

    // Express matches routes case-insensitively, so two rows that differ only in case would shadow each other (R6).
    const routeKey = `${row.family} ${row.method} ${String(row.path).toLowerCase()}`;
    if (routeKeys.has(routeKey)) violations.push(`${id}: duplicate route "${routeKey}"`);
    routeKeys.add(routeKey);

    if (row.teamScoped) {
      if (row.boxOwner !== 'table' && row.boxOwner !== 'controller') {
        violations.push(`${id}: teamScoped row must be a box table row or controller, not "${row.boxOwner}"`);
      }
      if (!TEAM_SCOPED_KINDS.has(String(row.boxKind))) {
        violations.push(`${id}: teamScoped row must relay (cloud-read or cloud-write), not "${String(row.boxKind)}"`);
      }
      // `undefined` is a violation too: the null must be written down, so a reader sees the 503 is intended.
      if (row.offlineBody !== null) violations.push(`${id}: teamScoped row must have offlineBody null (503 offline, never [])`);
    }

    if (row.boxOwner === 'use_cloud' && row.boxKind !== undefined) {
      violations.push(`${id}: use_cloud row carries boxKind "${row.boxKind}"`);
    }
    if (row.boxOwner === 'table' && row.boxKind === undefined) {
      violations.push(`${id}: table row needs a boxKind`);
    }
    if (row.boxKind !== undefined && RELAY_KINDS.has(row.boxKind) && !(typeof row.cloudPath === 'string' && row.cloudPath.length > 0)) {
      violations.push(`${id}: ${row.boxKind} row needs a cloudPath`);
    }

    const targets = row.targetFields ?? [];
    if (row.identity === 'actor+target' && targets.length === 0) {
      violations.push(`${id}: actor+target row names no targetFields`);
    }
    if (row.identity === 'actor' && targets.length > 0) {
      violations.push(`${id}: actor row names targetFields [${targets.join(', ')}]; declare identity actor+target`);
    }
  });

  return violations;
}
