export declare class CommunicationsService {
    private readonly logger;
    sendEmail(to: string, subject: string, content: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendWhatsapp(to: string, message: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
