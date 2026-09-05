import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { CommunicationsModule } from './communications/communications.module';
import { ServicesModule } from './services/services.module';
import { EngagementsModule } from './engagements/engagements.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    LeadsModule,
    AiModule,
    CommunicationsModule,
    ServicesModule,
    EngagementsModule,
    TasksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
