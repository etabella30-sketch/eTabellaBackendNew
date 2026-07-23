# Issue 034 — annotated export stuck at 20%

## Symptom

An `Export With Annotation` job for case `ca881056-8ae4-4a66-a793-47d9347d4de4` remained at `Processing / 20%` on the Outputs page. The database showed the master row as `P` with progress `20` and its detail row as `I` with no completion timestamp.

## Root cause

`ExportFileService.editFile()` serialized the complete annotation model and passed it to Python as a command-line argument:

```ts
spawn(python, [script, JSON.stringify(jsonData)])
```

When `Include my team's annotations` was enabled, the Claimant's Opening PDF produced a large payload containing hundreds of page markers/highlights. Windows rejected that child process with `spawn ENAMETOOLONG`. The service had no child-process `error` listener, so the queue drain logged the exception but did not update the export/detail rows to `F`; the UI therefore kept polling a permanently processing row.

Evidence from `logs/2026-07-20/export/error.log`:

```text
2026-07-20 19:35:42 [error]: Error draining export queue for case undefined: Error: spawn ENAMETOOLONG
```

## Fix

- Pass the JSON payload over the Python process's UTF-8 stdin and keep only `-` in argv.
- Let `exportfile.py` read stdin when argv is absent or `-`, while retaining argv compatibility for older callers.
- Add a guarded child-process `error` handler.
- Mark the detail and master export rows failed when Python cannot start or exits non-zero, instead of leaving the row processing.
- Await the initial `S` progress update before spawning the worker.

## Regression coverage

`apps/export/src/services/export-file/export-file.service.spec.ts` now verifies:

1. a payload large enough to exceed the Windows command-line limit is written to stdin and is not placed in argv;
2. a simulated `spawn ENAMETOOLONG` updates the export to `F` and resolves the worker promise.

## Verification

- Focused Jest suite: 2/2 passed.
- `npx nest build export`: passed.
- `python -m py_compile assets/pythons/export/exportfile.py`: passed.
- Repository-wide Jest run: the corrected export worker spec passed, but the existing full suite remains red (46 suites passed, 233 failed). The failures are outside this change and are predominantly unresolved Nest test providers, unresolved test-only module aliases, and stale controller scaffold assertions.
- Export service restarted and is listening on port 5009 with the corrected bundle.
- Fresh live export of the same 355-page Claimant PDF with team annotations:
  - export id `90d39cc6-44d9-4ce9-ac50-298485941291`;
  - requested `2026-07-20 19:49:59`;
  - completed `2026-07-20 19:50:09`;
  - database status `C`, progress `100`;
  - visible in the Angular Outputs table as `Ready` with a Download action.
- The user's previously stuck export `5b277ce6-53bc-4d1c-a50b-afaf13d35941` was recovered/retried and is also `C / 100` (completed `2026-07-20 19:46:27`).

## Follow-up: exported mark styles must match the document reader

### Symptom and clarification

The exported PDF initially showed margin icons but did not consistently reproduce the reader's mark styles. The required rule is semantic:

- DocLinks are light blue (`#5aa8ff`) and dotted.
- Facts and QFacts are translucent solid highlights using their issue colours.

### Root cause

The export renderer had diverged from the Angular reader. A temporary correction routed marks by geometry type and consequently rendered a document-linked text selection as a filled blue block. The reader instead treats `linktype` as the primary style: `D` is dotted, while `F` and `QF` are highlighter fills.

The Fact/QFact fill also used `overlay=False`; on PDFs with opaque white page artwork, that could hide the fill behind the page artwork.

### Fix

- Route DocLinks to their dedicated renderer before considering annotation geometry.
- Render DocLink text selections as `#5aa8ff` dotted underlines.
- Render DocLink areas as light-blue, 16%-opacity regions with dotted blue borders.
- Render DocLink ink as dotted blue strokes.
- Keep Fact/QFact rectangles as translucent issue-colour fills.

### Regression coverage and evidence

- `assets/pythons/export/test_exportfile.py` contains four passing tests covering DocLink routing, blue dotted text links, light-blue dotted area links, and visible Fact/QFact overlays.
- Python compile check passed.
- Export service Jest regression: 2/2 passed.
- `npx nest build export`: passed.
- A fresh live export was created through the Angular Evidence dialog with team annotations enabled:
  - export detail id `ebca8ebd-867d-4606-b159-615c4d96f79a`;
  - completed and downloaded successfully;
  - rendered A1.1-6 visibly shows the blue dotted DocLink underline and a separate yellow Fact highlight;
  - rendered A1.1-1 preserves the separate blue, green, and orange Fact/QFact fills.

