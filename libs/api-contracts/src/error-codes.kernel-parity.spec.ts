/**
 * DOMAIN_ERROR_CODES (runtime list here) and @app/api-kernel's `DomainErrorCode` (a type there) must name the same
 * codes, and the two DOMAIN_ERROR_STATUS tables (the kernel keeps one for DomainErrorFilter's fallback answer) must
 * agree per code. Kept in its own spec so that only this file depends on @app/api-kernel: the lib's other specs
 * stay green while the kernel changes, and a kernel edit that adds a code fails exactly one named spec. The lib's
 * sources never import the kernel at runtime (api-contracts.purity.spec.ts); this spec may.
 */
import * as kernel from '@app/api-kernel';
import type { DomainErrorCode } from '@app/api-kernel';
import { DOMAIN_ERROR_CODES, DOMAIN_ERROR_STATUS } from './error-codes';

/** `true` only when A and B are the same type in both directions. */
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

const listMatchesKernelType: Equals<typeof DOMAIN_ERROR_CODES[number], DomainErrorCode> = true;

/** Every kernel code has a status (and only kernel codes do). */
const statusCoversKernel: Equals<keyof typeof DOMAIN_ERROR_STATUS, DomainErrorCode> = true;

describe('libs/api-contracts DOMAIN_ERROR_CODES parity with @app/api-kernel', () => {
  it('names exactly the codes of the kernel DomainErrorCode union', () => {
    expect([listMatchesKernelType, statusCoversKernel]).toEqual([true, true]);
    expect(DOMAIN_ERROR_CODES.length).toBe(10);
  });

  it('answers the same status per code as the kernel fallback table', () => {
    expect(DOMAIN_ERROR_STATUS).toEqual(kernel.DOMAIN_ERROR_STATUS);
  });
});
