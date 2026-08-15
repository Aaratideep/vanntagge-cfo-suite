import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to database');
    } catch (error: any) {
      console.warn('Failed to connect to database on startup. Ensure DATABASE_URL is set in .env');
      console.warn(error.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
