const { Queue } = require('bull');
const queueName = process.argv[2];

if (!queueName) {
  console.error('Queue name is required');
  process.exit(1);
}

const queue = new Queue(queueName, {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_IP,
    password: process.env.REDIS_PASSWORD,
  },
});

queue.process('DOWNLOAD', async (job) => {
  const { s3Params, tempFilePath, originalFileName } = job.data;

  console.log(`Processing DOWNLOAD task in queue: ${queueName}`);
  // Simulate task logic
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`File downloaded: ${originalFileName}`);
});