### Status

DONE_WITH_CONCERNS: the defect is fixed and visually verified. The repository-wide Jest suite still has the unrelated pre-existing failures documented above.

## Follow-up: correct counters and background-style highlights

### Symptoms

- The Annotation Index summary reported `qFact 0 / Facts 2 / DocLinks 1`, even though the selected team annotations were present in the exported document.
- A normal translucent overlay kept the fill visible, but tinted the text because it was composited above the glyphs. The reader's intended appearance is a square highlight behind solid black text.

### Root causes

- `createIndexPages()` counted only the rows returned by `preview_document_list_1`; the Python worker rendered `mdl.highlights`, which also contained selected team marks. The summary and the exported content therefore used different sources.
- Page-range Facts and DocLinks occur once per page in `mdl.highlights`, so a raw array length would over-count them.
- A normal PDF overlay has no background-highlight blending semantics. Placing it below the page content made it disappear on PDFs whose artwork includes an opaque white background.

### Fix

- Count unique semantic annotation IDs from the actual burn payload, grouped by `QF`, `F`, and `D`; fall back to the database rows only for callers that do not provide a highlights array.
- Render square Fact/QFact rectangle annotations with the PDF `Multiply` blend mode at 40% opacity, then bake them into the PDF. This keeps the colour visible while preserving black text above it.
- Retain DocLinks as `#5aa8ff` dotted underlines/regions.

### Verification

- Export service Jest regression: 3/3 passed, including repeated page-marker de-duplication.
- Python renderer regression: 4/4 passed, including the Multiply blend assertion.
- `npx nest build export`: passed.
- The latest real Claimant PDF payload resolves to `qFact 16 / Facts 2 / DocLinks 5` after semantic-ID de-duplication.
- A fresh render of source page A1.1-3 shows the DocLink as a blue dotted underline and both yellow QFact marks behind solid black text; baking leaves zero interactive annotations in the output.

### Status

DONE_WITH_CONCERNS: the counter and compositing defects are fixed and regression-tested. A complete signed-in Angular export could not be repeated after the browser session redirected to login, so validation used the latest real export payload and original case PDF directly. The unrelated repository-wide Jest failures remain as documented above.

## Follow-up: remove highlight outline and include team marks in the index

### Symptoms

- Exported Fact/QFact rectangles showed a thin red/orange outline around the yellow fill.
- A team-mark export burned 7 qFacts and 1 DocLink into the document, but generated no detailed Annotation Index because the legacy preview procedure returned zero owner rows.

### Root causes

- A PyMuPDF Square annotation defaults to a red stroke. In PDF, border width `0` is a device hairline rather than no stroke, so baking retained the red outline.
- `et_preview_document_list_1` is owner-only (`nUserid = exporter`). The burn pipeline already supports shared/admin-visible team marks, so the index and document used different row sources.

### Fix

- Explicitly clear the Square annotation stroke (`stroke=()`) while retaining its issue-colour fill, Multiply blend mode, and 40% opacity.
- Add `et_annotation_index_rows`, which resolves the exact unique Fact/QFact and DocLink IDs selected by the burn payload.
- Pass those IDs from `createIndexPages()` and use the returned rows for the detailed index. This keeps the counter, index sections, and burned document on the same annotation set.
- Include forward and rollback SQL migrations for production deployment.

### Verification

- Focused Jest: 4/4 passed.
- Python renderer regressions: 4/4 passed; compile check passed.
- `npx nest build export`: passed.
- Development database migration applied successfully.
- The real failed export payload (`621bf7f8-0815-4cf8-946e-0815450324a8`) now resolves to 7 fact rows and 1 DocLink row, all on page 3 and with source text present.
- A fresh two-page index PDF generated from that payload shows `qFact 7 / Facts 0 / DocLinks 1`, seven detailed qFact rows, and one detailed DocLink row.
- A fresh baked PDF render contains the yellow highlight with zero red-dominant pixels and zero remaining interactive annotations.

### Status

DONE_WITH_CONCERNS: implementation, database result, index rendering, and highlight-edge rendering are verified. The Angular browser session expired before a final UI-driven export could be submitted; the exporter itself was exercised directly with the same real database payload. The production database still requires the included `.up.sql` migration during deployment.
