import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit() {
    this.logger.log('Initializing PostgreSQL connection pool via Prisma...');
    await this.$connect();
    this.logger.log('PostgreSQL connection established successfully.');
  }

  async onModuleDestroy() {
    this.logger.log('Closing PostgreSQL connection pool...');
    await this.$disconnect();
    this.logger.log('PostgreSQL connection closed.');
  }

  /**
   * Utility method to execute atomic operations within a database transaction
   */
  async executeInTransaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn, {
      maxWait: 5000,
      timeout: 10000,
    });
  }
}
