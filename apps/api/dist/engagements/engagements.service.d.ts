import { PrismaService } from '../prisma/prisma.service';
export declare class EngagementsService {
    private prisma;
    constructor(prisma: PrismaService);
    getClientServices(engagementId: string): Promise<({
        serviceMaster: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            categoryId: string;
            description: string | null;
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
            clientServiceId: string;
            serviceParameterId: string;
            value: string;
        })[];
    } & {
        id: string;
        engagementId: string;
        serviceMasterId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    toggleClientService(engagementId: string, serviceMasterId: string, isActive: boolean): Promise<{
        id: string;
        engagementId: string;
        serviceMasterId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    configureParameter(clientServiceId: string, serviceParameterId: string, value: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        clientServiceId: string;
        serviceParameterId: string;
        value: string;
    }>;
}
