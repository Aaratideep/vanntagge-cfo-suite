import { Response } from 'express';
import { AiService, ChatRequestDto } from './ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(chatRequest: ChatRequestDto, res: Response): Promise<void>;
}
