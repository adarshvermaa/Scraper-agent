import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SchedulerService } from './scheduler.service';
import { DatabaseModule } from '@modules/database/database.module';

@Module({
    imports: [
        DatabaseModule,
        BullModule.registerQueue({
            name: 'scrape',
        }),
    ],
    providers: [SchedulerService],
    exports: [SchedulerService],
})
export class SchedulerModule { }
