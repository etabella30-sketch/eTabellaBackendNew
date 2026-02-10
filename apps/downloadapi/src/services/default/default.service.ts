import { Injectable } from '@nestjs/common';

@Injectable()
export class DefaultService {

    // S3 configuration constants
    S3_AGGENT = { keepAlive: true, maxSockets: 50, keepAliveMsecs: 60000 };
    S3_REQUEST_HEANDLER = { connectionTimeout: 60000, socketTimeout: 60000 }

    S3_SIZE_CONCURRENCY = 20; // Concurrency for size fetch
    S3_MIN_PART_SIZE = 5 * 1024 * 1024; // 5 MB
    S3_MAX_PART_SIZE = 1024 * 1024 * 1024 * 4; // 4 GB

    S3_MAX_BATCH_SIZE = 1024 * 1024 * 1024 * 50; // Max files in a batch

    S3_MAX_PARTS = 10000; // Max parts for S3 multipart upload

    LARGE_BATCH_FILE_SIZE = 1024 * 1024 * 20; // Max file size for S3 operations (5 GB)

    SMALL_PART_MAX_SIZE = 1024 * 1024 * 64;//64; // Max file size for small parts (5 MB)

    UPDATE_BATCH_TO_DB = 500; // size and batch update in batches of 500 to database

    PRESIGNED_URL_EXPIRATION = 7 * 24 * 60 * 60; // 604800 seconds = 7 days

    MAX_COPY_PART_SIZE_IN_FINAL_MEARGE = 5 * 1024 * 1024 * 1024; // 5 GiB SIZE PART for final merge operations
    CONCURRENCY_IN_FINAL_MEARGE = 5; // Concurrency for final merge operations
}
