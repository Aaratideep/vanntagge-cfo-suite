import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async generateTasksForEngagement(engagementId: string) {
    // 1. Fetch the engagement and its active client services
    const engagement = await this.prisma.engagement.findUnique({
      where: { id: engagementId },
      include: {
        clientServices: {
          where: { isActive: true },
          include: {
            serviceMaster: {
              include: {
                taskTemplates: true
              }
            }
          }
        }
      }
    });

    if (!engagement) {
      throw new NotFoundException(`Engagement ${engagementId} not found`);
    }

    let generatedCount = 0;

    // 2. Iterate through active services and their task templates
    for (const clientService of engagement.clientServices) {
      for (const template of clientService.serviceMaster.taskTemplates) {
        // 3. For this current period generation, check if a task already exists for this template/engagement
        // to prevent duplicate generation for the same period.
        // In a real app with billing periods, we'd check the period (e.g. Sept 2026).
        // For now, we'll check if ANY task from this template exists for this engagement that isn't COMPLETED.
        const existingTask = await this.prisma.task.findFirst({
          where: {
            engagementId,
            taskTemplateId: template.id,
            status: { not: 'COMPLETED' }
          }
        });

        if (!existingTask) {
          // Generate the task
          await this.prisma.task.create({
            data: {
              engagementId,
              taskTemplateId: template.id,
              title: template.title,
              milestone: 'Execution', // Default milestone
              estimatedHours: template.estimatedHours,
              priority: template.priority,
              status: 'NOT_STARTED',
              // Example: set due date to 7 days from now
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          });
          generatedCount++;
        }
      }
    }

    return { success: true, generatedTasks: generatedCount };
  }
}

