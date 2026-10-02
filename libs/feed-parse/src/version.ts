/**
 * Version of the parser's output contract: the line tuples, everything the
 * parser delivers, and their canonical form (DET-10, rt-local-edge spec
 * §6.1). A session records the version that produced its pages
 * (RSessionMaster.cParserVer, Phase 2), a venue box release records it in its
 * manifest (tools/ci/release-edge.js), and tools/ci/rt-deploy-check.js refuses
 * a cloud deploy whose version differs from any live box session.
 *
 * Form: `<semver>+<golden-set digest>`.
 *  - The semver is bumped BY HAND whenever the parser's output changes on
 *    purpose, which is whenever the golden replay gate
 *    (node tools/ci/golden-replay-gate.js) shows an intended difference in
 *    ANY of: the final line buffer (any tuple field); anything the parser
 *    delivers (every emitLocal / emitDelivery / savePageData payload, the ids
 *    of a removeLines call), chunk by chunk; the canonical pages
 *    (libs/edge-sync canonical.ts). A delivery-only change, the buffer
 *    unchanged, needs a bump just the same. Minor for an intended output
 *    change, major for an incompatible tuple shape or canonical form.
 *  - The digest is written by `node tools/ci/golden-replay-gate.js --update`
 *    (sha256 over the output digest of every COMMITTED golden: the in-repo
 *    corpora's and the extended corpora's, which are digest-only files in the
 *    repo, so every machine computes the same string). The gate fails when it
 *    does not match the goldens, so golden output never changes without this
 *    string changing, including an output change only the real hearings show
 *    (re-recorded even with --force). `--update` refuses to re-record goldens
 *    stamped with the current semver: bump first, then --update, in the same
 *    commit, where the extended corpora's folder exists.
 *  - A change that leaves every golden identical keeps the version.
 *  - Adding or editing a corpus changes the digest (so the version string)
 *    even with no parser change: batch corpus edits with a parser release.
 *
 * History:
 *  - 1.0.0: the Phase-2 port.
 *  - 1.1.0 (2026-10-01): DET-1…DET-12 ([6] from the lib's allocator, the
 *    CaseView [0] from the receive time, payload copies, ...), the CaseView
 *    line-loss fix (D30: every changed line delivered, not the last two), the
 *    G page-start fix and the D-inside-refresh fix (README in
 *    tools/ci/golden-replay lists which goldens changed and why). PENDING
 *    SIGN-OFF: DET-3 also changes the order of a replacement line and a kept
 *    line that share a timecode (an RC-1 exception the ledger has not
 *    approved yet; README "Parser version 1.1.0", items 5 and 6).
 *
 * release-edge reads this literal from source, so keep it a plain string.
 */
export const FEED_PARSE_VERSION = '1.1.0+46cac54d63e5095e';
