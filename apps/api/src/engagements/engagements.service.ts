import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EngagementsService {
  constructor(private prisma: PrismaService) {}

  // Get all active services mapped to an engagement
  async getClientServices(engagementId: string) {
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

  // Toggle or add a Service to a Client Engagement
  async toggleClientService(engagementId: string, serviceMasterId: string, isActive: boolean) {
    const existing = await this.prisma.clientService.findFirst({
      where: { engagementId, serviceMasterId }
    });

    if (existing) {
      return this.prisma.clientService.update({
        where: { id: existing.id },
        data: { isActive }
      });
    }

    if (!isActive) return null; // Nothing to do if turning off a non-existent service

    return this.prisma.clientService.create({
      data: {
        engagementId,
        serviceMasterId,
        isActive: true,
      }
    });
  }

  // Configure a parameter value for a specific client service
  async configureParameter(clientServiceId: string, serviceParameterId: string, value: string) {
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
}

