"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
let LeadsService = class LeadsService {
    constructor() {
        this.leads = [];
    }
    async create(leadDto) {
        const lead = { ...leadDto, id: `lead-${Date.now()}`, createdAt: new Date() };
        this.leads.push(lead);
        return lead;
    }
    async findAll() {
        return this.leads;
    }
    async findOne(id) {
        return this.leads.find((l) => l.id === id);
    }
    async update(id, updateDto) {
        const idx = this.leads.findIndex((l) => l.id === id);
        if (idx !== -1) {
            this.leads[idx] = { ...this.leads[idx], ...updateDto, updatedAt: new Date() };
            return this.leads[idx];
        }
        return null;
    }
    async remove(id) {
        const idx = this.leads.findIndex((l) => l.id === id);
        if (idx !== -1) {
            const deleted = this.leads[idx];
            this.leads = this.leads.filter((l) => l.id !== id);
            return deleted;
        }
        return null;
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)()
], LeadsService);
//# sourceMappingURL=leads.service.js.map