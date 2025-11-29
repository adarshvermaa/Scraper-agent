import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScraperService } from './scraper.service';
import { ScraperProcessor } from './scraper.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scraping',
    }),
  ],
  providers: [ScraperService, ScraperProcessor],
  exports: [ScraperService],
})
export class ScraperModule {}
