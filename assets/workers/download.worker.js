const { Queue } = require('bull');
const fs = require('fs');

// The queue name will be passed as an argument
const queueName = process.argv[2];

if (!queueName) {
  console.error('Queue name is required for the worker to start.');
  process.exit(1);
}

console.log(`Worker started for queue: ${queueName}`);

const queue = new Queue(queueName, {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_IP,
    password: process.env.REDIS_PASSWORD,
  },
});

// Process DOWNLOAD tasks
queue.process('DOWNLOAD', 5, async (job) => {
  const { s3Params, tempFilePath, originalFileName, folderPath } = job.data;
  console.log(`[Worker] Processing DOWNLOAD job for ${originalFileName} in queue: ${queueName}`);

  try {
    // Simulate file download
    fs.writeFileSync(tempFilePath, 'Simulated file content');
    console.log(`[Worker] File downloaded to: ${tempFilePath}`);
    job.progress(100);
  } catch (error) {
    console.error(`[Worker] Error processing DOWNLOAD job: ${error.message}`);
    throw error;
  }
});
