
export interface RabbitMQConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    virtualHost?: string;
    heartbeat?: number;
    connectTimeout?: number;
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    connectTimeout?: number;
    maxRetriesPerRequest?: number;
}

export interface QueueStep {
    nRid: number;
    id?: number;
    name: string;
    queue: string;
    concurrency: number;
    maxRetries: number;
    processor?: string;
    isMain?: boolean;
    onFailed?: number;
    timeout: number;
    options?: Record<string, any>;
}

export interface AlphaQueueOptions {
    name: string;
    maxUsers: number;
    eventInterval: number;
    nTCatid: number;
    batchInsertion: number
    steps: QueueStep[];
    retryDelay?: number;
}


///////
export interface StepProgress {
    total: number;
    complete: number;
    failed: number;
    pending: number;
    processing: number;
    startDt: string;
    lastDt: string;
}

export interface QueueProgressSummary {
    total: number;
    completed: number;
    failed: number;
    lastUpdated: string;
    processDt: string;
    steps: Record<number, StepProgress>;
}



export interface queueTaskList {
    id: string;
    data: any;
    processName?: string;
    step?: string;
    masterId?: string;
    nRid: number;
    nTCatid: number;
    logPath: string;
}


export interface queueLog {
    id: string;
    nRid: number;
    startdt: string;
    enddt?: string;
    status: 0 | 1
}


export interface queueCreateOptions {
    nTCatid: number,
    steps: QueueStep[],
    MASTER_QUEUE: string
}
