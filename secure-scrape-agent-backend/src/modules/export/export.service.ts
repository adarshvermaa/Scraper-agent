import { Injectable } from '@nestjs/common';
import { PrismaService } from '@modules/database/prisma.service';
import Logger from '@common/logger';

export interface MappingTemplate {
    id: string;
    name: string;
    description?: string;
    mappings: Record<string, string>; // source field -> target field
    format: 'json' | 'csv' | 'webhook';
    webhookUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExportOptions {
    format: 'json' | 'csv';
    fields?: string[];
    templateId?: string;
}

@Injectable()
export class ExportService {
    constructor(private prisma: PrismaService) { }

    async exportJobs(jobIds: string[], options: ExportOptions): Promise<string> {
        try {
            const jobs = await this.prisma.job.findMany({
                where: { id: { in: jobIds } },
                include: {
                    chunks: true,
                },
            });

            if (options.format === 'json') {
                return this.exportAsJson(jobs, options);
            } else if (options.format === 'csv') {
                return this.exportAsCsv(jobs, options);
            }

            throw new Error(`Unsupported format: ${options.format}`);
        } catch (error) {
            Logger.error({ error, jobIds, options }, 'Failed to export jobs');
            throw error;
        }
    }

    private exportAsJson(jobs: any[], options: ExportOptions): string {
        const mapped = jobs.map(job => this.applyFieldSelection(job, options.fields));
        return JSON.stringify(mapped, null, 2);
    }

    private exportAsCsv(jobs: any[], options: ExportOptions): string {
        if (jobs.length === 0) return '';

        const fields = options.fields || Object.keys(jobs[0]);
        const headers = fields.join(',');

        const rows = jobs.map(job => {
            return fields.map(field => {
                const value = this.getNestedValue(job, field);
                // Escape CSV values
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            }).join(',');
        });

        return [headers, ...rows].join('\n');
    }

    private applyFieldSelection(obj: any, fields?: string[]): any {
        if (!fields) return obj;

        const result: any = {};
        fields.forEach(field => {
            const value = this.getNestedValue(obj, field);
            this.setNestedValue(result, field, value);
        });
        return result;
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    async saveTemplate(template: Omit<MappingTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<MappingTemplate> {
        const saved = await this.prisma.mappingTemplate.create({
            data: {
                name: template.name,
                description: template.description,
                mappings: template.mappings as any,
                format: template.format,
                webhookUrl: template.webhookUrl,
            },
        });

        return saved as MappingTemplate;
    }

    async getTemplates(): Promise<MappingTemplate[]> {
        const templates = await this.prisma.mappingTemplate.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return templates as MappingTemplate[];
    }

    async deleteTemplate(id: string): Promise<void> {
        await this.prisma.mappingTemplate.delete({
            where: { id },
        });
    }

    async sendToWebhook(data: any, webhookUrl: string): Promise<void> {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Webhook failed: ${response.statusText}`);
            }

            Logger.info({ webhookUrl }, 'Data sent to webhook successfully');
        } catch (error) {
            Logger.error({ error, webhookUrl }, 'Failed to send to webhook');
            throw error;
        }
    }
}
