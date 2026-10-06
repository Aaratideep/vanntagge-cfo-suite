"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FinancialsService = class FinancialsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async saveCashFlowData(data) {
        const netCashFlow = data.receipts - data.payments;
        const cashBurn = data.operatingExpenses + data.financeCosts + data.loanRepayments;
        let runwayMonths = 0;
        if (cashBurn > 0) {
            runwayMonths = data.closingCash / cashBurn;
        }
        else if (data.closingCash > 0 && cashBurn <= 0) {
            runwayMonths = 999;
        }
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
    async getFinancialData(clientId, year) {
        return this.prisma.financialPeriod.findMany({
            where: { clientId, year },
            include: {
                cashFlowData: true,
                metrics: true
            },
            orderBy: { month: 'asc' }
        });
    }
};
exports.FinancialsService = FinancialsService;
exports.FinancialsService = FinancialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinancialsService);
//# sourceMappingURL=financials.service.js.map