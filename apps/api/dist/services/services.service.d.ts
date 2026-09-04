import { PrismaService } from '../prisma/prisma.service';
import { Priority } from '@prisma/client';
export declare class ServicesService {
    private prisma;
    constructor(prisma: PrismaService);
    createCategory(organizationId: string, data: {
        name: string;
        description?: string;
    }): Promise<{
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCategories(organizationId: string): Promise<({
        services: {
            id: string;
            name: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            frequency: string | null;
            priority: import(".prisma/client").$Enums.Priority;
        }[];
    } & {
        id: string;
        organizationId: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    createService(categoryId: string, data: {
        name: string;
        description?: string;
        frequency?: string;
        priority?: Priority;
    }): Promise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        frequency: string | null;
        priority: import(".prisma/client").$Enums.Priority;
    }>;
    getServicesByCategory(categoryId: string): Promise<({
        parameters: {
            id: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            serviceId: string;
            dataType: string;
            defaultValue: string | null;
            isRequired: boolean;
        }[];
        taskTemplates: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            priority: import(".prisma/client").$Enums.Priority;
            serviceId: string;
            title: string;
            estimatedHours: import("@prisma/client/runtime/library").Decimal;
            isRecurring: boolean;
            recurringFrequency: string | null;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
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
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        serviceId: string;
        dataType: string;
        defaultValue: string | null;
        isRequired: boolean;
    }>;
}
