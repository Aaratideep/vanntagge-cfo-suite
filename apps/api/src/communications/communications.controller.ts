import { Controller, Post, Body } from '@nestjs/common';
import { CommunicationsService } from './communications.service';

interface EmailDto {
  to: string;
  subject: string;
  content: string;
}

interface WhatsappDto {
  to: string;
  message: string;
}

@Controller('communications')
export class CommunicationsController {
  constructor(private readonly commsService: CommunicationsService) {}

  @Post('email')
  async sendEmail(@Body() dto: EmailDto) {
    return this.commsService.sendEmail(dto.to, dto.subject, dto.content);
  }

  @Post('whatsapp')
  async sendWhatsapp(@Body() dto: WhatsappDto) {
    return this.commsService.sendWhatsapp(dto.to, dto.message);
  }
}
