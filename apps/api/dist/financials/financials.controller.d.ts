import { FinancialsService } from './financials.service';
export declare class FinancialsController {
    private readonly financialsService;
    constructor(financialsService: FinancialsService);
    getFinancialData(clientId: string, year: string): Promise<any>;
    saveCashFlow(data: any): Promise<{
        success: boolean;
        period: any;
        cashFlow: any;
    }>;
}
