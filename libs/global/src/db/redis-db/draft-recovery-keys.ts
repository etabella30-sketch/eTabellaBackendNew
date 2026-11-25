/** Recovery transactions must share the existing user's Redis Cluster slot.
 * The legacy session key is untagged; putting its entire name in the hash tag
 * of each new key preserves that slot without changing existing session keys.
 */
function userTag(userId: string): string {
  // Production identities are UUIDs; reject braces so a malformed identity
  // cannot change Redis hash-tag parsing or overlap another user's keyspace.
  if (typeof userId !== 'string' || !userId || /[{}]/.test(userId)) throw new Error('Invalid recovery user');
  return `{user/${userId}}`;
}

export function draftRecoveryEpochKey(userId: string): string {
  return `draft-recovery:epoch:${userTag(userId)}`;
}

export function draftRecoveryRateKey(userId: string): string {
  return `draft-recovery:rate:${userTag(userId)}`;
}

export function draftRecoveryRecordKey(userId: string, draftId: string): string {
  if (typeof draftId !== 'string' || !draftId || /[{}]/.test(draftId)) throw new Error('Invalid recovery draft');
  return `draft-recovery:key:${userTag(userId)}:${draftId}`;
}
