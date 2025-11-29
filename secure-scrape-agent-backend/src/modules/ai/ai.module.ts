import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  providers: [AiService, OpenAiProvider, AnthropicProvider, GeminiProvider],
  exports: [AiService],
})
export class AiModule { }
