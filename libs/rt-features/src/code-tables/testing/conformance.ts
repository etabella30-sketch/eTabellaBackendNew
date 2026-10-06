/**
 * Gate G2 of the code-tables feature: the same fixture and the same expectation on every host that mounts it
 * (coreapi, realtime-server, the box's relay). A host spec feeds `CODE_ROWS` to its storage fake (or its fake cloud)
 * for category 22 and asserts `expectConformantCodes(answer)`: the rows come back as the SP listed them, in its
 * order, nothing added, nothing dropped (the codes are nobody's data: no team rule, no case). Test code only: never
 * imported by a source file.
 */
import type { CodeRow } from '@app/api-contracts';

/** Codemaster category 22: the party names of the claim form. */
export const CONFORMANCE_CATEGORY = 22;

export const CODE_ROWS: readonly CodeRow[] = Object.freeze([
  { nValue: 1, cKey: 'Claimant', jObject: null, nSerialno: 1 },
  { nValue: 2, cKey: 'Respondent', jObject: null, nSerialno: 2 },
  { nValue: 3, cKey: 'Neutral', jObject: null, nSerialno: 3 },
  { nValue: 4, cKey: 'Unknown', jObject: null, nSerialno: 4 },
]);

/** Throws with the difference when a listing is not the conformant one. */
export function expectConformantCodes(answer: unknown): void {
  const got = JSON.stringify(answer);
  const want = JSON.stringify(CODE_ROWS);
  if (got !== want) throw new Error(`code-tables conformance: expected ${want}\n   got ${got}`);
}
