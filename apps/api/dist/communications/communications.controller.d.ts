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
export declare class CommunicationsController {
    private readonly commsService;
    constructor(commsService: CommunicationsService);
    sendEmail(dto: EmailDto): Promise<{
        success: boolean;
        message: string;
    }>;
    sendWhatsapp(dto: WhatsappDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
