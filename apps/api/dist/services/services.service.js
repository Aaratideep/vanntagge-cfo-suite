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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ServicesService = class ServicesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCategory(organizationId, data) {
        return this.prisma.serviceCategory.create({
            data: {
                organizationId,
                ...data,
            },
        });
    }
    async getCategories(organizationId) {
        return this.prisma.serviceCategory.findMany({
            where: { organizationId },
            include: { services: true },
        });
    }
    async createService(categoryId, data) {
        return this.prisma.serviceMaster.create({
            data: {
                categoryId,
                name: data.name,
                description: data.description,
                frequency: data.frequency,
                priority: data.priority,
            },
        });
    }
    async getServicesByCategory(categoryId) {
        return this.prisma.serviceMaster.findMany({
            where: { categoryId },
            include: { parameters: true, taskTemplates: true },
        });
    }
    async createParameter(serviceId, data) {
        return this.prisma.serviceParameter.create({
            data: {
                serviceId,
                ...data,
            },
        });
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicesService);
//# sourceMappingURL=services.service.js.map