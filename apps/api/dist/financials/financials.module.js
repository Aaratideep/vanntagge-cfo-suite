"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialsModule = void 0;
const common_1 = require("@nestjs/common");
const financials_controller_1 = require("./financials.controller");
const financials_service_1 = require("./financials.service");
const prisma_module_1 = require("../prisma/prisma.module");
let FinancialsModule = class FinancialsModule {
};
exports.FinancialsModule = FinancialsModule;
exports.FinancialsModule = FinancialsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [financials_controller_1.FinancialsController],
        providers: [financials_service_1.FinancialsService],
        exports: [financials_service_1.FinancialsService],
    })
], FinancialsModule);
//# sourceMappingURL=financials.module.js.map