import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { DatabaseModule } from '@modules/database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [ExportService],
    exports: [ExportService],
})
export class ExportModule { }
