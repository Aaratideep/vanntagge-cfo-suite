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
        period: any;
        cashFlow: any;
    }>;
    getFinancialData(clientId: string, year: number): Promise<any>;
}
export {};
