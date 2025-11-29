import { Readability } from '@mozilla/readability';
const { JSDOM } = require('jsdom');

export class ReadabilityParser {
    parse(html: string, url: string) {
        try {
            const doc = new JSDOM(html, { url });
            const reader = new Readability(doc.window.document);
            const article = reader.parse();

            if (!article) {
                return {
                    title: '',
                    content_text: '',
                    content_html: '',
                    byline: null,
                    excerpt: null,
                };
            }

            return {
                title: article.title,
                content_text: article.textContent,
                content_html: article.content,
                byline: article.byline,
                excerpt: article.excerpt,
            };
        } catch (error) {
            return {
                title: '',
                content_text: '',
                content_html: '',
                byline: null,
                excerpt: null,
            };
        }
    }
}
