import { Module } from '@nestjs/common';
import { McpServer } from './mcp.server';
import { McpController } from './mcp.controller';
import { ScraperModule } from '@modules/scraper/scraper.module';
import { IngestModule } from '@modules/ingest/ingest.module';
import { AiModule } from '@modules/ai/ai.module';
import { VectorStoreModule } from '@modules/vector-store/vector-store.module';

@Module({
  imports: [ScraperModule, IngestModule, AiModule, VectorStoreModule],
  controllers: [McpController],
  providers: [McpServer],
})
export class McpModule { }
