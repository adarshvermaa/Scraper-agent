import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { ScraperService } from '@modules/scraper/scraper.service';
import { IngestService } from '@modules/ingest/ingest.service';
import Logger from '@common/logger';

export interface ScrapeJobData {
    url: string;
    source: string;
    retryCount?: number;
}

@Processor('scrape')
export class ScrapeProcessor {
    constructor(
        private scraperService: ScraperService,
        private ingestService: IngestService,
    ) { }

    @Process('scrape-url')
    async handleScrapeUrl(job: Job<ScrapeJobData>) {
        const { url, source } = job.data;

        try {
            Logger.info({ url, jobId: job.id }, 'Processing scrape job');

            // Update progress
            await job.progress(10);

            // Scrape content
            const scrapedContent = await this.scraperService.scrapeUrl(url);
            await job.progress(50);

            // Ingest
            const jobId = await this.ingestService.ingestJob(scrapedContent, source);
            await job.progress(100);

            Logger.info({ url, jobId }, 'Scrape job completed successfully');

            return { success: true, jobId };
        } catch (error) {
            Logger.error({ error, url }, 'Scrape job failed');
            throw error;
        }
    }

    @Process('scrape-batch')
    async handleBatchScrape(job: Job<{ urls: string[]; source: string; }>) {
        const { urls, source } = job.data;
        const results = [];

        for (let i = 0; i < urls.length; i++) {
            try {
                const scrapedContent = await this.scraperService.scrapeUrl(urls[i]);
                const jobId = await this.ingestService.ingestJob(scrapedContent, source);

                results.push({ url: urls[i], success: true, jobId });
                await job.progress((i + 1) / urls.length * 100);
            } catch (error) {
                results.push({ url: urls[i], success: false, error: error.message });
            }
        }

        return { results, total: urls.length };
    }
}
