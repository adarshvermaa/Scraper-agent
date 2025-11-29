import * as cheerio from 'cheerio';

export class DomParser {
    parse($: cheerio.CheerioAPI, url: string) {
        return {
            headings: this.extractHeadings($),
            images: this.extractImages($, url),
            canonical_url: this.extractCanonical($, url),
            language: this.extractLanguage($),
        };
    }

    private extractHeadings($: cheerio.CheerioAPI): { h1: string[]; h2: string[]; h3: string[]; h4: string[]; h5: string[]; h6: string[]; } {
        const headings = {
            h1: [] as string[],
            h2: [] as string[],
            h3: [] as string[],
            h4: [] as string[],
            h5: [] as string[],
            h6: [] as string[]
        };

        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
            $(tag).each((_, el) => {
                const text = $(el).text().trim();
                // @ts-ignore
                if (text) headings[tag].push(text);
            });
        });

        return headings;
    }

    private extractImages($: cheerio.CheerioAPI, baseUrl: string) {
        const images: Array<{
            url: string;
            alt: string | null;
            caption: string | null;
            width: number | null;
            height: number | null;
        }> = [];

        $('img').each((_, el) => {
            let src = $(el).attr('src');
            if (!src) return;

            // Resolve relative URLs
            try {
                src = new URL(src, baseUrl).href;
            } catch (e) {
                return;
            }

            const alt = $(el).attr('alt') || null;
            const title = $(el).attr('title') || null;
            const width = parseInt($(el).attr('width') || '0') || null;
            const height = parseInt($(el).attr('height') || '0') || null;

            // Try to find caption (figcaption)
            const caption = $(el).closest('figure').find('figcaption').text().trim() || title;

            images.push({
                url: src,
                alt,
                caption: caption || null,
                width,
                height,
            });
        });

        return images;
    }

    private extractCanonical($: cheerio.CheerioAPI, baseUrl: string): string {
        const canonical = $('link[rel="canonical"]').attr('href');
        if (canonical) {
            try {
                return new URL(canonical, baseUrl).href;
            } catch {
                return baseUrl;
            }
        }
        return baseUrl;
    }

    private extractLanguage($: cheerio.CheerioAPI): string {
        return $('html').attr('lang') || 'en';
    }
}
