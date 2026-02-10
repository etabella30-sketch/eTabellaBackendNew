module.exports = {
  apps: [
    {
      name: 'download',
      script: './main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '5G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      env: {
        NODE_ENV: 'development',
        // You can include other environment variables or load them from a file
      },
      env_production: {
        NODE_ENV: 'production',
        // Additional production-specific variables can be defined or loaded here
      }
    }
  ]
};
