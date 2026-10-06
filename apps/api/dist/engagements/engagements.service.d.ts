import { PrismaService } from '../prisma/prisma.service';
export declare class EngagementsService {
    private prisma;
    constructor(prisma: PrismaService);
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
    toggleClientService(engagementId: string, serviceMasterId: string, isActive: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        engagementId: string;
        serviceMasterId: string;
    }>;
    configureParameter(clientServiceId: string, serviceParameterId: string, value: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        value: string;
        clientServiceId: string;
        serviceParameterId: string;
    }>;
}
