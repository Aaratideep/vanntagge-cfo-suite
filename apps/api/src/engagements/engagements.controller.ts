import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { EngagementsService } from './engagements.service';
import { TasksService } from '../tasks/tasks.service';

@Controller('engagements')
export class EngagementsController {
  constructor(
    private readonly engagementsService: EngagementsService,
    private readonly tasksService: TasksService
  ) {}

  @Get(':engagementId/services')
  getClientServices(@Param('engagementId') engagementId: string) {
    return this.engagementsService.getClientServices(engagementId);
  }

  @Post(':engagementId/services/toggle')
  toggleClientService(
    @Param('engagementId') engagementId: string,
    @Body() data: { serviceMasterId: string; isActive: boolean }
  ) {
    return this.engagementsService.toggleClientService(engagementId, data.serviceMasterId, data.isActive);
  }

  @Put('services/:clientServiceId/parameters/:serviceParameterId')
  configureParameter(
    @Param('clientServiceId') clientServiceId: string,
    @Param('serviceParameterId') serviceParameterId: string,
    @Body() data: { value: string }
  ) {
    return this.engagementsService.configureParameter(clientServiceId, serviceParameterId, data.value);
  }

  @Post(':engagementId/generate-tasks')
  generateTasks(@Param('engagementId') engagementId: string) {
    return this.tasksService.generateTasksForEngagement(engagementId);
  }
}

