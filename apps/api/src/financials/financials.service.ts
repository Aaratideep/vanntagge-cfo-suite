import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class FinancialsService {
  constructor(private prisma: PrismaService) {}

  async saveCashFlowData(data: SaveCashFlowDto) {
    // 1. Calculate computed fields
    const netCashFlow = data.receipts - data.payments;
    const cashBurn = data.operatingExpenses + data.financeCosts + data.loanRepayments;
    
    // Default Runway calculation: Closing Cash / Monthly Burn. 
    // Prevent division by zero.
    let runwayMonths = 0;
    if (cashBurn > 0) {
      runwayMonths = data.closingCash / cashBurn;
    } else if (data.closingCash > 0 && cashBurn <= 0) {
      runwayMonths = 999; // Infinite/very long runway
    }

    // 2. Find or create the Financial Period
    let period = await this.prisma.financialPeriod.findUnique({
      where: {
        clientId_month_year: {
          clientId: data.clientId,
          month: data.month,
          year: data.year,
        }
      }
    });

    if (!period) {
      period = await this.prisma.financialPeriod.create({
        data: {
          organizationId: data.organizationId,
          clientId: data.clientId,
          month: data.month,
          year: data.year,
        }
      });
    }

    // 3. Upsert Cash Flow Data
    const cashFlow = await this.prisma.cashFlowData.upsert({
      where: {
        financialPeriodId: period.id,
      },
      update: {
        openingCash: data.openingCash,
        receipts: data.receipts,
        payments: data.payments,
        operatingExpenses: data.operatingExpenses,
        financeCosts: data.financeCosts,
        loanRepayments: data.loanRepayments,
        closingCash: data.closingCash,
        netCashFlow,
        cashBurn,
        runwayMonths,
      },
      create: {
        financialPeriodId: period.id,
        openingCash: data.openingCash,
        receipts: data.receipts,
        payments: data.payments,
        operatingExpenses: data.operatingExpenses,
        financeCosts: data.financeCosts,
        loanRepayments: data.loanRepayments,
        closingCash: data.closingCash,
        netCashFlow,
        cashBurn,
        runwayMonths,
      }
    });

    // 4. Upsert Runway Metric for Generic Reporting
    await this.prisma.financialMetric.upsert({
      where: {
        financialPeriodId_name: {
          financialPeriodId: period.id,
          name: 'Runway (Months)'
        }
      },
      update: { value: runwayMonths },
      create: {
        financialPeriodId: period.id,
        name: 'Runway (Months)',
        value: runwayMonths
      }
    });

    // 5. Upsert Burn Rate Metric for Generic Reporting
    await this.prisma.financialMetric.upsert({
      where: {
        financialPeriodId_name: {
          financialPeriodId: period.id,
          name: 'Monthly Cash Burn'
        }
      },
      update: { value: cashBurn },
      create: {
        financialPeriodId: period.id,
        name: 'Monthly Cash Burn',
        value: cashBurn
      }
    });

    return { success: true, period, cashFlow };
  }

  async getFinancialData(clientId: string, year: number) {
    return this.prisma.financialPeriod.findMany({
      where: { clientId, year },
      include: {
        cashFlowData: true,
        metrics: true
      },
      orderBy: { month: 'asc' }
    });
  }
}
