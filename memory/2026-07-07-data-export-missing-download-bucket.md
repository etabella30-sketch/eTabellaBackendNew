# DEBUG REPORT

- **Symptom:** Outputs export jobs failed in the export worker with `No value provided for input HTTP label: Bucket.` The UI showed failed Recent Outputs rows.
- **Root cause:** `ExportS3Service` reads `DO_SPACES_DOWNLOAD_BUCKET_NAME` for generated export uploads, but the production env file did not define it. The AWS SDK received `Bucket: undefined` in `PutObjectCommand`.
- **Fix:** Added a fail-fast config guard in `apps/export/src/services/s3/s3.service.ts`, added focused coverage in `apps/export/src/services/s3/s3.service.spec.ts`, and added `DO_SPACES_DOWNLOAD_BUCKET_NAME=etabella-downloads` to the local production env file.
- **Evidence:** `npm test -- --runTestsByPath apps/export/src/services/s3/s3.service.spec.ts` passed. `npx nest build export` compiled successfully.
- **Regression test:** `apps/export/src/services/s3/s3.service.spec.ts` verifies missing bucket config throws a clear error and valid config sends `PutObjectCommand` with the download bucket.
- **Related:** This is configuration drift between development/docker env files and production env.
- **Status:** DONE_WITH_CONCERNS: local code and config are fixed; the live server must receive the same env value and restart the export process.
