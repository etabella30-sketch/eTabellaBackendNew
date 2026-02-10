import { Injectable } from '@nestjs/common';
import * as moment from 'moment';  // Make sure to install moment if it's not already installed

import * as schedule from 'node-schedule';
@Injectable()
export class SchedulerService {
    private jobs: Array<{ jobId: string, TaskId: string, job: schedule.Job }> = [];

    scheduleTask(TaskId: string, dateTimeStr: string, task: () => void): string {
        console.log('befour', dateTimeStr)

        if (this.isJobScheduled(TaskId)) {
            console.log(`A job for TaskId ${TaskId} is already scheduled.`);
            return this.getJobsByTaskId(TaskId)[0].jobId;  // Return existing job ID if already scheduled
        }

        const date = this.convertToDateTime(dateTimeStr);
        const jobId = `job-${TaskId}-${new Date().getTime()}`; // Create a unique jobId
        const job = schedule.scheduleJob(jobId, date, () => {
            console.log(`Executing task for user ${TaskId} at ${date}`);
            task();
            this.removeJob(jobId); // Optionally remove job from array after execution
        });

        this.jobs.push({ jobId, TaskId, job });
        console.log(`Scheduled job ${jobId} for user ${TaskId} at ${date}`);
        return jobId;
    }

    convertToDateTime(dateTimeStr: string): Date {
        // Assuming dateTimeStr is in 'YYYY-MM-DD HH:mm:ss' format
        const dateTime = moment(dateTimeStr, 'YYYY-MM-DD HH:mm:ss').toDate();
        if (!dateTime.getTime()) {
            throw new Error('Invalid date format');
        }
        return dateTime;
    }

    isJobScheduled(TaskId: string): boolean {
        return this.jobs.some(job => job.TaskId === TaskId);
    }


    removeJob(jobId: string): void {
        this.jobs = this.jobs.filter(job => job.jobId !== jobId);
        console.log(`Job ${jobId} removed from schedule.`);
    }

    getJobsByTaskId(TaskId: string): Array<{ jobId: string, job: schedule.Job }> {
        return this.jobs.filter(job => job.TaskId === TaskId);
    }

    cancelJob(jobId: string): void {
        const jobIndex = this.jobs.findIndex(job => job.jobId === jobId);
        if (jobIndex !== -1) {
            this.jobs[jobIndex].job.cancel();
            this.jobs.splice(jobIndex, 1);
            console.log(`Job ${jobId} canceled.`);
        } else {
            console.log(`Job ${jobId} not found.`);
        }
    }

    setTimezone(timezone: string): void {
        console.log(`Setting timezone to ${timezone}`);
        // This is a placeholder as moment usually handles this globally if needed
        // or it's just used for logging/debugging in this context.
    }
}
