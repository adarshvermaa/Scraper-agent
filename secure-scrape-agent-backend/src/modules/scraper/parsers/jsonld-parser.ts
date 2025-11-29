import * as cheerio from 'cheerio';

export class JsonLdParser {
    parse($: cheerio.CheerioAPI): any[] {
        const jsonLdData: any[] = [];

        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const content = $(el).html();
                if (content) {
                    const parsed = JSON.parse(content);
                    if (Array.isArray(parsed)) {
                        jsonLdData.push(...parsed);
                    } else {
                        jsonLdData.push(parsed);
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        return jsonLdData;
    }
}
