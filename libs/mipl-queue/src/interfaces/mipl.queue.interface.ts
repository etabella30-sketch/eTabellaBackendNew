



// interfaces/mipl.queue.interface.ts

/**
 * Configuration interface for RabbitMQ connection settings
 */
export interface RabbitMQConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  virtualHost?: string;
  heartbeat?: number;
  connectTimeout?: number;
}

/**
* Configuration interface for Redis connection settings
*/
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  connectTimeout?: number;
  maxRetriesPerRequest?: number;
}

/**
* Interface defining a queue processing step configuration
*/
export interface QueueStep {
  id:number;
  name:string;
  queue: string;
  concurrency: number;
  maxRetries: number;
  processor: string;
  options?: Record<string, any>;
}

/**
* Main configuration interface for the queue service
*/
export interface MiplQueueOptions {
  name: string;
  maxUsers: number;
  preloadWorkers: boolean;
  parallelWorkersCreation: number;
  steps: QueueStep[];
  retryDelay?: number;
  monitoring?: QueueMonitoringOptions;
}

/**
* Configuration options for queue monitoring
*/
export interface QueueMonitoringOptions {
  enabled: boolean;
  metricsInterval?: number;
  alertThresholds?: {
    errorRate?: number;
    queueSize?: number;
  };
}

/**
* Interface for dead letter queue configuration
*/
export interface DeadLetterConfig {
  exchange: string;
  queue: string;
  routingKey: string;
}

/**
* Interface representing step-specific progress metrics
*/
export interface StepProgress {
  completed: number;
  failed: number;
  pending: number;
  processing: number;
}

/**
* Comprehensive queue progress summary interface
*/
export interface QueueProgressSummary {
  totalTasks: number;
  completed: number;
  failed: number;
  pending: number;
  startTime: string;
  processTime: string;
  lastUpdated: string;
  steps: Record<string, StepProgress>;
}

/**
* Interface for queue task metadata
*/
export interface QueueTask {
  id: string;
  userId: string;
  processId?: string;
  timestamp: string;
  retryCount: number;
  data: any;
  options?: Record<string, any>;
}

/**
* Interface for queue event updates
*/
export interface QueueEvent {
  type: 'taskUpdate' | 'userComplete' | 'error';
  userId: string;
  queueType?: string;
  status?: 'processing' | 'completed' | 'failed';
  taskId?: string;
  error?: string;
  totalProcessed?: number;
  timestamp?: string;
}

/**
* Interface for queue health metrics
*/
export interface QueueHealthMetrics {
  messageProcessed: number;
  processingErrors: number;
  avgProcessingTime: number;
  memoryUsage: number;
  activeConnections: number;
  deadLetterCount: number;
}

/**
* Interface for queue connection status
*/
export interface ConnectionStatus {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
  lastChecked: string;
}

// Add this interface with our other interfaces
export interface DeadLetterStatus {
  queueStats: {
    messageCount: number;
    consumerCount: number;
  };
  failurePatterns: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
  recentFailures: Array<{
    task: any;
    error: string;
    originalQueue: string;
    failedAt: string;
    retryCount: number;
  }>;
}
/**
* Interface for comprehensive queue status
*/
export interface QueueStatus {
  health: {
    rabbitMQ: ConnectionStatus;
    redis: ConnectionStatus;
  };
  metrics: QueueHealthMetrics;
  queues: Record<string, {
    messageCount: number;
    consumerCount: number;
    maxRetries: number;
    concurrency: number;
  }>;
  deadLetter: {
    queueStats: {
      messageCount: number;
      consumerCount: number;
    };
    failurePatterns: Array<{
      error: string;
      count: number;
      percentage: number;
    }>;
    recentFailures: Array<any>;
  };
}


export interface queueTaskList {
  id: string;
  data: any;
  processName?: string;
  step?: string;
  userId?: string;
  masterId?:string;
  nRid?:number;
  nTCatid?:number;
}

