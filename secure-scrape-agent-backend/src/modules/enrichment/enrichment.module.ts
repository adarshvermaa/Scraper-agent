import { Module } from '@nestjs/common';
import { EnrichmentService } from './enrichment.service';
import { AiModule } from '@modules/ai/ai.module';

@Module({
    imports: [AiModule],
    providers: [EnrichmentService],
    exports: [EnrichmentService],
})
export class EnrichmentModule { }
