import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as cron from 'node-cron';
import { PrismaService } from '@modules/database/prisma.service';
import Logger from '@common/logger';

export interface ScheduledJob {
    id: string;
    name: string;
    cronExpression: string;
    urls: string[];
    source: string;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
}

@Injectable()
export class SchedulerService implements OnModuleInit {
    private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

    constructor(
        @InjectQueue('scrape') private scrapeQueue: Queue,
        private prisma: PrismaService,
    ) { }

    async onModuleInit() {
        await this.loadScheduledJobs();
    }

    private async loadScheduledJobs() {
        try {
            const jobs = await this.prisma.scheduledJob.findMany({
                where: { enabled: true },
            });

            for (const job of jobs) {
                this.scheduleJob(job as any);
            }

            Logger.info({ count: jobs.length }, 'Loaded scheduled jobs');
        } catch (error) {
            Logger.error({ error }, 'Failed to load scheduled jobs');
        }
    }

    scheduleJob(job: ScheduledJob) {
        if (!cron.validate(job.cronExpression)) {
            throw new Error(`Invalid cron expression: ${job.cronExpression}`);
        }

        // Remove existing task if any
        this.unscheduleJob(job.id);

        const task = cron.schedule(job.cronExpression, async () => {
            try {
                Logger.info({ jobId: job.id, name: job.name }, 'Running scheduled job');

                await this.scrapeQueue.add('scrape-batch', {
                    urls: job.urls,
                    source: job.source,
                });

                await this.prisma.scheduledJob.update({
                    where: { id: job.id },
                    data: { lastRun: new Date() },
                });
            } catch (error) {
                Logger.error({ error, jobId: job.id }, 'Scheduled job failed');
            }
        });

        this.scheduledTasks.set(job.id, task);
        Logger.info({ jobId: job.id, name: job.name, cron: job.cronExpression }, 'Job scheduled');
    }

    unscheduleJob(jobId: string) {
        const task = this.scheduledTasks.get(jobId);
        if (task) {
            task.stop();
            this.scheduledTasks.delete(jobId);
            Logger.info({ jobId }, 'Job unscheduled');
        }
    }

    async createScheduledJob(data: Omit<ScheduledJob, 'id' | 'lastRun' | 'nextRun'>): Promise<ScheduledJob> {
        const job = await this.prisma.scheduledJob.create({
            data: {
                name: data.name,
                cronExpression: data.cronExpression,
                urls: data.urls,
                source: data.source,
                enabled: data.enabled,
            },
        });

        if (job.enabled) {
            this.scheduleJob(job as any);
        }

        return job as any;
    }

    async updateScheduledJob(id: string, data: Partial<ScheduledJob>): Promise<ScheduledJob> {
        const job = await this.prisma.scheduledJob.update({
            where: { id },
            data,
        });

        if (job.enabled) {
            this.scheduleJob(job as any);
        } else {
            this.unscheduleJob(id);
        }

        return job as any;
    }

    async deleteScheduledJob(id: string): Promise<void> {
        this.unscheduleJob(id);
        await this.prisma.scheduledJob.delete({
            where: { id },
        });
    }

    async getScheduledJobs(): Promise<ScheduledJob[]> {
        const jobs = await this.prisma.scheduledJob.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return jobs as any[];
    }
}
