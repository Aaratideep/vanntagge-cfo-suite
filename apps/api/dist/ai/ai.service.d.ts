import { Response } from 'express';
export interface ChatRequestDto {
    userRole: string;
    activeRoute: string;
    pageTitle: string;
    visiblePageData: any;
    userPrompt: string;
}
export declare class AiService {
    private readonly nemoguardrailsUrl;
    handleChat(chatRequest: ChatRequestDto, res: Response): Promise<void>;
}
