import { EngagementsService } from './engagements.service';
import { TasksService } from '../tasks/tasks.service';
export declare class EngagementsController {
    private readonly engagementsService;
    private readonly tasksService;
    constructor(engagementsService: EngagementsService, tasksService: TasksService);
    getClientServices(engagementId: string): Promise<({
        serviceMaster: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            categoryId: string;
            frequency: string | null;
            priority: import(".prisma/client").$Enums.Priority;
        };
        clientParameters: ({
            serviceParameter: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
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
            clientServiceId: string;
            serviceParameterId: string;
            value: string;
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
        clientServiceId: string;
        serviceParameterId: string;
        value: string;
    }>;
    generateTasks(engagementId: string): Promise<{
        success: boolean;
        generatedTasks: number;
    }>;
}
