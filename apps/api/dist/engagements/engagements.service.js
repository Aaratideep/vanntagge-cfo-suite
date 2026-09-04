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
exports.EngagementsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EngagementsService = class EngagementsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getClientServices(engagementId) {
        return this.prisma.clientService.findMany({
            where: { engagementId },
            include: {
                serviceMaster: true,
                clientParameters: {
                    include: { serviceParameter: true }
                }
            }
        });
    }
    async toggleClientService(engagementId, serviceMasterId, isActive) {
        const existing = await this.prisma.clientService.findFirst({
            where: { engagementId, serviceMasterId }
        });
        if (existing) {
            return this.prisma.clientService.update({
                where: { id: existing.id },
                data: { isActive }
            });
        }
        if (!isActive)
            return null;
        return this.prisma.clientService.create({
            data: {
                engagementId,
                serviceMasterId,
                isActive: true,
            }
        });
    }
    async configureParameter(clientServiceId, serviceParameterId, value) {
        const existing = await this.prisma.clientServiceParameter.findFirst({
            where: { clientServiceId, serviceParameterId }
        });
        if (existing) {
            return this.prisma.clientServiceParameter.update({
                where: { id: existing.id },
                data: { value }
            });
        }
        return this.prisma.clientServiceParameter.create({
            data: {
                clientServiceId,
                serviceParameterId,
                value
            }
        });
    }
};
exports.EngagementsService = EngagementsService;
exports.EngagementsService = EngagementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EngagementsService);
//# sourceMappingURL=engagements.service.js.map