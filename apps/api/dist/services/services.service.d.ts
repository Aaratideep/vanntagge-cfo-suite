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
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
    }>;
    getCategories(organizationId: string): Promise<({
        services: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            isActive: boolean;
            categoryId: string;
            frequency: string | null;
            priority: import(".prisma/client").$Enums.Priority;
        }[];
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
    })[]>;
    createService(categoryId: string, data: {
        name: string;
        description?: string;
        frequency?: string;
        priority?: Priority;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
        categoryId: string;
        frequency: string | null;
        priority: import(".prisma/client").$Enums.Priority;
    }>;
    getServicesByCategory(categoryId: string): Promise<({
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
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        isActive: boolean;
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
