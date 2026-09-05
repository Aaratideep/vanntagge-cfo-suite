import { ServicesService } from './services.service';
import { Priority } from '@prisma/client';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    createCategory(data: {
        organizationId: string;
        name: string;
        description?: string;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        organizationId: string;
    }>;
    getCategories(orgId: string): Promise<({
        services: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            categoryId: string;
            description: string | null;
            frequency: string | null;
            priority: import(".prisma/client").$Enums.Priority;
        }[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        organizationId: string;
    })[]>;
    createService(categoryId: string, data: {
        name: string;
        description?: string;
        frequency?: string;
        priority?: Priority;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        categoryId: string;
        description: string | null;
        frequency: string | null;
        priority: import(".prisma/client").$Enums.Priority;
    }>;
    getServices(categoryId: string): Promise<({
        parameters: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            serviceId: string;
            dataType: string;
            defaultValue: string | null;
            isRequired: boolean;
        }[];
        taskTemplates: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            priority: import(".prisma/client").$Enums.Priority;
            serviceId: string;
            title: string;
            estimatedHours: import("@prisma/client/runtime/library").Decimal;
            isRecurring: boolean;
            recurringFrequency: string | null;
        }[];
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        categoryId: string;
        description: string | null;
        frequency: string | null;
        priority: import(".prisma/client").$Enums.Priority;
    })[]>;
    createParameter(serviceId: string, data: {
        name: string;
        description?: string;
        dataType: string;
        defaultValue?: string;
        isRequired?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        serviceId: string;
        dataType: string;
        defaultValue: string | null;
        isRequired: boolean;
    }>;
}
