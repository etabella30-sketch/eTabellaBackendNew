#!/usr/bin/env node
/**
 * One-shot admin script: apply an object-lifecycle rule to the DigitalOcean
 * Spaces DOWNLOAD bucket so generated case-package archives auto-delete after
 * RETENTION_DAYS. This is the primary auto-delete mechanism for the Outputs
 * feature (the OutputExpiryService cron only reconciles the DB + mops up
 * stragglers). See docs/outputs-feature-plan.md.
 *
 * The download bucket (DO_SPACES_DOWNLOAD_BUCKET_NAME) holds ONLY generated
 * archives — source documents live in a separate bucket — so the rule targets
 * the whole bucket (empty prefix). It also aborts incomplete multipart uploads
 * after 1 day so failed merges don't leave orphaned parts billing forever.
 *
 * SAFETY: dry-run by default (prints the current + proposed config, changes
 * nothing). Pass --apply to actually write it.
 *
 * Run from the repo root with .env.development present (or real env exported):
 *   node scripts/apply-download-lifecycle.js            # dry run
 *   node scripts/apply-download-lifecycle.js --apply    # apply
 *   DOWNLOAD_RETENTION_DAYS=14 node scripts/apply-download-lifecycle.js --apply
 *
 * Keep RETENTION_DAYS in sync with OutputExpiryService.RETENTION_DAYS.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.development') });

const {
  S3Client,
  PutBucketLifecycleConfigurationCommand,
  GetBucketLifecycleConfigurationCommand,
} = require('@aws-sdk/client-s3');

const RETENTION_DAYS = Number(process.env.DOWNLOAD_RETENTION_DAYS || 7);
const bucket = process.env.DO_SPACES_DOWNLOAD_BUCKET_NAME;
const apply = process.argv.includes('--apply');

if (!bucket) {
  console.error('DO_SPACES_DOWNLOAD_BUCKET_NAME is not set. Aborting.');
  process.exit(1);
}
if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET || !process.env.DO_SPACES_ENDPOINT) {
  console.error('DO_SPACES_ENDPOINT / DO_SPACES_KEY / DO_SPACES_SECRET must be set. Aborting.');
  process.exit(1);
}

const client = new S3Client({
  region: 'sgp1',
  endpoint: process.env.DO_SPACES_ENDPOINT,
  forcePathStyle: process.env.DO_S3 === 'MINIO',
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
});

const lifecycleConfiguration = {
  Rules: [
    {
      ID: 'expire-generated-downloads',
      Status: 'Enabled',
      Filter: { Prefix: '' }, // whole bucket — it holds only generated archives
      Expiration: { Days: RETENTION_DAYS },
      AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
    },
  ],
};

(async () => {
  console.log(`Bucket: ${bucket}`);
  console.log(`Endpoint: ${process.env.DO_SPACES_ENDPOINT}`);
  console.log(`Retention: ${RETENTION_DAYS} day(s)\n`);

  try {
    const current = await client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }));
    console.log('Current lifecycle rules:');
    console.log(JSON.stringify(current.Rules ?? [], null, 2));
  } catch (err) {
    if (err?.name === 'NoSuchLifecycleConfiguration') console.log('Current lifecycle rules: (none)');
    else console.log(`Could not read current lifecycle (${err?.name || err?.message}). Continuing.`);
  }

  console.log('\nProposed lifecycle configuration:');
  console.log(JSON.stringify(lifecycleConfiguration, null, 2));

  if (!apply) {
    console.log('\nDRY RUN — nothing written. Re-run with --apply to set this configuration.');
    return;
  }

  await client.send(new PutBucketLifecycleConfigurationCommand({
    Bucket: bucket,
    LifecycleConfiguration: lifecycleConfiguration,
  }));
  console.log('\n✅ Applied. Verifying…');

  const after = await client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }));
  console.log(JSON.stringify(after.Rules ?? [], null, 2));
})().catch((err) => {
  console.error('\nFailed:', err?.message || err);
  process.exit(1);
});
