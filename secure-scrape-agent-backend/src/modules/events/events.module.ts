import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { IngestModule } from '@modules/ingest/ingest.module';
import { ScraperModule } from '@modules/scraper/scraper.module';
import { AiModule } from '@modules/ai/ai.module';
import { DatabaseModule } from '@modules/database/database.module';
import { MetricsModule } from '@modules/metrics/metrics.module';

@Module({
  imports: [
    IngestModule,
    ScraperModule,
    AiModule,
    DatabaseModule,
    MetricsModule,
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
