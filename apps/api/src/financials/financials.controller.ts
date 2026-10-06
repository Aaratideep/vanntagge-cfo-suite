import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { FinancialsService } from './financials.service';

@Controller('financials')
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Get('clients/:clientId')
  getFinancialData(
    @Param('clientId') clientId: string,
    @Query('year') year: string
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.financialsService.getFinancialData(clientId, y);
  }

  @Post('cash-flow')
  saveCashFlow(@Body() data: any) {
    return this.financialsService.saveCashFlowData({
      organizationId: data.organizationId,
      clientId: data.clientId,
      month: parseInt(data.month, 10),
      year: parseInt(data.year, 10),
      openingCash: parseFloat(data.openingCash) || 0,
      receipts: parseFloat(data.receipts) || 0,
      payments: parseFloat(data.payments) || 0,
      operatingExpenses: parseFloat(data.operatingExpenses) || 0,
      financeCosts: parseFloat(data.financeCosts) || 0,
      loanRepayments: parseFloat(data.loanRepayments) || 0,
      closingCash: parseFloat(data.closingCash) || 0,
    });
  }
}

