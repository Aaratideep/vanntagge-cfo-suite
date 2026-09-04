import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Priority } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // SERVICE CATEGORIES
  // ==========================================

  async createCategory(organizationId: string, data: { name: string; description?: string }) {
    return this.prisma.serviceCategory.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  async getCategories(organizationId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { organizationId },
      include: { services: true },
    });
  }

  // ==========================================
  // SERVICE MASTER
  // ==========================================

  async createService(categoryId: string, data: { name: string; description?: string; frequency?: string; priority?: Priority }) {
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

  async getServicesByCategory(categoryId: string) {
    return this.prisma.serviceMaster.findMany({
      where: { categoryId },
      include: { parameters: true, taskTemplates: true },
    });
  }

  // ==========================================
  // SERVICE PARAMETERS
  // ==========================================

  async createParameter(serviceId: string, data: { name: string; description?: string; dataType: string; defaultValue?: string; isRequired?: boolean }) {
    return this.prisma.serviceParameter.create({
      data: {
        serviceId,
        ...data,
      },
    });
  }
}

