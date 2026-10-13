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

/** Legacy multi-stage controllers must also honor service-level refusals that
 * happen before an SP is called (for example, a revoked share recipient). */
export function assertSaveStage<T>(value: T): T {
  const failure = failedSaveRow(value);
  if (failure || value === false) throw new Error(String(failure?.value ?? 'Save failed'));
  return value;
}
