import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';

export interface ChatRequestDto {
  userRole: string;
  activeRoute: string;
  pageTitle: string;
  visiblePageData: any;
  userPrompt: string;
}

@Injectable()
export class AiService {
  private readonly nemoguardrailsUrl = 'http://localhost:8000/api/chat';

  async handleChat(chatRequest: ChatRequestDto, res: Response) {
    try {
      const response = await fetch(this.nemoguardrailsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatRequest),
      });

      if (!response.ok) {
        throw new Error(`NeMo service responded with status ${response.status}`);
      }

      res.setHeader('Content-Type', 'text/plain');
      // Pipe the Web Streams API response to the Express Response
      const nodeStream = Readable.fromWeb(response.body as any);
      nodeStream.pipe(res);
      
    } catch (error) {
      console.error('Error connecting to NeMo Guardrails service:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'AI Copilot service is currently unavailable.' });
      } else {
        res.end();
      }
    }
  }
}
