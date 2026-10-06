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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialsController = void 0;
const common_1 = require("@nestjs/common");
const financials_service_1 = require("./financials.service");
let FinancialsController = class FinancialsController {
    constructor(financialsService) {
        this.financialsService = financialsService;
    }
    getFinancialData(clientId, year) {
        const y = year ? parseInt(year, 10) : new Date().getFullYear();
        return this.financialsService.getFinancialData(clientId, y);
    }
    saveCashFlow(data) {
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
};
exports.FinancialsController = FinancialsController;
__decorate([
    (0, common_1.Get)('clients/:clientId'),
    __param(0, (0, common_1.Param)('clientId')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinancialsController.prototype, "getFinancialData", null);
__decorate([
    (0, common_1.Post)('cash-flow'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinancialsController.prototype, "saveCashFlow", null);
exports.FinancialsController = FinancialsController = __decorate([
    (0, common_1.Controller)('financials'),
    __metadata("design:paramtypes", [financials_service_1.FinancialsService])
], FinancialsController);
//# sourceMappingURL=financials.controller.js.map