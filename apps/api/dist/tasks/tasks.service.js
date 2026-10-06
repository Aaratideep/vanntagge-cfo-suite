"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TasksService = class TasksService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateTasksForEngagement(engagementId) {
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
            throw new common_1.NotFoundException(`Engagement ${engagementId} not found`);
        }
        let generatedCount = 0;
        for (const clientService of engagement.clientServices) {
            for (const template of clientService.serviceMaster.taskTemplates) {
                const existingTask = await this.prisma.task.findFirst({
                    where: {
                        engagementId,
                        taskTemplateId: template.id,
                        status: { not: 'COMPLETED' }
                    }
                });
                if (!existingTask) {
                    await this.prisma.task.create({
                        data: {
                            engagementId,
                            taskTemplateId: template.id,
                            title: template.title,
                            milestone: 'Execution',
                            estimatedHours: template.estimatedHours,
                            priority: template.priority,
                            status: 'NOT_STARTED',
                            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                        }
                    });
                    generatedCount++;
                }
            }
        }
        return { success: true, generatedTasks: generatedCount };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map