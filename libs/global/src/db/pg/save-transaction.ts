import { AsyncLocalStorage } from 'node:async_hooks';
import type { PoolClient } from 'pg';

/** One HTTP save may use both legacy services and shared feature adapters. */
export interface SaveTransaction {
  client: PoolClient;
  failure?: unknown;
  active: boolean;
  afterCommit: Array<() => void | Promise<void>>;
}
export const saveTransaction = new AsyncLocalStorage<SaveTransaction>();
export function currentSaveTransaction(): SaveTransaction | undefined {
  const transaction = saveTransaction.getStore();
  return transaction?.active ? transaction : undefined;
}

export function failedSaveRow(value: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = failedSaveRow(item);
      if (found) return found;
    }
  } else if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    if ('msg' in row && Number(row.msg) !== 1) return row;
  }
  return undefined;
}

/**
 * A stage's refusal row: a rule said no BEFORE anything was written (`cCode` names the rule's DomainError code, the
 * row's `value` its words), as opposed to a failure row (an SP or driver fault, whose `value` is a generic
 * "Failed"). A legacy multi-stage controller answers a refusal row as is (201, the documented `msg -1` contract),
 * so the client learns the reason instead of "not inserted successfully" (R4-009, RT QA 2026-10-28).
 */
export function saveRefusal(value: unknown): Record<string, unknown> | undefined {
  const row = failedSaveRow(value);
  return row && typeof row.cCode === 'string' ? row : undefined;
}

/** Legacy multi-stage controllers must also honor service-level refusals that
 * happen before an SP is called (for example, a revoked share recipient). */
export function assertSaveStage<T>(value: T): T {
  const failure = failedSaveRow(value);
  if (failure || value === false) throw new Error(String(failure?.value ?? 'Save failed'));
  return value;
}
