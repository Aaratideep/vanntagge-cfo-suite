import { EngagementsService } from './engagements.service';
import { TasksService } from '../tasks/tasks.service';
export declare class EngagementsController {
    private readonly engagementsService;
    private readonly tasksService;
    constructor(engagementsService: EngagementsService, tasksService: TasksService);
    getClientServices(engagementId: string): Promise<({
        serviceMaster: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            categoryId: string;
            frequency: string | null;
            priority: import(".prisma/client").$Enums.Priority;
        };
        clientParameters: ({
            serviceParameter: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                serviceId: string;
                dataType: string;
                defaultValue: string | null;
                isRequired: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            value: string;
            clientServiceId: string;
            serviceParameterId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        engagementId: string;
        serviceMasterId: string;
    })[]>;
    toggleClientService(engagementId: string, data: {
        serviceMasterId: string;
        isActive: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        engagementId: string;
        serviceMasterId: string;
    }>;
    configureParameter(clientServiceId: string, serviceParameterId: string, data: {
        value: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        value: string;
        clientServiceId: string;
        serviceParameterId: string;
    }>;
    generateTasks(engagementId: string): Promise<{
        success: boolean;
        generatedTasks: number;
    }>;
}
