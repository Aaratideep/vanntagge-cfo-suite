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
exports.EngagementsController = void 0;
const common_1 = require("@nestjs/common");
const engagements_service_1 = require("./engagements.service");
const tasks_service_1 = require("../tasks/tasks.service");
let EngagementsController = class EngagementsController {
    constructor(engagementsService, tasksService) {
        this.engagementsService = engagementsService;
        this.tasksService = tasksService;
    }
    getClientServices(engagementId) {
        return this.engagementsService.getClientServices(engagementId);
    }
    toggleClientService(engagementId, data) {
        return this.engagementsService.toggleClientService(engagementId, data.serviceMasterId, data.isActive);
    }
    configureParameter(clientServiceId, serviceParameterId, data) {
        return this.engagementsService.configureParameter(clientServiceId, serviceParameterId, data.value);
    }
    generateTasks(engagementId) {
        return this.tasksService.generateTasksForEngagement(engagementId);
    }
};
exports.EngagementsController = EngagementsController;
__decorate([
    (0, common_1.Get)(':engagementId/services'),
    __param(0, (0, common_1.Param)('engagementId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EngagementsController.prototype, "getClientServices", null);
__decorate([
    (0, common_1.Post)(':engagementId/services/toggle'),
    __param(0, (0, common_1.Param)('engagementId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EngagementsController.prototype, "toggleClientService", null);
__decorate([
    (0, common_1.Put)('services/:clientServiceId/parameters/:serviceParameterId'),
    __param(0, (0, common_1.Param)('clientServiceId')),
    __param(1, (0, common_1.Param)('serviceParameterId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], EngagementsController.prototype, "configureParameter", null);
__decorate([
    (0, common_1.Post)(':engagementId/generate-tasks'),
    __param(0, (0, common_1.Param)('engagementId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EngagementsController.prototype, "generateTasks", null);
exports.EngagementsController = EngagementsController = __decorate([
    (0, common_1.Controller)('engagements'),
    __metadata("design:paramtypes", [engagements_service_1.EngagementsService,
        tasks_service_1.TasksService])
], EngagementsController);
//# sourceMappingURL=engagements.controller.js.map