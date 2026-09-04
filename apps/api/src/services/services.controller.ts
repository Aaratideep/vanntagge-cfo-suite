import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Priority } from '@prisma/client';

// Note: In a real app we'd inject organizationId from the JWT Token via Guards.
// For now, we accept it in the payload to establish the API surface.

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post('categories')
  createCategory(@Body() data: { organizationId: string; name: string; description?: string }) {
    return this.servicesService.createCategory(data.organizationId, { name: data.name, description: data.description });
  }

  @Get('categories/:orgId')
  getCategories(@Param('orgId') orgId: string) {
    return this.servicesService.getCategories(orgId);
  }

  @Post('categories/:categoryId/services')
  createService(@Param('categoryId') categoryId: string, @Body() data: { name: string; description?: string; frequency?: string; priority?: Priority }) {
    return this.servicesService.createService(categoryId, data);
  }

  @Get('categories/:categoryId/services')
  getServices(@Param('categoryId') categoryId: string) {
    return this.servicesService.getServicesByCategory(categoryId);
  }

  @Post('master/:serviceId/parameters')
  createParameter(@Param('serviceId') serviceId: string, @Body() data: { name: string; description?: string; dataType: string; defaultValue?: string; isRequired?: boolean }) {
    return this.servicesService.createParameter(serviceId, data);
  }
}

