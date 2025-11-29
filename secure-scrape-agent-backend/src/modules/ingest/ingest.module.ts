import { Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { ChunkerService } from './chunker.service';
import { AiModule } from '@modules/ai/ai.module';
import { VectorStoreModule } from '@modules/vector-store/vector-store.module';

@Module({
  imports: [AiModule, VectorStoreModule],
  providers: [IngestService, ChunkerService],
  exports: [IngestService],
})
export class IngestModule {}
