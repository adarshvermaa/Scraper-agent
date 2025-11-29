import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

// Modules
import { DatabaseModule } from '@modules/database/database.module';
import { VectorStoreModule } from '@modules/vector-store/vector-store.module';
import { AiModule } from '@modules/ai/ai.module';
import { ScraperModule } from '@modules/scraper/scraper.module';
import { IngestModule } from '@modules/ingest/ingest.module';
import { McpModule } from '@modules/mcp/mcp.module';
import { MetricsModule } from '@modules/metrics/metrics.module';
import { PublisherModule } from '@modules/publisher/publisher.module';
import { EventsModule } from '@modules/events/events.module';

// Config
import configuration from '@config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Bull Queue
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),

    // Application modules
    DatabaseModule,
    VectorStoreModule,
    AiModule,
    ScraperModule,
    IngestModule,
    McpModule,
    MetricsModule,
    PublisherModule,
    EventsModule,
  ],
})
export class AppModule {}
