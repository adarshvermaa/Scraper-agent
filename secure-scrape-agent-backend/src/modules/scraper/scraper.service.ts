import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
const TurndownService = require('turndown');
const robotsParser = require('robots-parser');
import { PrismaService } from '@modules/database/prisma.service';
import { ScrapedContent } from './scraper.types';
import Logger from '@common/logger';
import { MetaParser, JsonLdParser, DomParser, ReadabilityParser } from './parsers';

@Injectable()
export class ScraperService {
  private browser: Browser | null = null;
  private turndown: any;
  private readonly config: any;
  private metaParser: MetaParser;
  private jsonLdParser: JsonLdParser;
  private domParser: DomParser;
  private readabilityParser: ReadabilityParser;
  private franc: any;

  constructor(
    private configService: ConfigService,
    @Inject(PrismaService) private prisma: any,
  ) {
    this.config = this.configService.get('scraper');
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    this.metaParser = new MetaParser();
    this.jsonLdParser = new JsonLdParser();
    this.domParser = new DomParser();
    this.readabilityParser = new ReadabilityParser();
  }

  async onModuleInit() {
    await this.initBrowser();
    try {
      // Dynamic import for ESM module
      const { franc } = await import('franc-min');
      this.franc = franc;
    } catch (e) {
      Logger.warn('Failed to load franc-min, language detection will fallback to default');
      this.franc = () => 'en';
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async initBrowser(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      Logger.info('Playwright browser initialized');
    } catch (error) {
      Logger.error({ error }, 'Failed to initialize Playwright browser');
    }
  }

  async scrapeUrl(url: string): Promise<ScrapedContent> {
    if (this.config.respectRobots) {
      const allowed = await this.checkRobots(url);
      if (!allowed) {
        throw new Error(`Robots.txt disallows scraping: ${url}`);
      }
    }

    if (!this.browser) {
      await this.initBrowser();
    }

    const page = await this.browser!.newPage({
      userAgent: this.config.userAgent,
    });

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout,
      });

      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        Logger.warn({ url }, 'Network idle timeout');
      });

      const rawHtml = await page.content();
      const $ = cheerio.load(rawHtml);

      // 1. Parse Meta Tags
      const { og_meta, twitter_meta, other_meta } = this.metaParser.parse($);

      // 2. Parse JSON-LD
      const json_ld = this.jsonLdParser.parse($);

      // 3. Parse DOM Heuristics (Headings, Images, etc.)
      const domData = this.domParser.parse($, url);

      // 4. Readability Parsing (Main Content)
      const readabilityData = this.readabilityParser.parse(rawHtml, url);

      // 5. Language Detection
      let language = domData.language;
      if ((!language || language === 'en') && readabilityData.content_text && this.franc) {
        const detected = this.franc(readabilityData.content_text);
        if (detected && detected !== 'und') {
          language = detected;
        }
      }

      // 6. Author Extraction Strategy
      const author = {
        name:
          readabilityData.byline ||
          other_meta['author'] ||
          og_meta['article:author'] ||
          json_ld.find(i => i['@type'] === 'Person')?.name ||
          null,
        profile_url:
          other_meta['author_url'] ||
          json_ld.find(i => i['@type'] === 'Person')?.url ||
          null,
        contacts: this.extractContactInfo(rawHtml).emails.map(email => ({ email }))
      };

      // 7. Date Extraction Strategy
      const publishedAt =
        other_meta['article:published_time'] ||
        other_meta['publish-date'] ||
        json_ld.find(i => i.datePublished)?.datePublished ||
        $('time').attr('datetime') ||
        null;

      // 8. Markdown Conversion
      const content = this.turndown.turndown(readabilityData.content_html || rawHtml);

      await page.close();

      return {
        url,
        canonical_url: domData.canonical_url,
        title: readabilityData.title || $('title').text().trim(),
        headings: domData.headings,
        published_at: publishedAt,
        author,
        content_text: readabilityData.content_text || $('body').text().trim(),
        content_html: readabilityData.content_html || rawHtml,
        images: domData.images,
        og_meta,
        twitter_meta,
        json_ld,
        language,
        tags: this.extractTags($),
        raw_html: rawHtml,

        // Legacy fields
        content,
        metadata: {
          ...other_meta,
          ...og_meta,
          publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        },
        contactInfo: this.extractContactInfo(readabilityData.content_text || rawHtml)
      };

    } catch (error) {
      await page.close();
      Logger.error({ error, url }, 'Failed to scrape URL');
      throw error;
    }
  }

  private async checkRobots(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const domain = `${urlObj.protocol}//${urlObj.host}`;

      const cached = await this.prisma.robotsCache.findUnique({
        where: { domain },
      });

      let robotsTxt: string;

      if (cached && cached.expiresAt > new Date()) {
        robotsTxt = cached.robotsTxt;
      } else {
        const robotsUrl = `${domain}/robots.txt`;
        const response = await fetch(robotsUrl);
        robotsTxt = response.ok ? await response.text() : '';

        await this.prisma.robotsCache.upsert({
          where: { domain },
          create: {
            domain,
            robotsTxt,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          update: {
            robotsTxt,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }

      const robots = robotsParser(url, robotsTxt);
      return robots.isAllowed(url, this.config.userAgent);
    } catch (error) {
      Logger.warn({ error, url }, 'Failed to check robots.txt, allowing by default');
      return true;
    }
  }

  private extractTags($: cheerio.CheerioAPI): string[] {
    const tags: string[] = [];
    $('meta[property="article:tag"]').each((_, el) => {
      const tag = $(el).attr('content');
      if (tag) tags.push(tag);
    });
    return tags;
  }

  private extractContactInfo(text: string): { emails: string[]; phones: string[]; } {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];

    return {
      emails: [...new Set(emails)],
      phones: [...new Set(phones)],
    };
  }
}
