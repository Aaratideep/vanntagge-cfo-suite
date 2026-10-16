import { PrismaService } from '../prisma/prisma.service';
interface SaveCashFlowDto {
    organizationId: string;
    clientId: string;
    month: number;
    year: number;
    openingCash: number;
    receipts: number;
    payments: number;
    operatingExpenses: number;
    financeCosts: number;
    loanRepayments: number;
    closingCash: number;
}
export declare class FinancialsService {
    private prisma;
    constructor(prisma: PrismaService);
    saveCashFlowData(data: SaveCashFlowDto): Promise<{
        success: boolean;
        period: {
            id: string;
            organizationId: string;
            createdAt: Date;
            updatedAt: Date;
            clientId: string;
            status: import(".prisma/client").$Enums.DocStatus;
            month: number;
            year: number;
        };
        cashFlow: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            financialPeriodId: string;
            openingCash: import("@prisma/client/runtime/library").Decimal;
            receipts: import("@prisma/client/runtime/library").Decimal;
            payments: import("@prisma/client/runtime/library").Decimal;
            operatingExpenses: import("@prisma/client/runtime/library").Decimal;
            financeCosts: import("@prisma/client/runtime/library").Decimal;
            loanRepayments: import("@prisma/client/runtime/library").Decimal;
            closingCash: import("@prisma/client/runtime/library").Decimal;
            netCashFlow: import("@prisma/client/runtime/library").Decimal;
            cashBurn: import("@prisma/client/runtime/library").Decimal;
            runwayMonths: import("@prisma/client/runtime/library").Decimal;
        };
    }>;
    getFinancialData(clientId: string, year: number): Promise<({
        cashFlowData: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            financialPeriodId: string;
            openingCash: import("@prisma/client/runtime/library").Decimal;
            receipts: import("@prisma/client/runtime/library").Decimal;
            payments: import("@prisma/client/runtime/library").Decimal;
            operatingExpenses: import("@prisma/client/runtime/library").Decimal;
            financeCosts: import("@prisma/client/runtime/library").Decimal;
            loanRepayments: import("@prisma/client/runtime/library").Decimal;
            closingCash: import("@prisma/client/runtime/library").Decimal;
            netCashFlow: import("@prisma/client/runtime/library").Decimal;
            cashBurn: import("@prisma/client/runtime/library").Decimal;
            runwayMonths: import("@prisma/client/runtime/library").Decimal;
        };
        metrics: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            value: import("@prisma/client/runtime/library").Decimal;
            financialPeriodId: string;
        }[];
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        clientId: string;
        status: import(".prisma/client").$Enums.DocStatus;
        month: number;
        year: number;
    })[]>;
}
export {};
