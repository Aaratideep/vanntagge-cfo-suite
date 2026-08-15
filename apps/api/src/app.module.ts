import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { CommunicationsModule } from './communications/communications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    LeadsModule,
    AiModule,
    CommunicationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
