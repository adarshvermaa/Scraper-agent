import { Injectable } from '@nestjs/common';
import { AiService } from '@modules/ai/ai.service';
import Logger from '@common/logger';

export interface EnrichmentResult {
    summary_short: string;
    summary_expanded: string;
    keywords: string[];
    entities: {
        people: string[];
        organizations: string[];
        locations: string[];
        technologies: string[];
    };
    language: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
}

@Injectable()
export class EnrichmentService {
    constructor(private aiService: AiService) { }

    async enrichContent(
        content: string,
        provider: 'openai' | 'anthropic' | 'gemini' = 'gemini'
    ): Promise<EnrichmentResult> {
        try {
            const prompt = `Analyze the following content and extract structured information.

Content:
${content.substring(0, 4000)}

Please provide a JSON response with the following structure:
{
  "summary_short": "A 1-2 sentence summary",
  "summary_expanded": "A detailed 3-4 paragraph summary",
  "keywords": ["keyword1", "keyword2", ...],
  "entities": {
    "people": ["person names"],
    "organizations": ["company/org names"],
    "locations": ["places mentioned"],
    "technologies": ["tech/tools mentioned"]
  },
  "language": "detected language code",
  "sentiment": "positive|neutral|negative"
}`;

            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                { provider, temperature: 0.3 }
            );

            // Parse JSON from response
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse AI response');
            }

            const enrichment = JSON.parse(jsonMatch[0]);
            Logger.info({ enrichment }, 'Content enriched successfully');

            return enrichment;
        } catch (error) {
            Logger.error({ error }, 'Failed to enrich content');
            throw error;
        }
    }

    async extractKeywords(content: string, count: number = 10): Promise<string[]> {
        try {
            const prompt = `Extract the ${count} most important keywords from this content. Return only a JSON array of strings.

Content:
${content.substring(0, 2000)}`;

            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                { provider: 'gemini', temperature: 0.2 }
            );

            const jsonMatch = response.content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                return [];
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            Logger.error({ error }, 'Failed to extract keywords');
            return [];
        }
    }

    async generateSummary(
        content: string,
        length: 'short' | 'long' = 'short'
    ): Promise<string> {
        try {
            const maxLength = length === 'short' ? '1-2 sentences' : '3-4 paragraphs';
            const prompt = `Summarize the following content in ${maxLength}:

${content.substring(0, 4000)}`;

            const response = await this.aiService.chat(
                [{ role: 'user', content: prompt }],
                { provider: 'gemini', temperature: 0.3 }
            );

            return response.content.trim();
        } catch (error) {
            Logger.error({ error }, 'Failed to generate summary');
            throw error;
        }
    }
}
