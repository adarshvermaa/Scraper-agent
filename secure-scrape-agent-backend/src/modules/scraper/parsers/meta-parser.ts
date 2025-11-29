import * as cheerio from 'cheerio';

export class MetaParser {
    parse($: cheerio.CheerioAPI) {
        const og_meta: Record<string, string> = {};
        const twitter_meta: Record<string, string> = {};
        const other_meta: Record<string, string> = {};

        $('meta').each((_, el) => {
            const property = $(el).attr('property');
            const name = $(el).attr('name');
            const content = $(el).attr('content');

            if (!content) return;

            if (property?.startsWith('og:')) {
                og_meta[property] = content;
            } else if (name?.startsWith('twitter:')) {
                twitter_meta[name] = content;
            } else if (name) {
                other_meta[name] = content;
            }
        });

        return {
            og_meta,
            twitter_meta,
            other_meta,
        };
    }
}
