import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { ScraperService } from './scraper.service';
import Logger from '@common/logger';

export interface ScrapeJob {
  url: string;
  source: string;
}

@Processor('scraping')
export class ScraperProcessor {
  constructor(private scraperService: ScraperService) {}

  @Process('scrape-url')
  async handleScrapeUrl(job: Job<ScrapeJob>) {
    const { url, source } = job.data;
    Logger.info({ url, source, jobId: job.id }, 'Processing scrape job');

    try {
      const content = await this.scraperService.scrapeUrl(url);
      Logger.info({ url, jobId: job.id }, 'Scrape job completed');
      return content;
    } catch (error) {
      Logger.error({ error, url, jobId: job.id }, 'Scrape job failed');
      throw error;
    }
  }
}
