"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CommunicationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationsService = void 0;
const common_1 = require("@nestjs/common");
let CommunicationsService = CommunicationsService_1 = class CommunicationsService {
    constructor() {
        this.logger = new common_1.Logger(CommunicationsService_1.name);
    }
    async sendEmail(to, subject, content) {
        this.logger.log(`[MOCK EMAIL] Sending email to: ${to}`);
        this.logger.log(`[MOCK EMAIL] Subject: ${subject}`);
        this.logger.log(`[MOCK EMAIL] Content: ${content}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: 'Email sent successfully (simulated).' };
    }
    async sendWhatsapp(to, message) {
        this.logger.log(`[MOCK WHATSAPP] Sending message to: ${to}`);
        this.logger.log(`[MOCK WHATSAPP] Message: ${message}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: 'WhatsApp message sent successfully (simulated).' };
    }
};
exports.CommunicationsService = CommunicationsService;
exports.CommunicationsService = CommunicationsService = CommunicationsService_1 = __decorate([
    (0, common_1.Injectable)()
], CommunicationsService);
//# sourceMappingURL=communications.service.js.map