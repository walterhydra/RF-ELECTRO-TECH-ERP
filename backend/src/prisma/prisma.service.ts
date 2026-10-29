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
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('PostgreSQL connection established successfully.');
        return;
      } catch (err: any) {
        this.logger.warn(`PostgreSQL connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
        if (attempt === maxRetries) {
          this.logger.error('Failed to establish PostgreSQL connection pool on startup.');
        } else {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }
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
      maxWait: 15000,
      timeout: 30000,
    });
  }
}
