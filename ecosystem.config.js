module.exports = {
  apps: [
    {
      name: 'authapi',
      script: './apps/authapi/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // You can include other environment variables or load them from a file
      },
      env_production: {
        NODE_ENV: 'production',
        // Additional production-specific variables can be defined or loaded here
      }
    },
    {
      name: 'coreapi',
      script: './apps/coreapi/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'indexapi',
      script: './apps/indexapi/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'pagination',
      script: './apps/pagination/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'export',
      script: './apps/export/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'download',
      script: './apps/download/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'presentation',
      script: './apps/presentation/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'upload',
      script: './apps/upload/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'hyperlink',
      script: './apps/hyperlink/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'socket-app',
      script: './apps/socket-app/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'batchfile',
      script: './apps/batchfile/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'realtime-server',
      script: './apps/realtime-server/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },
    {
      name: 'ocrbatch',
      script: './ocrbatch/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    },{
      name: 'sfu',
      script: './apps/sfu/main.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 'max', // 'max' to use all CPUs or set a specific number of instances
      exec_mode: 'cluster', // 'cluster' mode to run multiple instances of the same app
      env: {
        NODE_ENV: 'development',
        // Define development environment variables or load them
      },
      env_production: {
        NODE_ENV: 'production',
        // Define production environment variables or load them
      }
    }


  ]
};
