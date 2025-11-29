import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TextChunk {
  text: string;
  tokens: number;
}

@Injectable()
export class ChunkerService {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(private configService: ConfigService) {
    const config = this.configService.get('chunking');
    this.chunkSize = config.size;
    this.chunkOverlap = config.overlap;
  }

  async chunk(text: string): Promise<TextChunk[]> {
    // Simple character-based chunking
    // In production, use proper tokenizer
    const chunks: TextChunk[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      const chunkText = text.slice(start, end);

      // Estimate tokens (rough approximation: 4 chars per token)
      const tokens = Math.ceil(chunkText.length / 4);

      chunks.push({
        text: chunkText,
        tokens,
      });

      start += this.chunkSize - this.chunkOverlap;
    }

    return chunks;
  }
}
