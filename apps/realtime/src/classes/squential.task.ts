export class SequentialTaskQueue {
  private taskQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  /**
   * Add a task to the queue.
   * @param task - A function that returns a promise (the task to execute).
   */
  public async addTask(task: () => Promise<void>) {
    this.taskQueue.push(task);

    // Trigger processing
    this.ensureProcessing();
  }

  /**
   * Add tasks based on data array.
   * @param dataArray - An array of objects to create tasks for.
   * @param taskHandler - A function that processes a single data item.
   */
  public async addDataTasks<T>(
    dataArray: T[],
    taskHandler: (data: T) => Promise<void>
  ) {
    // Generate tasks based on data and add them to the queue
    const tasks = dataArray.map((data) => () => taskHandler(data));
    this.taskQueue.push(...tasks);

    // Ensure processing starts
    this.ensureProcessing();
  }

  /**
   * Ensure the queue is being processed.
   */
  private ensureProcessing() {
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process the queue sequentially.
   */
  private async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.taskQueue.length > 0) {
      const currentTask = this.taskQueue.shift();

      if (!currentTask) {
        continue;
      }

      try {
        await currentTask();
      } catch (error) {
        this.handleTaskError(error);
      }
    }

    // Re-check if new tasks were added during processing
    this.isProcessing = false;
    if (this.taskQueue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Handle errors during task execution.
   * Override or extend this method to customize error handling.
   * @param error - The error thrown by the task.
   */
  protected handleTaskError(error: unknown) {
    console.error('Task execution failed:', error);
  }
}
