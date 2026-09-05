import { PrismaService } from '../prisma/prisma.service';
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    generateTasksForEngagement(engagementId: string): Promise<{
        success: boolean;
        generatedTasks: number;
    }>;
}
