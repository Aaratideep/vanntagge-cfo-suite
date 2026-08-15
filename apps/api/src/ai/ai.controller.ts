import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AiService, ChatRequestDto } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() chatRequest: ChatRequestDto, @Res() res: Response) {
    return this.aiService.handleChat(chatRequest, res);
  }
}
