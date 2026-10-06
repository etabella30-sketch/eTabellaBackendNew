/**
 * The share list of a fact (`jUsers`), in the one shape realtime.et_fact_insert_team reads (Phase 7b of the
 * shared-libraries plan, item 4, 2026-10-06). Two shapes reached the two hosts before: coreapi's public variant took
 * a JSON array of user ids (`["uuid", ...]`, no rights), realtime-server's took objects (`[{nUserid, bCanEdit,
 * bCanReshare, bCanComment}]`, upserted with the sharer recorded). The realtime SP is the canonical one (D8), so a
 * bare id is read as a view-only share (every right false), which is what the public variant stored (NULL rights);
 * an object keeps its flags. Anything that is not an id or an object with a uuid `nUserid` is dropped. Pure, so the
 * box can validate a relayed body with it too.
 */
import { isUuidText } from '@app/api-kernel';

/** One row of the share list as realtime.et_fact_insert_team reads it. */
export interface ShareRecipient {
  readonly nUserid: string;
  readonly bCanEdit: boolean;
  readonly bCanReshare: boolean;
  readonly bCanComment: boolean;
  readonly bCanCopy?: boolean;
}

const flag = (value: unknown): boolean => value === true || value === 'true';

/** The share list of a request body, whatever shape the client sent: JSON text or an array, of ids or of objects. */
export function normalizeShareRecipients(jUsers: unknown): ShareRecipient[] {
  let parsed: unknown = jUsers;
  if (typeof jUsers === 'string') {
    try {
      parsed = JSON.parse(jUsers);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const out: ShareRecipient[] = [];
  const seen = new Set<string>();
  for (const entry of parsed) {
    let row: ShareRecipient | null = null;
    if (typeof entry === 'string' && isUuidText(entry)) {
      row = { nUserid: entry, bCanEdit: false, bCanReshare: false, bCanComment: false };
    } else if (entry && typeof entry === 'object') {
      const o = entry as Record<string, unknown>;
      if (isUuidText(o.nUserid)) {
        row = { nUserid: o.nUserid, bCanEdit: flag(o.bCanEdit), bCanReshare: flag(o.bCanReshare), bCanComment: flag(o.bCanComment) };
        if (o.bCanCopy !== undefined) row = { ...row, bCanCopy: flag(o.bCanCopy) };
      }
    }
    if (!row) continue;
    const key = row.nUserid.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/** The recipient ids of a share list, other than the caller's own (a self-share is never cross-team). */
export function shareRecipientIds(list: readonly ShareRecipient[], callerId: string): string[] {
  const me = callerId.toLowerCase();
  return list.map((r) => r.nUserid).filter((id) => id.toLowerCase() !== me);
}

/** The list as the SP parameter: JSON text of the object rows. */
export function shareListJson(list: readonly ShareRecipient[]): string {
  return JSON.stringify(list);
}
