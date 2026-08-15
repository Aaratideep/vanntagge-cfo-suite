import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  async sendEmail(to: string, subject: string, content: string) {
    this.logger.log(`[MOCK EMAIL] Sending email to: ${to}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${subject}`);
    this.logger.log(`[MOCK EMAIL] Content: ${content}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, message: 'Email sent successfully (simulated).' };
  }

  async sendWhatsapp(to: string, message: string) {
    this.logger.log(`[MOCK WHATSAPP] Sending message to: ${to}`);
    this.logger.log(`[MOCK WHATSAPP] Message: ${message}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, message: 'WhatsApp message sent successfully (simulated).' };
  }
}
