import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import Logger from '@common/logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        Logger.debug({ query: e.query, duration: e.duration }, 'Prisma Query');
      });
    }

    this.$on('error' as never, (e: any) => {
      Logger.error({ error: e }, 'Prisma Error');
    });

    this.$on('warn' as never, (e: any) => {
      Logger.warn({ warning: e }, 'Prisma Warning');
    });
  }

  async onModuleInit() {
    await this.$connect();
    Logger.info('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    Logger.info('Prisma disconnected from database');
  }
}
