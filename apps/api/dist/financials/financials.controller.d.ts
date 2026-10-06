import { FinancialsService } from './financials.service';
export declare class FinancialsController {
    private readonly financialsService;
    constructor(financialsService: FinancialsService);
    getFinancialData(clientId: string, year: string): Promise<({
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
            createdAt: Date;
            updatedAt: Date;
            name: string;
            financialPeriodId: string;
            value: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        organizationId: string;
        clientId: string;
        month: number;
        year: number;
        status: import(".prisma/client").$Enums.DocStatus;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    saveCashFlow(data: any): Promise<{
        success: boolean;
        period: {
            id: string;
            organizationId: string;
            clientId: string;
            month: number;
            year: number;
            status: import(".prisma/client").$Enums.DocStatus;
            createdAt: Date;
            updatedAt: Date;
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
}
